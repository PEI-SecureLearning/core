# Refactor Plan

## First prompt

The code in the backend (api folder) is a big mess now. there's plenty duplicated code, inconsistent data objects being used, and high coupling on a lot of the services. In particular the services for keycloak admin, keycloak client, and platform admin are very confusing and there's a lot of duplicated code. Analyze the codebase and list the bad practices, inconsistencies and problems accross the backend, for me to make a plan to refactor the codebase.

## Second prompt

The singletons for the handlers are there for a reason. They are meant to be used by the other handlers that are part of the same service.
