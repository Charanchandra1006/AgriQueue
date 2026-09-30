"""
AgriQueue — Core Algorithmic Engine
====================================
Implements scheduling, routing, and machine-learning modules for the
AgriQueue smart agricultural procurement and mandi management platform.

Modules
-------
queue_optimizer   : Priority Queue, FCFS, SPT, and Greedy scheduling algorithms
route_optimizer   : Dijkstra shortest-path and Vehicle Routing Problem (VRP) solver
demand_forecaster : Random Forest and XGBoost-based waiting-time prediction & demand forecasting
"""

from .queue_optimizer import (
    FarmerToken,
    PriorityQueueScheduler,
    FCFSScheduler,
    SPTScheduler,
    GreedyResourceScheduler,
)
from .route_optimizer import DijkstraRouter, VRPSolver
from .demand_forecaster import WaitingTimePredictor, DemandForecaster

__all__ = [
    "FarmerToken",
    "PriorityQueueScheduler",
    "FCFSScheduler",
    "SPTScheduler",
    "GreedyResourceScheduler",
    "DijkstraRouter",
    "VRPSolver",
    "WaitingTimePredictor",
    "DemandForecaster",
]
