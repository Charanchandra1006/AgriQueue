"""
test_route_optimizer.py
=======================
Pytest suite for AgriQueue route optimisation algorithms:
  - haversine_km distance utility
  - DijkstraRouter (shortest path, nearest mandi, edge cases)
  - VRPSolver (route construction, capacity constraints, distance totals)
"""

import math
import pytest
from algorithms.route_optimizer import (
    haversine_km,
    DijkstraRouter,
    VRPSolver,
)


# ──────────────────────────────────────────────────────────────
# haversine_km
# ──────────────────────────────────────────────────────────────

class TestHaversine:
    def test_same_point_is_zero(self):
        """Distance from a point to itself must be 0."""
        assert haversine_km((17.38, 78.48), (17.38, 78.48)) == pytest.approx(0.0, abs=1e-6)

    def test_known_distance(self):
        """Hyderabad → Karimnagar straight-line haversine ≈ 135 km (±15 km tolerance)."""
        hyd = (17.3850, 78.4867)
        knr = (18.4386, 79.1288)
        dist = haversine_km(hyd, knr)
        assert 120 < dist < 155

    def test_symmetry(self):
        """Distance A→B must equal B→A."""
        a = (17.38, 78.48)
        b = (17.40, 78.50)
        assert haversine_km(a, b) == pytest.approx(haversine_km(b, a), rel=1e-9)

    def test_result_is_positive(self):
        """Any two distinct points must yield a positive distance."""
        assert haversine_km((0.0, 0.0), (1.0, 1.0)) > 0


# ──────────────────────────────────────────────────────────────
# DijkstraRouter
# ──────────────────────────────────────────────────────────────

class TestDijkstraRouter:
    def test_shortest_path_direct(self, simple_graph):
        """A→B direct path = 5.0 km."""
        router = DijkstraRouter(simple_graph)
        result = router.shortest_path("A", "B")
        assert result.distance == pytest.approx(5.0)
        assert result.reachable is True

    def test_shortest_path_via_intermediate(self, simple_graph):
        """A→C shortest = A→B→C = 8.0 (not direct 10.0)."""
        router = DijkstraRouter(simple_graph)
        result = router.shortest_path("A", "C")
        assert result.distance == pytest.approx(8.0)
        assert result.path == ["A", "B", "C"]

    def test_path_starts_at_source(self, simple_graph):
        router = DijkstraRouter(simple_graph)
        result = router.shortest_path("A", "C")
        assert result.path[0] == "A"
        assert result.path[-1] == "C"

    def test_unreachable_node(self):
        """Isolated node must return reachable=False."""
        graph = {
            "A": [("B", 1.0)],
            "B": [("A", 1.0)],
            "C": [],  # disconnected
        }
        router = DijkstraRouter(graph)
        result = router.shortest_path("A", "C")
        assert result.reachable is False
        assert math.isinf(result.distance)
        assert result.path == []

    def test_self_path(self, simple_graph):
        """Shortest path from a node to itself = 0."""
        router = DijkstraRouter(simple_graph)
        result = router.shortest_path("A", "A")
        assert result.distance == pytest.approx(0.0)
        assert result.path == ["A"]

    def test_unknown_source_raises(self, simple_graph):
        router = DijkstraRouter(simple_graph)
        with pytest.raises(KeyError):
            router.shortest_path("UNKNOWN", "A")

    def test_unknown_destination_raises(self, simple_graph):
        router = DijkstraRouter(simple_graph)
        with pytest.raises(KeyError):
            router.shortest_path("A", "UNKNOWN")

    def test_nearest_mandi_selection(self):
        """nearest_mandi must return the closer of two mandis."""
        graph = {
            "farm":   [("mandiA", 5.0), ("mandiB", 15.0)],
            "mandiA": [("farm", 5.0)],
            "mandiB": [("farm", 15.0)],
        }
        router = DijkstraRouter(graph)
        mandi, dist = router.nearest_mandi("farm", ["mandiA", "mandiB"])
        assert mandi == "mandiA"
        assert dist == pytest.approx(5.0)

    def test_larger_graph_optimality(self):
        """Verify Dijkstra finds optimal path in a 5-node graph."""
        graph = {
            "S": [("A", 10.0), ("B", 3.0)],
            "A": [("S", 10.0), ("C", 2.0)],
            "B": [("S", 3.0), ("A", 4.0), ("C", 8.0)],
            "C": [("A", 2.0), ("B", 8.0), ("D", 5.0)],
            "D": [("C", 5.0)],
        }
        router = DijkstraRouter(graph)
        result = router.shortest_path("S", "D")
        # S→B→A→C→D = 3+4+2+5 = 14
        assert result.distance == pytest.approx(14.0)


