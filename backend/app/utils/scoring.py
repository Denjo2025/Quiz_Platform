def calculate_score(base_points: int, time_limit: float, time_taken: float) -> int:
    """
    Full points for the first 20% of time window, then linear decrease to 50% of points.
    Wrong answer always gives 0 (handled by caller).
    """
    if base_points <= 0:
        return 0
    if time_limit <= 0:
        return 0
    if time_taken <= 0:
        return 0
    
    if time_taken <= time_limit * 0.2:
        return base_points
    ratio = (time_taken - time_limit * 0.2) / (time_limit * 0.8)
    ratio = max(0, min(1, ratio))  # Clamp to 0-1
    score = base_points * (1 - 0.5 * ratio)
    return max(int(score), base_points // 2)
