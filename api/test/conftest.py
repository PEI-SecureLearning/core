"""Test configuration and shared fixtures."""

import sys
from pathlib import Path

# Add both root and src to path for imports
root_path = Path(__file__).parent.parent
src_path = root_path / "src"
sys.path.insert(0, str(root_path))
sys.path.insert(0, str(src_path))
