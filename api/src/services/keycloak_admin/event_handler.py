

class Event_handler:

    def get_events(self, max_results: int = 100) -> list[dict]:
        """
        Fetch events from all tenant realms and the master realm.
        """
        token = self._get_admin_token()
        all_events = []

        master_events = self.get_master_realm_events(token,max_results)
        all_events.extend(master_events)

        tenant_realms = self.list_realms(exclude_system=True)

        for realm_info in tenant_realms:
            tenant_events = self.get_tenant_lvl_events(realm_info,max_results,token)
            
            if tenant_events:
                all_events.extend(tenant_events)

        # Sort by timestamp descending (most recent first)
        all_events.sort(key=lambda x: x.get("timestamp", 0), reverse=True)

        return all_events[:max_results]


    def get_master_realm_events(self,token,max_results:int):

        all_events = []
        
        master_admin_url = f"{self.keycloak_url}/admin/realms/master/admin-events"

        r = self.keycloak_client._make_request("GET",master_admin_url,token,params={"max": max_results // 3})

        events = r.json()

        for event in events:
            resource_type = event.get("resourceType", "")
            operation = event.get("operationType", "Unknown")

            if operation == "DELETE":
                level = "warning"
            else:
                level = "info"

            resource_path = event.get("resourcePath", "")
            resource_name = resource_path.split("/")[-1] if resource_path else ""

            message = f"{resource_type} {operation}"
            if resource_name:
                message += f": {resource_name}"

            all_events.append(
            {
                "id": event.get("id", f"master-admin-{event.get('time', 0)}"),
                "timestamp": event.get("time"),
                "level": level,
                "message": message,
                "source": "Admin - Master",
                "user": event.get("authDetails", {}).get("username", "admin"),
                "realm": "master",
                "details": {
                    "resourceType": resource_type,
                    "resourcePath": resource_path,
                    "operationType": operation,
                },
            }
        )

        return all_events



    def get_tenant_lvl_events(self, realm_info: dict,max_results:int,token:str):

        all_events = []
        realm_name = realm_info.get("realm")
        if not realm_name:
            return all_events


        admin_events_url = (
            f"{self.keycloak_url}/admin/realms/{realm_name}/admin-events"
        )

        r = self.keycloak_client._make_request("GET",admin_events_url,token,params={"max": max_results // 3})

        events = r.json()
        
        for event in events:
            all_events.append(
                self.proccess_admin_event(event,realm_name)
            )

        login_events_url = f"{self.keycloak_url}/admin/realms/{realm_name}/events"
        
        r = self.keycloak_client._make_request("GET",login_events_url,token,params={"max": max_results // 3})

        events = r.json()
        
        for event in events:
            all_events.append(
                    self.proccess_auth_event(event,realm_name)
                )

    
    def proccess_auth_event(self,event: dict,realm_name:str):

        event_type = event.get("type", "UNKNOWN")

        if event_type in ("LOGIN", "LOGOUT", "REGISTER"):
            level = "info"
        elif event_type.endswith("_ERROR"):
            level = "error"
        else:
            level = "info"

        return {
                        "id": event.get(
                            "id", f"{realm_name}-auth-{event.get('time', 0)}"
                        ),
                        "timestamp": event.get("time"),
                        "level": level,
                        "message": event_type.replace("_", " ").title(),
                        "source": f"Auth - {realm_name}",
                        "user": event.get(
                            "userId",
                            event.get("details", {}).get("username", "Unknown"),
                        ),
                        "realm": realm_name,
                        "details": event.get("details", {}),
                    }
                    

    def proccess_admin_event(self,event: dict,realm_name:str):

        resource_type = event.get("resourceType", "")
        operation = event.get("operationType", "Unknown")

        if operation in ("CREATE", "UPDATE"):
            level = "info"
        elif operation == "DELETE":
            level = "warning"
        else:
            level = "info"

        resource_path = event.get("resourcePath", "")
        resource_name = (
            resource_path.split("/")[-1] if resource_path else ""
        )

        message = f"{resource_type} {operation}"
        if resource_name:
            message += f": {resource_name}"

        return {
                        "id": event.get(
                            "id", f"{realm_name}-admin-{event.get('time', 0)}"
                        ),
                        "timestamp": event.get("time"),
                        "level": level,
                        "message": message,
                        "source": f"Admin - {realm_name}",
                        "user": event.get("authDetails", {}).get(
                            "username", "unknown"
                        ),
                        "realm": realm_name,
                        "details": {
                            "resourceType": resource_type,
                            "resourcePath": resource_path,
                            "operationType": operation,
                        },
                    }

    
