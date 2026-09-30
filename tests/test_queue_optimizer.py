"""
test_queue_optimizer.py
=======================
Pytest suite for AgriQueue scheduling algorithms:
  - FarmerToken priority ordering
  - PriorityQueueScheduler (heap behaviour, edge cases)
  - FCFSScheduler (FIFO correctness, wait estimation)
  - SPTScheduler (SPT ordering, completion time computation)
  - GreedyResourceScheduler (load balancing, capacity distribution)
"""

import time
import pytest
from algorithms.queue_optimizer import (
    FarmerToken,
    PriorityQueueScheduler,
    FCFSScheduler,
    SPTScheduler,
    GreedyResourceScheduler,
)


# ──────────────────────────────────────────────────────────────
# FarmerToken
# ──────────────────────────────────────────────────────────────

class TestFarmerToken:
    def test_perishable_gets_lower_priority_score(self, sample_token_paddy, sample_token_tomato):
        """Tomato (perishable + high moisture) must have lower priority_score than paddy."""
        assert sample_token_tomato.priority_score < sample_token_paddy.priority_score

    def test_fields_preserved(self, sample_token_paddy):
        """All input fields must be stored unchanged."""
        assert sample_token_paddy.farmer_id == "F001"
        assert sample_token_paddy.commodity == "paddy"
        assert sample_token_paddy.quantity_kg == 1200.0
        assert sample_token_paddy.moisture_pct == 18.0
        assert sample_token_paddy.token_number == 1

    def test_ordering_by_priority(self, sample_token_paddy, sample_token_tomato, sample_token_wheat):
        """Tokens sorted by priority_score should place tomato first."""
        tokens = [sample_token_paddy, sample_token_wheat, sample_token_tomato]
        ordered = sorted(tokens)
        assert ordered[0].commodity == "tomato"

    def test_high_quantity_increases_score(self):
        """Very large lots should receive a slightly higher score (delayed)."""
        t_small = FarmerToken("F10", "paddy", 100.0, 15.0, 0.0, 1)
        t_large = FarmerToken("F11", "paddy", 10000.0, 15.0, 0.0, 2)
        assert t_large.priority_score > t_small.priority_score


# ──────────────────────────────────────────────────────────────
# PriorityQueueScheduler
# ──────────────────────────────────────────────────────────────

class TestPriorityQueueScheduler:
    def test_push_pop_single(self, sample_token_paddy):
        """Push one token; pop must return it."""
        sched = PriorityQueueScheduler()
        sched.push(sample_token_paddy)
        result = sched.pop()
        assert result.farmer_id == "F001"

    def test_priority_order_respected(self, sample_token_paddy, sample_token_tomato):
        """Tomato must be popped before paddy due to lower priority score."""
        sched = PriorityQueueScheduler()
        sched.push(sample_token_paddy)
        sched.push(sample_token_tomato)
        first = sched.pop()
        assert first.commodity == "tomato"

    def test_empty_queue_raises(self):
        """Popping from empty queue must raise IndexError."""
        sched = PriorityQueueScheduler()
        with pytest.raises(IndexError):
            sched.pop()

    def test_len_tracks_size(self, sample_token_paddy, sample_token_wheat):
        """__len__ must reflect the number of tokens in the queue."""
        sched = PriorityQueueScheduler()
        assert len(sched) == 0
        sched.push(sample_token_paddy)
        assert len(sched) == 1
        sched.push(sample_token_wheat)
        assert len(sched) == 2
        sched.pop()
        assert len(sched) == 1

    def test_peek_does_not_remove(self, sample_token_paddy):
        """peek() must not remove the token from the queue."""
        sched = PriorityQueueScheduler()
        sched.push(sample_token_paddy)
        peeked = sched.peek()
        assert peeked is not None
        assert len(sched) == 1

    def test_queue_snapshot_sorted(self, sample_token_paddy, sample_token_tomato, sample_token_wheat):
        """queue_snapshot must return tokens in ascending priority order."""
        sched = PriorityQueueScheduler()
        for t in [sample_token_wheat, sample_token_paddy, sample_token_tomato]:
            sched.push(t)
        snapshot = sched.queue_snapshot()
        scores = [t.priority_score for t in snapshot]
        assert scores == sorted(scores)

    def test_boundary_zero_tokens(self):
        """Queue with no tokens should peek None and len 0."""
        sched = PriorityQueueScheduler()
        assert sched.peek() is None
        assert len(sched) == 0


# ──────────────────────────────────────────────────────────────
# FCFSScheduler
# ──────────────────────────────────────────────────────────────

