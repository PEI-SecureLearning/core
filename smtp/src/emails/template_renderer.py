from pathlib import Path
import re

class TemplateRenderer:
    """Handles template loading and variable substitution."""

    PLACEHOLDER_PATTERN = re.compile(r"\$\{\{(\w+)\}\}")

    def __init__(self, templates_dir: Path = Path("templates")):
        self.templates_dir = templates_dir

    def load_template(self, template_path: str) -> str:
        """Load template from file, checking multiple locations."""
        path = Path(template_path)
        
        # Try absolute path first
        if path.is_absolute() and path.exists():
            return path.read_text(encoding="utf-8")
        
        # Try relative to templates directory
        relative_path = self.templates_dir / template_path
        if relative_path.exists():
            return relative_path.read_text(encoding="utf-8")
        
        raise FileNotFoundError(f"Template not found: {template_path}")

    def render(self, template_content: str, arguments: dict[str, str]) -> str:
        """Substitute ${{key}} placeholders with values from arguments."""
        def replace_match(match: re.Match) -> str:
            key = match.group(1)
            return str(arguments.get(key, match.group(0)))
        
        return self.PLACEHOLDER_PATTERN.sub(replace_match, template_content)
