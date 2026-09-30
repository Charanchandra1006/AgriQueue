"""Test fixtures and shared configuration for AgriQueue algorithm test suite."""
import time
import pytest
import numpy as np
from algorithms.queue_optimizer import FarmerToken


@pytest.fixture
def sample_token_paddy() -> FarmerToken:
    """A standard paddy farmer token with moderate moisture."""
    return FarmerToken("F001", "paddy", 1200.0, 18.0, time.time(), token_number=1)


@pytest.fixture
def sample_token_tomato() -> FarmerToken:
    """A perishable-commodity token (tomato) with high moisture — should get priority."""
    return FarmerToken("F002", "tomato", 300.0, 27.0, time.time() + 10, token_number=2)


@pytest.fixture
def sample_token_wheat() -> FarmerToken:
    """A wheat token with low moisture — lower urgency."""
    return FarmerToken("F003", "wheat", 2500.0, 11.0, time.time() + 20, token_number=3)


@pytest.fixture
def waiting_time_X() -> np.ndarray:
    """200-sample feature matrix for WaitingTimePredictor tests."""
    np.random.seed(0)
    return np.random.rand(200, 8) * np.array([23, 6, 50, 2000, 5, 30, 1, 20])


@pytest.fixture
def waiting_time_y() -> np.ndarray:
    """200-sample synthetic waiting times (0–90 minutes)."""
    np.random.seed(0)
    return np.random.rand(200) * 90


@pytest.fixture
def demand_X() -> np.ndarray:
    """365-sample feature matrix for DemandForecaster tests."""
    np.random.seed(1)
    base = np.random.rand(365, 10)
    base[:, 2] = np.tile(np.arange(1, 13), 31)[:365]  # month column realistic
    return base


@pytest.fixture
def demand_y() -> np.ndarray:
    """365-sample daily arrival counts."""
    np.random.seed(1)
    return np.random.randint(40, 350, 365).astype(float)


@pytest.fixture
def simple_graph() -> dict:
    """
    A small weighted undirected road network:
        A ──5── B ──3── C
        │               │
        └──────10───────┘
    Shortest A→C = A→B→C = 8 km
    """
    return {
        "A": [("B", 5.0), ("C", 10.0)],
        "B": [("A", 5.0), ("C", 3.0)],
        "C": [("A", 10.0), ("B", 3.0)],
    }


@pytest.fixture
def vrp_setup() -> dict:
    """A small VRP scenario with 4 farms and 1 depot."""
    return {
        "depot": "depot",
        "coordinates": {
            "depot": (17.38, 78.48),
            "F1": (17.40, 78.50),
            "F2": (17.36, 78.46),
            "F3": (17.42, 78.52),
            "F4": (17.34, 78.44),
        },
        "farm_loads": {"F1": 600.0, "F2": 900.0, "F3": 400.0, "F4": 1100.0},
        "vehicle_capacity_kg": 1500.0,
        "num_vehicles": 3,
    }
