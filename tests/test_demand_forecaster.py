"""
test_demand_forecaster.py
=========================
Pytest suite for AgriQueue ML demand & waiting-time prediction modules:
  - build_waiting_time_features (shape, boundary values)
  - build_demand_features (shape, harvest flag correctness)
  - WaitingTimePredictor (fit/predict, metrics, feature importance)
  - DemandForecaster (fit/predict, 7-day forecast, model selection)
"""

import pytest
import numpy as np
from algorithms.demand_forecaster import (
    build_waiting_time_features,
    build_demand_features,
    WaitingTimePredictor,
    DemandForecaster,
    HARVEST_MONTHS,
)


# ──────────────────────────────────────────────────────────────
# Feature engineering helpers
# ──────────────────────────────────────────────────────────────

class TestBuildWaitingTimeFeatures:
    def test_output_shape(self):
        """Feature vector must be shape (1, 8)."""
        X = build_waiting_time_features(9, 1, 12, 850.0, 3, 18.5, True)
        assert X.shape == (1, 8)

    def test_load_per_station_engineered(self):
        """8th feature (load_per_station) must equal queue_length / num_stations."""
        X = build_waiting_time_features(10, 2, 20, 1000.0, 4, 15.0, False)
        expected_load = 20 / 4  # 5.0
        assert X[0, 7] == pytest.approx(expected_load)

    def test_peak_season_flag(self):
        """is_peak_season=True must encode as 1; False as 0."""
        X_peak = build_waiting_time_features(8, 0, 10, 500.0, 2, 14.0, True)
        X_off = build_waiting_time_features(8, 0, 10, 500.0, 2, 14.0, False)
        assert X_peak[0, 6] == 1
        assert X_off[0, 6] == 0

    def test_single_station_no_division_error(self):
        """With 1 station, load_per_station = queue_length."""
        X = build_waiting_time_features(7, 3, 5, 600.0, 1, 12.0, False)
        assert X[0, 7] == pytest.approx(5.0)

    def test_boundary_zero_queue(self):
        """Zero farmers in queue: load_per_station = 0."""
        X = build_waiting_time_features(12, 1, 0, 0.0, 3, 0.0, False)
        assert X[0, 2] == 0   # queue_length
        assert X[0, 7] == 0.0  # load_per_station


class TestBuildDemandFeatures:
    def test_output_shape(self):
        """Feature vector must be shape (1, 10)."""
        X = build_demand_features(280, 2, 10, 2026, 120.0, 105.0, 98.0, 112.0, 8.5)
        assert X.shape == (1, 10)

    def test_harvest_month_flagged(self):
        """October (harvest month) must set is_harvest = 1."""
        X = build_demand_features(280, 2, 10, 2026, 0.0, 0.0, 0.0, 0.0, 0.0)
        assert X[0, 9] == 1

    def test_non_harvest_month(self):
        """June (non-harvest) must set is_harvest = 0."""
        X = build_demand_features(160, 2, 6, 2026, 0.0, 0.0, 0.0, 0.0, 0.0)
        assert X[0, 9] == 0

    def test_all_harvest_months_covered(self):
        """All months in HARVEST_MONTHS must yield is_harvest=1."""
        for month in HARVEST_MONTHS:
            X = build_demand_features(1, 0, month, 2026, 0, 0, 0, 0, 0)
            assert X[0, 9] == 1, f"Month {month} should be a harvest month"

    def test_year_offset_encoding(self):
        """Year 2026 must encode as 2026-2020 = 6."""
        X = build_demand_features(1, 0, 3, 2026, 0, 0, 0, 0, 0)
        assert X[0, 3] == 6


# ──────────────────────────────────────────────────────────────
# WaitingTimePredictor
# ──────────────────────────────────────────────────────────────

