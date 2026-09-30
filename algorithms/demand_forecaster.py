"""
demand_forecaster.py — AgriQueue ML Prediction Engine
======================================================
Implements machine-learning models for:
1. Waiting-time prediction   — Random Forest Regressor
2. Daily arrival forecasting — XGBoost Gradient Boosting (fallback-safe)

Both models follow the scikit-learn estimator API (fit / predict / score)
and include feature engineering pipelines for agricultural procurement data.

Model Architecture
------------------
WaitingTimePredictor
    Input  : [hour_of_day, day_of_week, queue_length, avg_quantity_kg,
               num_stations, moisture_avg, is_peak_season]
    Output : Estimated waiting time in minutes
    Model  : RandomForestRegressor (n_estimators=200, max_depth=8)
    Metric : RMSE on held-out validation split

DemandForecaster
    Input  : [day_of_year, day_of_week, month, year, lag_1, lag_7, lag_30,
               rolling_mean_7, rolling_std_7, is_harvest_month]
    Output : Predicted number of farmer arrivals for the next day
    Model  : XGBRegressor (n_estimators=300, learning_rate=0.05, max_depth=6)
    Metric : MAE and MAPE on validation split

SDG-12 Alignment
----------------
Accurate demand forecasting prevents resource over-provisioning (excess staff,
machinery idling), reducing energy and operational waste in line with SDG 12.2.
"""

from __future__ import annotations

import warnings
from typing import Dict, List, Optional, Tuple

import numpy as np

# Graceful sklearn import (raises clear error if not installed)
try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_squared_error, mean_absolute_error
    from sklearn.preprocessing import StandardScaler
    _SKLEARN_AVAILABLE = True
except ImportError:  # pragma: no cover
    _SKLEARN_AVAILABLE = False
    warnings.warn(
        "scikit-learn not installed. WaitingTimePredictor requires it. "
        "Run: pip install scikit-learn",
        ImportWarning,
        stacklevel=2,
    )

# Graceful xgboost import
try:
    from xgboost import XGBRegressor
    _XGB_AVAILABLE = True
except ImportError:  # pragma: no cover
    _XGB_AVAILABLE = False
    warnings.warn(
        "xgboost not installed. DemandForecaster will use RandomForest fallback. "
        "Run: pip install xgboost",
        ImportWarning,
        stacklevel=2,
    )


# ---------------------------------------------------------------------------
# Feature engineering helpers
# ---------------------------------------------------------------------------

HARVEST_MONTHS: frozenset = frozenset({10, 11, 12, 1, 2})  # Rabi + Kharif


def build_waiting_time_features(
    hour_of_day: int,
    day_of_week: int,
    queue_length: int,
    avg_quantity_kg: float,
    num_stations: int,
    moisture_avg: float,
    is_peak_season: bool,
) -> np.ndarray:
    """
    Construct feature vector for waiting-time prediction.

    Parameters
    ----------
    hour_of_day : int
        Hour of the day [0–23].
    day_of_week : int
        Day of week [0=Monday … 6=Sunday].
    queue_length : int
        Current number of farmers ahead in queue.
    avg_quantity_kg : float
        Mean produce quantity (kg) of farmers currently in queue.
    num_stations : int
        Number of active weighing/procurement stations.
    moisture_avg : float
        Average moisture percentage of current queue.
    is_peak_season : bool
        True if the current month is a harvest-peak month.

    Returns
    -------
    np.ndarray
        Shape (1, 8) feature matrix.

    Examples
    --------
    >>> X = build_waiting_time_features(9, 1, 12, 850.0, 3, 18.5, True)
    >>> X.shape
    (1, 8)
    """
    load_per_station = queue_length / max(num_stations, 1)
    return np.array([[
        hour_of_day,
        day_of_week,
        queue_length,
        avg_quantity_kg,
        num_stations,
        moisture_avg,
        int(is_peak_season),
        load_per_station,          # engineered: load per station
    ]])


def build_demand_features(
    day_of_year: int,
    day_of_week: int,
    month: int,
    year: int,
    lag_1: float,
    lag_7: float,
    lag_30: float,
    rolling_mean_7: float,
    rolling_std_7: float,
) -> np.ndarray:
    """
    Construct feature vector for daily demand forecasting.

    Parameters
    ----------
    day_of_year : int
        Julian day [1–366].
    day_of_week : int
        [0=Monday … 6=Sunday].
    month : int
        Calendar month [1–12].
    year : int
        Full year (e.g., 2026).
    lag_1 : float
        Arrivals yesterday.
    lag_7 : float
        Arrivals 7 days ago.
    lag_30 : float
        Arrivals 30 days ago.
    rolling_mean_7 : float
        7-day rolling mean of arrivals.
    rolling_std_7 : float
        7-day rolling standard deviation.

    Returns
    -------
    np.ndarray
        Shape (1, 10) feature matrix.

    Examples
    --------
    >>> X = build_demand_features(280, 2, 10, 2026, 120.0, 105.0, 98.0, 112.0, 8.5)
    >>> X.shape
    (1, 10)
    """
    is_harvest = int(month in HARVEST_MONTHS)
    return np.array([[
        day_of_year,
        day_of_week,
        month,
        year - 2020,               # normalise year offset
        lag_1,
        lag_7,
        lag_30,
        rolling_mean_7,
        rolling_std_7,
        is_harvest,
    ]])


