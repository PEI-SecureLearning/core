class event_handler:

    def get_platform_logs(self, max_results: int = 100) -> dict:
        """Get platform logs/events from all tenant realms."""
        events = self.admin.get_events(max_results)
        return {"logs": events}
