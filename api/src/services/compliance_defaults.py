from importlib import resources
from pathlib import Path


RESOURCE_PACKAGE = "src.resources"
RESOURCE_NAME = "compliance.md"
DEFAULT_PASSING_SCORE = 80
DEFAULT_QUESTION_COUNT = 5


DEFAULT_QUESTION_BANK: list[dict] = [
    {
        "id": "device-auth",
        "prompt": "Which control is mandatory for devices used for company work?",
        "options": [
            "Guest Wi-Fi access",
            "Strong authentication (passwords/PIN/biometric)",
            "No lock screen",
            "Public hotspot auto-connect",
        ],
        "answer_index": 1,
        "feedback": "Devices must be protected with strong authentication (password, PIN, biometrics).",
    },
    {
        "id": "vpn-public",
        "prompt": "When on public or untrusted networks, what is required?",
        "options": [
            "Nothing special, public Wi‑Fi is fine",
            "Use a company-approved VPN at all times",
            "Disable the lock screen",
            "Share credentials over email",
        ],
        "answer_index": 1,
        "feedback": "Always use the company-approved VPN when on public/untrusted networks.",
    },
    {
        "id": "auto-wifi",
        "prompt": "What should be disabled regarding Wi‑Fi on public hotspots?",
        "options": [
            "Wi‑Fi entirely",
            "Automatic connection to known public hotspots",
            "VPN",
            "Antivirus updates",
        ],
        "answer_index": 1,
        "feedback": "Disable automatic connection to known public hotspots to avoid unsafe access.",
    },
    {
        "id": "data-storage",
        "prompt": "Where is it forbidden to store company data?",
        "options": [
            "Approved cloud platforms or VPN-protected servers",
            "Local folders on unapproved personal devices",
            "Company servers via VPN",
            "Authorized web portals",
        ],
        "answer_index": 1,
        "feedback": "Do not store company data on unapproved personal devices or local folders.",
    },
    {
        "id": "personal-cloud",
        "prompt": "What is the rule about syncing company data to personal cloud accounts?",
        "options": [
            "Allowed if password-protected",
            "Allowed with manager approval only",
            "Not allowed unless explicitly approved",
            "Always allowed",
        ],
        "answer_index": 2,
        "feedback": "Syncing to personal cloud (e.g., Dropbox/iCloud) is not allowed without explicit approval.",
    },
    {
        "id": "incident-report",
        "prompt": "What must you do if a device is lost or information is suspected compromised?",
        "options": [
            "Wait 24 hours",
            "Report immediately to the Information Security team",
            "Try to fix it yourself",
            "Ignore unless confirmed breach",
        ],
        "answer_index": 1,
        "feedback": "Incidents must be reported immediately to the Information Security team.",
    },
    {
        "id": "screen-visibility",
        "prompt": "What is required for a secure workspace setup at home?",
        "options": [
            "Screens visible to family/guests",
            "Use open/public Wi‑Fi",
            "Screens not visible to unauthorized people",
            "Disable VPN",
        ],
        "answer_index": 2,
        "feedback": "Maintain a dedicated workspace where screens are not visible to unauthorized people.",
    },
]


def read_default_policy_markdown() -> str:
    """Load default compliance policy Markdown from packaged resources."""
    try:
        with resources.files(RESOURCE_PACKAGE).joinpath(RESOURCE_NAME).open(
            "r", encoding="utf-8"
        ) as f:
            content = f.read()
            if content:
                return content
    except FileNotFoundError:
        pass

    fallback_path = Path(__file__).resolve().parents[1] / "resources" / RESOURCE_NAME
    if fallback_path.exists():
        content = fallback_path.read_text(encoding="utf-8")
        if content:
            return content

    raise FileNotFoundError("Default compliance policy not found or empty.")
