# this is called by the apache server mod_wsgi setup and initializes the virtual environment and app
# specify where everything is
import sys
sys.path.append('C:\\control-app-prod') # so that apache can find sql_getter_app
# Add the virtual environment's site-packages to sys.path
venv_site_packages = 'C:\\control-app-prod\\venv\\Lib\\site-packages'
sys.path.insert(0, venv_site_packages)

# Now Python will search the virtual environment's site-packages first
# this will prevent conflicts with globally installed packages.

# start the virtual environment
activate_this = 'C:\\control-app-prod\\venv\\Scripts\\activate_this.py' # update path
with open(activate_this) as file_:
    exec(file_.read(), dict(__file__=activate_this))

import os
os.environ['FLASK_ENV'] = 'production'            # Set the environment
os.environ['FLASK_APP'] = 'sql_getter_app'        # Specify the app


# find app and initialize it as 'application' for mod_wsgi to talk to
from sql_getter_app import create_app
application = create_app()