class TestFCFSScheduler:
    def test_fifo_order(self, sample_token_paddy, sample_token_tomato):
        """First enqueued must be first dequeued regardless of priority."""
        sched = FCFSScheduler()
        sched.enqueue(sample_token_paddy)    # arrived first
        sched.enqueue(sample_token_tomato)   # arrived second
        first_out = sched.dequeue()
        assert first_out.farmer_id == "F001"  # paddy, despite tomato having priority

    def test_empty_dequeue_raises(self):
        sched = FCFSScheduler()
        with pytest.raises(IndexError):
            sched.dequeue()

    def test_average_wait_zero_queue(self):
        sched = FCFSScheduler()
        assert sched.average_wait_estimate() == 0.0

    def test_average_wait_single_farmer(self, sample_token_paddy):
        """Single farmer in queue has zero wait (they are next)."""
        sched = FCFSScheduler()
        sched.enqueue(sample_token_paddy)
        # Average wait = avg_service * (n-1)/2 = 300 * 0/2 = 0
        assert sched.average_wait_estimate(300.0) == 0.0

    def test_average_wait_five_farmers(self):
        """With 5 farmers and 300s service time, avg wait = 600s."""
        sched = FCFSScheduler()
        for i in range(5):
            sched.enqueue(FarmerToken(f"F{i}", "paddy", 500.0, 14.0, float(i), i))
        expected = 300.0 * (5 - 1) / 2
        assert sched.average_wait_estimate(300.0) == expected

    def test_len_after_operations(self, sample_token_paddy, sample_token_wheat):
        sched = FCFSScheduler()
        sched.enqueue(sample_token_paddy)
        sched.enqueue(sample_token_wheat)
        assert len(sched) == 2
        sched.dequeue()
        assert len(sched) == 1


# ──────────────────────────────────────────────────────────────
# SPTScheduler
# ──────────────────────────────────────────────────────────────

class TestSPTScheduler:
    def test_smallest_quantity_served_first(self, sample_token_paddy, sample_token_wheat):
        """Paddy token (1200kg) < wheat (2500kg) — paddy served first under SPT."""
        sched = SPTScheduler()
        sched.add(sample_token_wheat)   # 2500 kg
        sched.add(sample_token_paddy)   # 1200 kg
        first = sched.serve_next()
        assert first.quantity_kg == 1200.0

    def test_empty_serve_raises(self):
        sched = SPTScheduler()
        with pytest.raises(IndexError):
            sched.serve_next()

    def test_completion_times_ascending(self, sample_token_paddy, sample_token_tomato, sample_token_wheat):
        """Completion times must be monotonically increasing."""
        sched = SPTScheduler()
        for t in [sample_token_wheat, sample_token_paddy, sample_token_tomato]:
            sched.add(t)
        completions = sched.estimated_completion_times()
        times = [c[1] for c in completions]
        assert times == sorted(times)

    def test_completion_time_formula(self):
        """For 1000 kg token, completion = 1000 * 0.25 = 250 sec."""
        sched = SPTScheduler()
        sched.add(FarmerToken("FA", "paddy", 1000.0, 15.0, 0.0, 1))
        completions = sched.estimated_completion_times()
        assert abs(completions[0][1] - 250.0) < 1e-6

    def test_size_decreases_on_serve(self, sample_token_paddy, sample_token_wheat):
        sched = SPTScheduler()
        sched.add(sample_token_paddy)
        sched.add(sample_token_wheat)
        assert len(sched) == 2
        sched.serve_next()
        assert len(sched) == 1


# ──────────────────────────────────────────────────────────────
# GreedyResourceScheduler
# ──────────────────────────────────────────────────────────────

class TestGreedyResourceScheduler:
    def test_first_assignment_goes_to_station_zero(self, sample_token_paddy):
        sched = GreedyResourceScheduler(num_stations=3)
        station = sched.assign(sample_token_paddy)
        assert station == 0

    def test_load_balancing_two_stations(self):
        """Two equal tokens → each station gets one."""
        sched = GreedyResourceScheduler(num_stations=2)
        t1 = FarmerToken("F1", "paddy", 1000.0, 15.0, 0.0, 1)
        t2 = FarmerToken("F2", "paddy", 1000.0, 15.0, 1.0, 2)
        s1 = sched.assign(t1)
        s2 = sched.assign(t2)
        assert s1 != s2

    def test_station_loads_sum_correctly(self):
        sched = GreedyResourceScheduler(num_stations=2)
        sched.assign(FarmerToken("F1", "paddy", 500.0, 14.0, 0.0, 1))
        sched.assign(FarmerToken("F2", "paddy", 300.0, 14.0, 1.0, 2))
        loads = sched.station_loads()
        assert sum(loads.values()) == pytest.approx(800.0)

    def test_utilisation_balance_perfect(self):
        """Two stations with identical loads → balance ≈ 1.0."""
        sched = GreedyResourceScheduler(num_stations=2)
        sched.assign(FarmerToken("F1", "paddy", 1000.0, 14.0, 0.0, 1))
        sched.assign(FarmerToken("F2", "paddy", 1000.0, 14.0, 1.0, 2))
        assert sched.utilisation_balance() == pytest.approx(1.0, abs=0.01)

    def test_invalid_station_count_raises(self):
        with pytest.raises(ValueError):
            GreedyResourceScheduler(num_stations=0)

    def test_single_station(self, sample_token_paddy, sample_token_wheat):
        """All tokens should go to station 0 when only one station exists."""
        sched = GreedyResourceScheduler(num_stations=1)
        assert sched.assign(sample_token_paddy) == 0
        assert sched.assign(sample_token_wheat) == 0
