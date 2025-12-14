import re
import requests

class TemplateRenderer:
    """Handles template loading and variable substitution."""

    PLACEHOLDER_PATTERN = re.compile(r"\$\{\{\s*(\w+)\s*\}\}")

    def __init__(self, api_url: str):
        self.api_url = api_url.rstrip('/')

    def load_template(self, template_id: str) -> str:
        """Load template from API."""
        url = f"{self.api_url}/api/templates/{template_id}"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            template_out = response.json()
            return template_out["html"]
        except requests.RequestException as e:
            raise RuntimeError(f"Failed to load template {template_id} from {url}: {e}")

    def render(self, template_content: str, arguments: dict[str, str]) -> str:
        """Substitute ${{key}} placeholders with values from arguments."""
        def replace_match(match: re.Match) -> str:
            key = match.group(1)
            return str(arguments.get(key, match.group(0)))
        
        return self.PLACEHOLDER_PATTERN.sub(replace_match, template_content)
