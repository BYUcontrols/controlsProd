# High level summary of this page:
#   1. creates the navigationPages blueprint
#   2. defines the function to serve the home page
#   3. defines the function to serve the site map page

import flask_login
from flask import (Flask, redirect, render_template, request, session, url_for, Blueprint)
from markupsafe import escape
# below are local module imports
from sql_getter_app.crud import pull
from sql_getter_app.auth import login_required
from sql_getter_app.collection import production, versionString
from sql_getter_app.menuCreation import getMenuForRole

bp = Blueprint("navigationPages", __name__) # sets up the blueprint with name navigationPages defined at __name__

################## home page ##################################
@bp.route('/')
@bp.route('/home')
@login_required
def home():

    User = flask_login.current_user
    # if a user is below the non shop level then serve them the home page
    if User.isShopUser:
        return render_template('home.html',
            userN=User.fullName,
            role=User.roleText,
            loggedIn=True,
            pageOnLoadFunction='',
            isAdmin=User.isAdmin,
            production=production,
            menuObject=getMenuForRole(User),
            versionString=versionString)
    # if they aren't part of the shop then serve them the 401 (foreign user) error
    else:
        from flask import abort
        abort(401)

########################### Site Map page #########################
@bp.route('/siteMap')
@login_required
def siteMap():

    User = flask_login.current_user
    # if a user is below the non shop level then serve them the hope page
    if User.isShopUser:
        return render_template('navigation_pages/siteMap.html',
            userN=User.fullName,
            role=User.roleText,
            loggedIn=True,
            isAdmin=User.isAdmin,
            production=production,
            menuObject=getMenuForRole(User),
            versionString=versionString)
    # if they aren't part of the shop then serve them the 401 (foreign user) error
    else:
        from flask import abort
        abort(401)
