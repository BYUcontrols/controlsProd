import flask_login
from flask import (Flask, escape, redirect, render_template, request, session, url_for, Blueprint)
from crud import pull
from auth import login_required
from collection import production, versionString
from menuCreation import getMenuForRole

bp = Blueprint("navigationPages", __name__)

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

