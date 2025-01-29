# High level summary of this page:
#   1. Creates an error blueprint
#   2. Defines places to route errors that the flask app calls

import sys
# for production
#sys.path.append('C:\\control-app\\appEnv\\sql_getter_app')

from flask import Blueprint, render_template
from sqlalchemy import text
# below are local module imports
from sql_getter_app.collection import db, flask_login, production

bp = Blueprint("errors", __name__)  # sets up the blueprint with name errors defined at __name__

# here we define places to route errors that the flask app calls
# They return custom error pages (and possibly record server errors in the database)

@bp.app_errorhandler(404)
def page_not_found(e):
    return render_template('errors/404.html', production=production), 404

@bp.app_errorhandler(500)
def page_not_found(e):    
    return render_template('errors/500.html', production=production), 500

@bp.app_errorhandler(403)
def page_not_found(e):
    return render_template('errors/403.html', production=production), 403

@bp.app_errorhandler(401)
def page_not_found(e):
    User = flask_login.current_user
    return render_template('errors/foreignUser.html', byuId=User.byuId, production=production), 401

@bp.route('/perpetualMotion')
def serverErrorTest():
    return 1/0