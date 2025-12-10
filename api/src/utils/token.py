import uuid


def generate_tracking_token() -> str:
    return str(uuid.uuid4())
