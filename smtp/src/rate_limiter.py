import time
from collections import deque
from threading import Lock

from src.core.config import RateLimiterConfig


class RateLimiter:
    """Token bucket rate limiter for controlling request rates."""

    def __init__(self, config: RateLimiterConfig):
        """
        Initialize the rate limiter.
        
        Args:
            max_requests: Maximum number of requests allowed in the time window.
            time_window_seconds: Time window in seconds.
        """
        self.max_requests = config.RATE_LIMITER_MAX_REQUESTS
        self.time_window = config.RATE_LIMITER_TIME_WINDOW_SECONDS
        self._timestamps: deque[float] = deque()
        self._lock = Lock()

    def _cleanup_old_timestamps(self, current_time: float) -> None:
        """Remove timestamps outside the current time window."""
        cutoff = current_time - self.time_window
        while self._timestamps and self._timestamps[0] < cutoff:
            self._timestamps.popleft()

    def acquire(self) -> None:
        """
        Acquire permission to proceed. Blocks if rate limit is exceeded.
        
        This method will block until a slot is available within the rate limit.
        """
        while True:
            with self._lock:
                current_time = time.time()
                self._cleanup_old_timestamps(current_time)
                
                if len(self._timestamps) < self.max_requests:
                    self._timestamps.append(current_time)
                    return
                
                # Calculate wait time until oldest timestamp expires
                wait_time = self._timestamps[0] + self.time_window - current_time
            
            if wait_time > 0:
                print(f"Rate limit reached. Waiting {wait_time:.2f}s...")
                time.sleep(wait_time)

    def try_acquire(self) -> bool:
        """
        Try to acquire permission without blocking.
        
        Returns:
            True if acquired, False if rate limit would be exceeded.
        """
        with self._lock:
            current_time = time.time()
            self._cleanup_old_timestamps(current_time)
            
            if len(self._timestamps) < self.max_requests:
                self._timestamps.append(current_time)
                return True
            
            return False
