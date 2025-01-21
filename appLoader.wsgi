# this is called by the apache server mod_wsgi setup and initializes the virtual environment and app

# specify where everything is
import sys
sys.path.append('C:\\control-app-prod\\sql_getter_app')

# start the virtual environment
activate_this = 'C:\\control-app-prod\\venv\\Scripts\\activate_this.py' # update path
with open(activate_this) as file_:
    exec(file_.read(), dict(__file__=activate_this))

# find app and initialize it as 'application' for mod_wsgi to talk to
from __init__ import create_app
application = create_app()