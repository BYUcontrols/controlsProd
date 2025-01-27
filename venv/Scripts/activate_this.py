import os
import sys

# Path to the virtual environment directory
venv_dir = os.path.dirname(os.path.abspath(__file__))

# Set paths to activate the virtual environment
venv_base = os.path.abspath(os.path.join(venv_dir, ".."))
venv_site_packages = os.path.join(venv_base, "Lib", "site-packages")

# Add the virtual environment's site-packages directory to sys.path
sys.path.insert(0, venv_site_packages)

# Set environment variables for the virtual environment
os.environ["VIRTUAL_ENV"] = venv_base
os.environ["PATH"] = os.path.join(venv_base, "Scripts") + os.pathsep + os.environ["PATH"]
