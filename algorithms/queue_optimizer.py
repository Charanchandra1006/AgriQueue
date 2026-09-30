"""
queue_optimizer.py — AgriQueue Scheduling Engine
=================================================
Implements four classical CPU / task scheduling algorithms adapted for
agricultural mandi queue management.

Algorithms
----------
1. Priority Queue / Heap   – Farmers with perishable/high-moisture produce
                             are served first (min-heap on priority score).
2. FCFS                    – First-Come-First-Served; baseline fair scheduling.
3. SPT                     – Shortest Processing Time; minimises average wait.
4. Greedy Resource         – Assigns arriving farmers to the least-loaded
                             weighing station to maximise throughput.

Complexity
----------
PriorityQueueScheduler : push O(log n), pop O(log n)
FCFSScheduler          : enqueue O(1), dequeue O(1)
SPTScheduler           : insert O(n), serve O(1) after sort
GreedyResourceScheduler: assign O(k) where k = number of stations

SDG-12 Alignment
----------------
By minimising idle machine time and redundant farmer trips, the engine
directly supports SDG 12.2 (sustainable, efficient use of natural resources).
"""

from __future__ import annotations

import heapq
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass(order=True)
class FarmerToken:
    """
    Represents a single farmer's procurement token in the AgriQueue system.

    Parameters
    ----------
    farmer_id : str
        Unique identifier for the farmer (e.g., phone number or Aadhaar hash).
    commodity : str
        Crop type being brought for procurement (e.g., 'paddy', 'maize').
    quantity_kg : float
        Estimated weight of produce in kilograms.
    moisture_pct : float
        Moisture percentage of produce (higher → higher priority for perishables).
    arrival_ts : float
        Unix timestamp of arrival at the mandi gate.
    priority_score : float
        Computed priority (lower number = higher urgency). Set automatically.
    token_number : int
        Sequential token number issued at entry.

    Examples
    --------
    >>> t = FarmerToken("F001", "paddy", 1200.0, 22.5, time.time(), token_number=1)
    >>> t.farmer_id
    'F001'
    """

    priority_score: float = field(init=False, compare=True)
    farmer_id: str = field(compare=False)
    commodity: str = field(compare=False)
    quantity_kg: float = field(compare=False)
    moisture_pct: float = field(compare=False)
    arrival_ts: float = field(compare=False)
    token_number: int = field(compare=False)

    _PERISHABLE_COMMODITIES: frozenset = field(
        default_factory=lambda: frozenset({"tomato", "onion", "potato", "banana", "mango"}),
        init=False,
        compare=False,
        repr=False,
    )

    def __post_init__(self) -> None:
        """Compute priority score after field initialisation."""
        self.priority_score = self._compute_priority()

    def _compute_priority(self) -> float:
        """
        Compute a numeric priority score (lower = serve sooner).

        Formula
        -------
        base   = arrival_ts  (FCFS component)
        bonus  = -moisture_pct * 60  (high-moisture → perishable → earlier)
        bonus += -50 if commodity is perishable
        bonus += quantity_kg * 0.01  (larger lots get slight delay to allow
                                       weighing infrastructure to free up)

        Returns
        -------
        float
            Composite priority score.
        """
        bonus: float = 0.0
        bonus -= self.moisture_pct * 60.0
        if self.commodity.lower() in self._PERISHABLE_COMMODITIES:
            bonus -= 50.0
        bonus += self.quantity_kg * 0.01
        return self.arrival_ts + bonus


# ---------------------------------------------------------------------------
# 1. Priority Queue Scheduler (min-heap)
# ---------------------------------------------------------------------------