class TestWaitingTimePredictor:
    def test_fit_returns_metrics(self, waiting_time_X, waiting_time_y):
        """fit() must return a dict with rmse_val, mae_val, r2_train."""
        predictor = WaitingTimePredictor(n_estimators=10)
        metrics = predictor.fit(waiting_time_X, waiting_time_y)
        assert "rmse_val" in metrics
        assert "mae_val" in metrics
        assert "r2_train" in metrics

    def test_rmse_is_float(self, waiting_time_X, waiting_time_y):
        predictor = WaitingTimePredictor(n_estimators=10)
        metrics = predictor.fit(waiting_time_X, waiting_time_y)
        assert isinstance(metrics["rmse_val"], float)

    def test_predict_shape(self, waiting_time_X, waiting_time_y):
        """predict() output shape must match number of input rows."""
        predictor = WaitingTimePredictor(n_estimators=10)
        predictor.fit(waiting_time_X, waiting_time_y)
        preds = predictor.predict(waiting_time_X[:10])
        assert preds.shape == (10,)

    def test_predictions_non_negative(self, waiting_time_X, waiting_time_y):
        """Waiting time predictions must always be >= 0."""
        predictor = WaitingTimePredictor(n_estimators=10)
        predictor.fit(waiting_time_X, waiting_time_y)
        preds = predictor.predict(waiting_time_X)
        assert np.all(preds >= 0)

    def test_predict_before_fit_raises(self):
        predictor = WaitingTimePredictor()
        with pytest.raises(RuntimeError):
            predictor.predict(np.zeros((1, 8)))

    def test_feature_importances_shape(self, waiting_time_X, waiting_time_y):
        predictor = WaitingTimePredictor(n_estimators=10)
        predictor.fit(waiting_time_X, waiting_time_y)
        assert predictor.feature_importances_ is not None
        assert len(predictor.feature_importances_) == 8

    def test_top_features_count(self, waiting_time_X, waiting_time_y):
        predictor = WaitingTimePredictor(n_estimators=10)
        predictor.fit(waiting_time_X, waiting_time_y)
        top = predictor.top_features(n=3)
        assert len(top) == 3

    def test_top_features_before_fit_raises(self):
        predictor = WaitingTimePredictor()
        with pytest.raises(RuntimeError):
            predictor.top_features()

    def test_fit_mismatched_lengths_raises(self):
        predictor = WaitingTimePredictor(n_estimators=5)
        X = np.zeros((10, 8))
        y = np.zeros(15)
        with pytest.raises(ValueError):
            predictor.fit(X, y)

    def test_fit_insufficient_samples_raises(self):
        predictor = WaitingTimePredictor(n_estimators=5)
        X = np.zeros((5, 8))
        y = np.zeros(5)
        with pytest.raises(ValueError):
            predictor.fit(X, y)

    def test_is_fitted_flag(self, waiting_time_X, waiting_time_y):
        predictor = WaitingTimePredictor(n_estimators=5)
        assert predictor.is_fitted_ is False
        predictor.fit(waiting_time_X, waiting_time_y)
        assert predictor.is_fitted_ is True


# ──────────────────────────────────────────────────────────────
# DemandForecaster
# ──────────────────────────────────────────────────────────────

class TestDemandForecaster:
    def test_fit_returns_metrics(self, demand_X, demand_y):
        forecaster = DemandForecaster(n_estimators=10)
        metrics = forecaster.fit(demand_X, demand_y)
        assert "mae_val" in metrics
        assert "mape_val" in metrics
        assert "rmse_val" in metrics
        assert "model" in metrics

    def test_predict_shape(self, demand_X, demand_y):
        forecaster = DemandForecaster(n_estimators=10)
        forecaster.fit(demand_X, demand_y)
        preds = forecaster.predict(demand_X[:5])
        assert preds.shape == (5,)

    def test_predictions_non_negative(self, demand_X, demand_y):
        """Arrival counts must be >= 0."""
        forecaster = DemandForecaster(n_estimators=10)
        forecaster.fit(demand_X, demand_y)
        preds = forecaster.predict(demand_X)
        assert np.all(preds >= 0)

    def test_predict_before_fit_raises(self):
        forecaster = DemandForecaster()
        with pytest.raises(RuntimeError):
            forecaster.predict(np.zeros((1, 10)))

    def test_7_day_forecast_shape(self, demand_X, demand_y):
        """forecast_7_days must return exactly 7 predictions."""
        forecaster = DemandForecaster(n_estimators=10)
        forecaster.fit(demand_X, demand_y)
        preds = forecaster.forecast_7_days(demand_X[[0]])
        assert preds.shape == (7,)

    def test_7_day_forecast_non_negative(self, demand_X, demand_y):
        forecaster = DemandForecaster(n_estimators=10)
        forecaster.fit(demand_X, demand_y)
        preds = forecaster.forecast_7_days(demand_X[[0]])
        assert np.all(preds >= 0)

    def test_7_day_forecast_before_fit_raises(self):
        forecaster = DemandForecaster()
        with pytest.raises(RuntimeError):
            forecaster.forecast_7_days(np.zeros((1, 10)))

    def test_mae_is_finite(self, demand_X, demand_y):
        forecaster = DemandForecaster(n_estimators=10)
        metrics = forecaster.fit(demand_X, demand_y)
        assert np.isfinite(metrics["mae_val"])

    def test_model_key_valid(self, demand_X, demand_y):
        forecaster = DemandForecaster(n_estimators=10)
        metrics = forecaster.fit(demand_X, demand_y)
        assert metrics["model"] in ("xgboost", "random_forest")

    def test_fit_insufficient_data_raises(self):
        forecaster = DemandForecaster(n_estimators=5)
        X = np.zeros((5, 10))
        y = np.zeros(5)
        with pytest.raises(ValueError):
            forecaster.fit(X, y)
