"""
route_optimizer.py — AgriQueue Logistics Engine
================================================
Implements graph-based routing algorithms for optimising farm-to-mandi
and last-mile agricultural logistics.

Algorithms
----------
1. Dijkstra's Algorithm  – Finds the shortest-path from a source farm to
                           any mandi / procurement centre in the road network.
2. VRP Solver            – Greedy nearest-neighbour Vehicle Routing Problem
                           heuristic for multi-stop produce collection routes.

Complexity
----------
DijkstraRouter.shortest_path : O((V + E) log V) using a min-heap
VRPSolver.solve              : O(n²) greedy nearest-neighbour

SDG-12 Alignment
----------------
Route optimisation directly reduces fuel consumption, vehicle idle time,
and transportation overhead — supporting SDG 12.2 (efficient resource use).
"""

from __future__ import annotations

import heapq
import math
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

# Type aliases
Graph = Dict[str, List[Tuple[str, float]]]   # node → [(neighbour, weight)]
Coordinate = Tuple[float, float]             # (latitude, longitude)


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def haversine_km(coord_a: Coordinate, coord_b: Coordinate) -> float:
    """
    Compute the great-circle distance between two geographic coordinates.

    Parameters
    ----------
    coord_a : (float, float)
        (latitude, longitude) of point A in decimal degrees.
    coord_b : (float, float)
        (latitude, longitude) of point B in decimal degrees.

    Returns
    -------
    float
        Distance in kilometres.

    Examples
    --------
    >>> haversine_km((17.3850, 78.4867), (17.2403, 78.4294))
    16.97...
    """
    R = 6_371.0  # Earth mean radius in km
    lat1, lon1 = math.radians(coord_a[0]), math.radians(coord_a[1])
    lat2, lon2 = math.radians(coord_b[0]), math.radians(coord_b[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


# ---------------------------------------------------------------------------
# 1. Dijkstra Router
# ---------------------------------------------------------------------------

@dataclass
class PathResult:
    """
    Result of a single-source shortest-path computation.

    Attributes
    ----------
    source : str
        Origin node identifier.
    destination : str
        Target node identifier.
    distance : float
        Total shortest distance (km or arbitrary weight units).
    path : list[str]
        Ordered list of node identifiers from source to destination.
    reachable : bool
        False if no path exists between source and destination.
    """

    source: str
    destination: str
    distance: float
    path: List[str]
    reachable: bool


class DijkstraRouter:
    """
    Shortest-path router for agricultural road networks using Dijkstra's algorithm.

    The road network is modelled as a weighted undirected graph where nodes are
    farms / mandis and edges represent road segments with distance weights (km).

    Parameters
    ----------
    graph : Graph
        Adjacency-list representation: ``{node: [(neighbour, weight), ...]}``.

    Examples
    --------
    >>> g = {"A": [("B", 5.0), ("C", 10.0)], "B": [("A", 5.0), ("C", 3.0)], "C": [("A", 10.0), ("B", 3.0)]}
    >>> router = DijkstraRouter(g)
    >>> result = router.shortest_path("A", "C")
    >>> result.distance
    8.0
    >>> result.path
    ['A', 'B', 'C']
    """

    def __init__(self, graph: Graph) -> None:
        self._graph = graph

    def shortest_path(self, source: str, destination: str) -> PathResult:
        """
        Compute the shortest path from ``source`` to ``destination``.

        Parameters
        ----------
        source : str
            Starting node (farm location).
        destination : str
            Target node (mandi / procurement centre).

        Returns
        -------
        PathResult
            Distance and reconstructed path.

        Raises
        ------
        KeyError
            If source or destination are not in the graph.

        Complexity: O((V + E) log V)
        """
        if source not in self._graph:
            raise KeyError(f"Source node '{source}' not in road network.")
        if destination not in self._graph:
            raise KeyError(f"Destination node '{destination}' not in road network.")

        dist: Dict[str, float] = {node: math.inf for node in self._graph}
        dist[source] = 0.0
        prev: Dict[str, Optional[str]] = {node: None for node in self._graph}
        heap: List[Tuple[float, str]] = [(0.0, source)]

        while heap:
            current_dist, current = heapq.heappop(heap)
            if current_dist > dist[current]:
                continue
            for neighbour, weight in self._graph.get(current, []):
                new_dist = current_dist + weight
                if new_dist < dist[neighbour]:
                    dist[neighbour] = new_dist
                    prev[neighbour] = current
                    heapq.heappush(heap, (new_dist, neighbour))

        if math.isinf(dist[destination]):
            return PathResult(source, destination, math.inf, [], reachable=False)

        # Reconstruct path
        path: List[str] = []
        node: Optional[str] = destination
        while node is not None:
            path.append(node)
            node = prev[node]
        path.reverse()

        return PathResult(source, destination, dist[destination], path, reachable=True)

    def nearest_mandi(self, farm: str, mandis: List[str]) -> Tuple[str, float]:
        """
        Find the closest mandi to a given farm.

        Parameters
        ----------
        farm : str
            Starting farm node.
        mandis : list[str]
            List of mandi node identifiers to evaluate.

        Returns
        -------
        (str, float)
            (closest_mandi_id, distance_km)
        """
        best_mandi, best_dist = "", math.inf
        for mandi in mandis:
            result = self.shortest_path(farm, mandi)
            if result.reachable and result.distance < best_dist:
                best_dist = result.distance
                best_mandi = mandi
        return best_mandi, best_dist


# ---------------------------------------------------------------------------
# 2. VRP Solver (Greedy Nearest Neighbour)
# ---------------------------------------------------------------------------

@dataclass
class VRPRoute:
    """
    A single vehicle's collection route.

    Attributes
    ----------
    vehicle_id : int
        Vehicle identifier.
    stops : list[str]
        Ordered list of farm stops.
    total_distance_km : float
        Total route distance.
    total_load_kg : float
        Total produce weight collected.
    """

    vehicle_id: int
    stops: List[str]
    total_distance_km: float
    total_load_kg: float


class VRPSolver:
    """
    Greedy Nearest-Neighbour Vehicle Routing Problem (VRP) solver.

    Assigns farms to vehicles to minimise total travel distance while
    respecting vehicle capacity constraints. Uses a nearest-neighbour
    heuristic to construct routes sequentially.

    Parameters
    ----------
    depot : str
        Starting / ending point for all vehicles (e.g., mandi ID).
    coordinates : dict[str, Coordinate]
        GPS coordinates for every node (depot + farms).
    farm_loads : dict[str, float]
        Produce load (kg) to be collected from each farm.
    vehicle_capacity_kg : float
        Maximum load per vehicle (kg).
    num_vehicles : int
        Number of available collection vehicles.

    Examples
    --------
    >>> coords = {"depot": (17.38, 78.48), "F1": (17.40, 78.50), "F2": (17.36, 78.46)}
    >>> loads = {"F1": 800.0, "F2": 1200.0}
    >>> solver = VRPSolver("depot", coords, loads, 2000.0, 2)
    >>> routes = solver.solve()
    >>> len(routes)
    2
    """

    def __init__(
        self,
        depot: str,
        coordinates: Dict[str, Coordinate],
        farm_loads: Dict[str, float],
        vehicle_capacity_kg: float,
        num_vehicles: int,
    ) -> None:
        self._depot = depot
        self._coordinates = coordinates
        self._farm_loads = farm_loads
        self._capacity = vehicle_capacity_kg
        self._num_vehicles = num_vehicles

    def _distance(self, a: str, b: str) -> float:
        """Compute haversine distance between two named nodes."""
        return haversine_km(self._coordinates[a], self._coordinates[b])

    def solve(self) -> List[VRPRoute]:
        """
        Construct VRP routes using greedy nearest-neighbour heuristic.

        Starting from the depot, each vehicle greedily picks the nearest
        unvisited farm that still fits within its remaining capacity.

        Returns
        -------
        list[VRPRoute]
            One VRPRoute object per vehicle actually used.

        Complexity: O(n²) where n = number of farms.
        """
        unvisited = set(self._farm_loads.keys())
        routes: List[VRPRoute] = []

        for v_id in range(self._num_vehicles):
            if not unvisited:
                break

            current = self._depot
            stops: List[str] = []
            load: float = 0.0
            dist: float = 0.0

            while unvisited:
                # Filter farms that fit in remaining capacity
                candidates = [f for f in unvisited if load + self._farm_loads[f] <= self._capacity]
                if not candidates:
                    break
                # Nearest neighbour selection
                nearest = min(candidates, key=lambda f: self._distance(current, f))
                leg = self._distance(current, nearest)
                dist += leg
                load += self._farm_loads[nearest]
                stops.append(nearest)
                unvisited.remove(nearest)
                current = nearest

            # Return to depot
            if stops:
                dist += self._distance(current, self._depot)
                routes.append(VRPRoute(v_id, stops, round(dist, 3), round(load, 2)))

        return routes

    def total_distance(self, routes: List[VRPRoute]) -> float:
        """
        Compute aggregate distance across all vehicle routes.

        Parameters
        ----------
        routes : list[VRPRoute]

        Returns
        -------
        float
            Total fleet distance in km.
        """
        return round(sum(r.total_distance_km for r in routes), 3)