class PriorityQueueScheduler:
    """
    Heap-based priority queue scheduler for the mandi gate.

    Farmers with higher perishability risk (high moisture %, commodity type)
    are assigned lower priority scores and served first.

    Parameters
    ----------
    None

    Attributes
    ----------
    _heap : list[FarmerToken]
        Internal min-heap managed by the ``heapq`` module.
    _size : int
        Current number of tokens in the queue.

    Examples
    --------
    >>> sched = PriorityQueueScheduler()
    >>> tok = FarmerToken("F01", "tomato", 500.0, 25.0, 0.0, token_number=1)
    >>> sched.push(tok)
    >>> sched.pop().farmer_id
    'F01'
    """

    def __init__(self) -> None:
        self._heap: List[FarmerToken] = []
        self._size: int = 0

    def push(self, token: FarmerToken) -> None:
        """
        Add a farmer token to the priority queue.

        Parameters
        ----------
        token : FarmerToken
            The farmer's entry token.

        Complexity: O(log n)
        """
        heapq.heappush(self._heap, token)
        self._size += 1

    def pop(self) -> FarmerToken:
        """
        Remove and return the highest-priority (lowest score) token.

        Returns
        -------
        FarmerToken
            Next farmer to be served.

        Raises
        ------
        IndexError
            If the queue is empty.

        Complexity: O(log n)
        """
        if self._size == 0:
            raise IndexError("Queue is empty — no farmers waiting.")
        self._size -= 1
        return heapq.heappop(self._heap)

    def peek(self) -> Optional[FarmerToken]:
        """Return the next token without removing it. O(1)."""
        return self._heap[0] if self._heap else None

    def __len__(self) -> int:
        return self._size

    def queue_snapshot(self) -> List[FarmerToken]:
        """Return a sorted snapshot of all pending tokens (non-destructive)."""
        return sorted(self._heap)


# ---------------------------------------------------------------------------
# 2. FCFS Scheduler (double-ended queue)
# ---------------------------------------------------------------------------

class FCFSScheduler:
    """
    First-Come-First-Served (FCFS) mandi queue scheduler.

    Implements a simple FIFO discipline — the first farmer to arrive
    at the mandi gate is the first to be processed.

    Parameters
    ----------
    None

    Examples
    --------
    >>> sched = FCFSScheduler()
    >>> sched.enqueue(FarmerToken("F01", "paddy", 900.0, 14.0, 0.0, 1))
    >>> sched.enqueue(FarmerToken("F02", "wheat", 600.0, 12.0, 1.0, 2))
    >>> sched.dequeue().farmer_id
    'F01'
    """

    def __init__(self) -> None:
        self._queue: deque[FarmerToken] = deque()

    def enqueue(self, token: FarmerToken) -> None:
        """Add a farmer to the back of the FCFS queue. O(1)."""
        self._queue.append(token)

    def dequeue(self) -> FarmerToken:
        """
        Remove and return the farmer at the front of the queue.

        Returns
        -------
        FarmerToken

        Raises
        ------
        IndexError
            If the queue is empty.

        Complexity: O(1)
        """
        if not self._queue:
            raise IndexError("FCFS queue is empty.")
        return self._queue.popleft()

    def average_wait_estimate(self, avg_service_time_sec: float = 300.0) -> float:
        """
        Estimate average waiting time across all queued farmers.

        Parameters
        ----------
        avg_service_time_sec : float
            Mean time (seconds) required to process one farmer (default 5 min).

        Returns
        -------
        float
            Estimated average wait in seconds.
        """
        n = len(self._queue)
        if n == 0:
            return 0.0
        return avg_service_time_sec * (n - 1) / 2.0

    def __len__(self) -> int:
        return len(self._queue)


# ---------------------------------------------------------------------------
# 3. SPT Scheduler (Shortest Processing Time)
# ---------------------------------------------------------------------------