# ──────────────────────────────────────────────────────────────
# VRPSolver
# ──────────────────────────────────────────────────────────────

class TestVRPSolver:
    def test_all_farms_assigned(self, vrp_setup):
        """All 4 farms must appear in some route."""
        s = vrp_setup
        solver = VRPSolver(s["depot"], s["coordinates"], s["farm_loads"],
                           s["vehicle_capacity_kg"], s["num_vehicles"])
        routes = solver.solve()
        assigned_farms = {stop for route in routes for stop in route.stops}
        assert assigned_farms == set(s["farm_loads"].keys())

    def test_capacity_not_exceeded(self, vrp_setup):
        """No vehicle route should exceed the capacity constraint."""
        s = vrp_setup
        solver = VRPSolver(s["depot"], s["coordinates"], s["farm_loads"],
                           s["vehicle_capacity_kg"], s["num_vehicles"])
        routes = solver.solve()
        for route in routes:
            assert route.total_load_kg <= s["vehicle_capacity_kg"] + 1e-6

    def test_total_distance_positive(self, vrp_setup):
        """Each route must have a positive total distance."""
        s = vrp_setup
        solver = VRPSolver(s["depot"], s["coordinates"], s["farm_loads"],
                           s["vehicle_capacity_kg"], s["num_vehicles"])
        routes = solver.solve()
        for route in routes:
            assert route.total_distance_km > 0

    def test_total_fleet_distance(self, vrp_setup):
        """total_distance() must equal sum of individual route distances."""
        s = vrp_setup
        solver = VRPSolver(s["depot"], s["coordinates"], s["farm_loads"],
                           s["vehicle_capacity_kg"], s["num_vehicles"])
        routes = solver.solve()
        expected = sum(r.total_distance_km for r in routes)
        assert solver.total_distance(routes) == pytest.approx(expected, rel=1e-6)

    def test_single_vehicle_single_farm(self):
        """One vehicle + one farm: route has exactly one stop."""
        coords = {"depot": (17.38, 78.48), "F1": (17.40, 78.50)}
        loads = {"F1": 500.0}
        solver = VRPSolver("depot", coords, loads, 1000.0, 1)
        routes = solver.solve()
        assert len(routes) == 1
        assert routes[0].stops == ["F1"]

    def test_route_vehicle_ids_unique(self, vrp_setup):
        """Each route must have a distinct vehicle_id."""
        s = vrp_setup
        solver = VRPSolver(s["depot"], s["coordinates"], s["farm_loads"],
                           s["vehicle_capacity_kg"], s["num_vehicles"])
        routes = solver.solve()
        ids = [r.vehicle_id for r in routes]
        assert len(ids) == len(set(ids))

    def test_boundary_overcapacity_single_vehicle(self):
        """If a single farm exceeds capacity, it should remain unserved."""
        coords = {"depot": (17.38, 78.48), "F1": (17.40, 78.50)}
        loads = {"F1": 5000.0}  # Way above 1000 kg capacity
        solver = VRPSolver("depot", coords, loads, 1000.0, 1)
        routes = solver.solve()
        # No vehicle can carry this farm — routes should be empty
        total_stops = sum(len(r.stops) for r in routes)
        assert total_stops == 0