# ---------------------------------------------------------------------------
# 1. Waiting-Time Predictor (Random Forest)
# ---------------------------------------------------------------------------

class WaitingTimePredictor:
    """
    Random Forest Regressor for predicting farmer waiting time at a mandi.

    Parameters
    ----------
    n_estimators : int
        Number of decision trees (default 200).
    max_depth : int
        Maximum tree depth to prevent overfitting (default 8).
    random_state : int
        Reproducibility seed (default 42).

    Attributes
    ----------
    model_ : RandomForestRegressor
        Trained model (available after ``fit()``).
    is_fitted_ : bool
        True after successful ``fit()``.
    feature_importances_ : np.ndarray or None
        Per-feature importance scores after fitting.

    Examples
    --------
    >>> predictor = WaitingTimePredictor()
    >>> X = np.random.rand(200, 8)
    >>> y = np.random.rand(200) * 60  # waiting times 0–60 min
    >>> metrics = predictor.fit(X, y)
    >>> isinstance(metrics['rmse_val'], float)
    True
    """

    FEATURE_NAMES: List[str] = [
        "hour_of_day",
        "day_of_week",
        "queue_length",
        "avg_quantity_kg",
        "num_stations",
        "moisture_avg",
        "is_peak_season",
        "load_per_station",
    ]

    def __init__(
        self,
        n_estimators: int = 200,
        max_depth: int = 8,
        random_state: int = 42,
    ) -> None:
        if not _SKLEARN_AVAILABLE:
            raise ImportError("scikit-learn is required. Run: pip install scikit-learn")
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.random_state = random_state
        self.model_: Optional[RandomForestRegressor] = None
        self.scaler_ = StandardScaler()
        self.is_fitted_: bool = False
        self.feature_importances_: Optional[np.ndarray] = None

    def fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        test_size: float = 0.2,
    ) -> Dict[str, float]:
        """
        Train the Random Forest on historical procurement data.

        Parameters
        ----------
        X : np.ndarray
            Feature matrix of shape (n_samples, 8). Use
            ``build_waiting_time_features()`` to construct rows.
        y : np.ndarray
            Target waiting times in minutes, shape (n_samples,).
        test_size : float
            Fraction of data reserved for validation (default 0.2).

        Returns
        -------
        dict
            ``{'rmse_val': float, 'mae_val': float, 'r2_train': float}``

        Raises
        ------
        ValueError
            If X and y have mismatched lengths or insufficient samples.
        """
        if len(X) != len(y):
            raise ValueError(f"X has {len(X)} rows but y has {len(y)} elements.")
        if len(X) < 10:
            raise ValueError("Need at least 10 samples to train.")

        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=test_size, random_state=self.random_state
        )

        X_train_s = self.scaler_.fit_transform(X_train)
        X_val_s = self.scaler_.transform(X_val)

        self.model_ = RandomForestRegressor(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            random_state=self.random_state,
            n_jobs=-1,
        )
        self.model_.fit(X_train_s, y_train)

        y_pred_val = self.model_.predict(X_val_s)
        rmse = float(mean_squared_error(y_val, y_pred_val) ** 0.5)
        mae = float(mean_absolute_error(y_val, y_pred_val))
        r2 = float(self.model_.score(X_train_s, y_train))

        self.feature_importances_ = self.model_.feature_importances_
        self.is_fitted_ = True

        return {"rmse_val": round(rmse, 4), "mae_val": round(mae, 4), "r2_train": round(r2, 4)}

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict waiting times for new observations.

        Parameters
        ----------
        X : np.ndarray
            Feature matrix of shape (n_samples, 8).

        Returns
        -------
        np.ndarray
            Predicted waiting times in minutes, clipped to [0, ∞).

        Raises
        ------
        RuntimeError
            If called before ``fit()``.
        """
        if not self.is_fitted_ or self.model_ is None:
            raise RuntimeError("Model not fitted. Call fit() first.")
        X_s = self.scaler_.transform(X)
        return np.clip(self.model_.predict(X_s), 0, None)

    def top_features(self, n: int = 4) -> List[Tuple[str, float]]:
        """
        Return the top-n most important features by impurity reduction.

        Parameters
        ----------
        n : int
            Number of top features to return.

        Returns
        -------
        list of (feature_name, importance_score)
        """
        if self.feature_importances_ is None:
            raise RuntimeError("Model not fitted. Call fit() first.")
        pairs = sorted(
            zip(self.FEATURE_NAMES, self.feature_importances_),
            key=lambda x: x[1],
            reverse=True,
        )
        return pairs[:n]


# ---------------------------------------------------------------------------
# 2. Demand Forecaster (XGBoost / RF fallback)
# ---------------------------------------------------------------------------

class DemandForecaster:
    """
    Gradient Boosting model for forecasting daily farmer arrival demand.

    Uses XGBoost when available; falls back to RandomForestRegressor if
    the ``xgboost`` package is not installed, ensuring portability.

    Parameters
    ----------
    n_estimators : int
        Boosting rounds / trees (default 300 for XGB, 200 for RF fallback).
    learning_rate : float
        Step-size shrinkage for XGBoost (default 0.05).
    max_depth : int
        Tree depth (default 6).
    random_state : int
        Reproducibility seed (default 42).

    Examples
    --------
    >>> forecaster = DemandForecaster()
    >>> X = np.random.rand(365, 10)
    >>> y = np.random.randint(50, 300, 365).astype(float)
    >>> metrics = forecaster.fit(X, y)
    >>> preds = forecaster.predict(X[:7])
    >>> preds.shape
    (7,)
    """

    FEATURE_NAMES: List[str] = [
        "day_of_year", "day_of_week", "month", "year_offset",
        "lag_1", "lag_7", "lag_30",
        "rolling_mean_7", "rolling_std_7", "is_harvest",
    ]

    def __init__(
        self,
        n_estimators: int = 300,
        learning_rate: float = 0.05,
        max_depth: int = 6,
        random_state: int = 42,
    ) -> None:
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.max_depth = max_depth
        self.random_state = random_state
        self.model_ = None
        self.is_fitted_: bool = False
        self._using_xgb: bool = _XGB_AVAILABLE

    def fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        test_size: float = 0.2,
    ) -> Dict[str, float]:
        """
        Train the demand forecasting model.

        Parameters
        ----------
        X : np.ndarray
            Feature matrix of shape (n_samples, 10). Use
            ``build_demand_features()`` to construct rows.
        y : np.ndarray
            Daily farmer arrival counts, shape (n_samples,).
        test_size : float
            Validation split fraction.

        Returns
        -------
        dict
            ``{'mae_val': float, 'mape_val': float, 'rmse_val': float,
               'model': 'xgboost' | 'random_forest'}``
        """
        if not _SKLEARN_AVAILABLE:
            raise ImportError("scikit-learn is required.")
        if len(X) < 14:
            raise ValueError("Need at least 14 samples for demand forecasting.")

        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=test_size, random_state=self.random_state
        )

        if self._using_xgb:
            self.model_ = XGBRegressor(
                n_estimators=self.n_estimators,
                learning_rate=self.learning_rate,
                max_depth=self.max_depth,
                random_state=self.random_state,
                verbosity=0,
                objective="reg:squarederror",
            )
        else:
            self.model_ = RandomForestRegressor(
                n_estimators=min(self.n_estimators, 200),
                max_depth=self.max_depth,
                random_state=self.random_state,
                n_jobs=-1,
            )

        self.model_.fit(X_train, y_train)
        y_pred = self.model_.predict(X_val)
        y_pred_clipped = np.clip(y_pred, 1, None)  # prevent division by zero in MAPE

        mae = float(mean_absolute_error(y_val, y_pred))
        rmse = float(mean_squared_error(y_val, y_pred) ** 0.5)
        mape = float(np.mean(np.abs((y_val - y_pred_clipped) / y_val.clip(1))) * 100)

        self.is_fitted_ = True

        return {
            "mae_val": round(mae, 4),
            "mape_val": round(mape, 2),
            "rmse_val": round(rmse, 4),
            "model": "xgboost" if self._using_xgb else "random_forest",
        }

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict daily farmer arrival counts.

        Parameters
        ----------
        X : np.ndarray
            Feature matrix of shape (n_samples, 10).

        Returns
        -------
        np.ndarray
            Predicted arrival counts (floats), clipped to [0, ∞).

        Raises
        ------
        RuntimeError
            If ``fit()`` has not been called.
        """
        if not self.is_fitted_ or self.model_ is None:
            raise RuntimeError("Model not fitted. Call fit() first.")
        return np.clip(self.model_.predict(X), 0, None)

    def forecast_7_days(self, latest_features: np.ndarray) -> np.ndarray:
        """
        Produce a 7-day rolling demand forecast.

        Parameters
        ----------
        latest_features : np.ndarray
            Feature row for day 1 of the forecast horizon, shape (1, 10).

        Returns
        -------
        np.ndarray
            7-day predicted arrival counts, shape (7,).
        """
        if not self.is_fitted_:
            raise RuntimeError("Model not fitted. Call fit() first.")
        preds = []
        row = latest_features.copy().flatten()
        for i in range(7):
            pred = float(self.predict(row.reshape(1, -1))[0])
            preds.append(pred)
            # Shift lag features: lag_1 ← pred, lag_7 shifts down
            row[4] = pred  # lag_1
            row[0] = (row[0] % 365) + 1  # day_of_year +1
            row[1] = (row[1] + 1) % 7    # day_of_week +1
        return np.array(preds)
