from src.services.platform_admin.base_handler import base_handler


class event_handler(base_handler):

    def __init__(self):
        super().__init__()

    def get_platform_logs(self, max_results: int = 100) -> dict:
        """Get platform logs/events from all tenant realms."""
        events = self.admin.get_events(max_results)
        return {"logs": events}


_instance: event_handler | None = None


def get_event_handler() -> event_handler:
    global _instance
    if _instance is None:
        _instance = event_handler()
    return _instance