class SPTScheduler:
    """
    Shortest Processing Time (SPT) scheduler.

    Minimises average flow time / waiting time by serving farmers with
    smaller lots (lower quantity_kg) first. This is optimal for minimising
    mean completion time under a single-server model (Smith's Rule).

    Parameters
    ----------
    None

    Examples
    --------
    >>> sched = SPTScheduler()
    >>> sched.add(FarmerToken("F01", "paddy", 2000.0, 14.0, 0.0, 1))
    >>> sched.add(FarmerToken("F02", "paddy",  400.0, 14.0, 0.1, 2))
    >>> sched.serve_next().farmer_id  # F02 served first (smaller lot)
    'F02'
    """

    def __init__(self) -> None:
        self._pending: List[FarmerToken] = []
        self._dirty: bool = False

    def add(self, token: FarmerToken) -> None:
        """Add a farmer token. O(1) amortised."""
        self._pending.append(token)
        self._dirty = True

    def serve_next(self) -> FarmerToken:
        """
        Remove and return the farmer with the smallest lot (lowest quantity_kg).

        Returns
        -------
        FarmerToken

        Raises
        ------
        IndexError
            If no farmers are pending.

        Complexity: O(n log n) on first call after additions; O(1) thereafter.
        """
        if not self._pending:
            raise IndexError("SPT queue is empty.")
        if self._dirty:
            self._pending.sort(key=lambda t: t.quantity_kg)
            self._dirty = False
        return self._pending.pop(0)

    def estimated_completion_times(self) -> List[Tuple[str, float]]:
        """
        Compute expected completion time for each farmer in SPT order.

        Returns
        -------
        list of (farmer_id, completion_time_sec)
            Cumulative completion times assuming 0.25 seconds per kg.
        """
        RATE = 0.25  # seconds per kg (weighing + quality check)
        if self._dirty:
            self._pending.sort(key=lambda t: t.quantity_kg)
            self._dirty = False
        cumulative: float = 0.0
        result: List[Tuple[str, float]] = []
        for token in self._pending:
            cumulative += token.quantity_kg * RATE
            result.append((token.farmer_id, cumulative))
        return result

    def __len__(self) -> int:
        return len(self._pending)


# ---------------------------------------------------------------------------
# 4. Greedy Resource Scheduler
# ---------------------------------------------------------------------------

class GreedyResourceScheduler:
    """
    Greedy scheduler that assigns farmers to the least-loaded resource (station).

    Each procurement centre has k weighing stations. New arrivals are assigned
    to whichever station has the shortest current queue — a greedy heuristic
    that approximates optimal load balancing in O(k) time.

    Parameters
    ----------
    num_stations : int
        Number of active weighing / procurement stations (k).

    Examples
    --------
    >>> sched = GreedyResourceScheduler(num_stations=3)
    >>> tok = FarmerToken("F01", "paddy", 800.0, 15.0, 0.0, 1)
    >>> station_id = sched.assign(tok)
    >>> station_id
    0
    """

    def __init__(self, num_stations: int) -> None:
        if num_stations < 1:
            raise ValueError("num_stations must be at least 1.")
        self._stations: List[deque[FarmerToken]] = [deque() for _ in range(num_stations)]
        self._loads: List[float] = [0.0] * num_stations  # cumulative kg assigned

    def assign(self, token: FarmerToken) -> int:
        """
        Assign a farmer to the least-loaded station.

        Parameters
        ----------
        token : FarmerToken
            The arriving farmer's token.

        Returns
        -------
        int
            Zero-indexed station ID the farmer was assigned to.

        Complexity: O(k) where k = num_stations
        """
        target = int(min(range(len(self._stations)), key=lambda i: self._loads[i]))
        self._stations[target].append(token)
        self._loads[target] += token.quantity_kg
        return target

    def station_loads(self) -> Dict[int, float]:
        """
        Return current cumulative load (kg) per station.

        Returns
        -------
        dict[int, float]
        """
        return {i: load for i, load in enumerate(self._loads)}

    def utilisation_balance(self) -> float:
        """
        Measure load balance as 1 − (std_dev / mean).
        A value close to 1.0 indicates perfect balance.

        Returns
        -------
        float
            Balance score in [0, 1].
        """
        total = sum(self._loads)
        if total == 0:
            return 1.0
        mean = total / len(self._loads)
        variance = sum((l - mean) ** 2 for l in self._loads) / len(self._loads)
        std = variance ** 0.5
        return max(0.0, 1.0 - std / mean)
