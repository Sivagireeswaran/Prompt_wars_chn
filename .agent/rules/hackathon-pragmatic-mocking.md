---
trigger: always_on
---

# Rule: Pragmatic Prototyping
- Design data layers with interfaces that allow hot-swapping between simulated/mock data and the live database.
- Graceful Degradation: If a service call fails, always log a warning but return reasonable mock fallback data to ensure the UI never crashes or shows a blank screen.
