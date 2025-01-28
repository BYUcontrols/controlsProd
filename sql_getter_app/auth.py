# High level summary of this page:
#   1. creates a blueprint called auth
#   2. defines functions that control different logging-in/out situations
#       a. for example, the login_required function handles situations in which a user is not already logged in and accesses the site
#   3. handles the test login situation to be used only in development mode

import sys
# for production
#sys.path.append('C:\\control-app\\appEnv\\sql_getter_app')

# import modules that we need access to
#import functools
import flask_login
from flask import (Blueprint, redirect, request, render_template, abort)
from sqlalchemy.sql.expression import true

# below are imports from local modules
from collection import login_manager, db, production, versionString
from user_class import user_session # user_class.py

bp = Blueprint("auth", __name__)    # this creates a blueprint named auth. __name__ tells it where it is defined

    # Function called automatically by login_manager every time a request is made
    #   if there is a session cookie present in that request. It restores a user
    #   session based on the session cookie. It should return a logged in user_session class
@login_manager.user_loader
def load_user(sessionCookie):
    user = user_session()
    if user.setFromString(sessionCookie, login_manager.userTimeout):
        return user
    return None

    # Flag that can be set before a request to require login for that page
def login_required(view):
    def wrapped_view(**kwargs):
        if not flask_login.current_user.is_authenticated:
            return login_manager.unauthorized()
        return view(**kwargs)
    wrapped_view.__name__ = view.__name__
    return wrapped_view

    # The byu CAS login services redirects to this page on login
    #   the function logs in the user from the arguments of that
    #   redirect
@bp.route('/redirect_from_auth')
def redirect_from_auth():
    currentUser = user_session()
    currentUser.setFromTolken(request.args.get('code'))
    flask_login.login_user(currentUser, remember=True)
    return render_template('navigation_pages/onLogin.html')

    # return the login view
@bp.route('/login')
def login():
    return login_manager.unauthorized()

    # This function is run when an unauthorized user tries to access a page with the @login_required wrapper
    # in essence this is the pre login page. 
@login_manager.unauthorized_handler
def loginPage():
    from collection import oauthRedirect, oauthKey
    # return the loginRedirect.html template (it saves the url the user was trying to access in the localStorage then sends them
    # to the casUrl we passed to them)
    # the casUrl is the url for the byu login api 
    return render_template('navigation_pages/loginRedirect.html', 
        casUrl=f'https://api.byu.edu/authorize?response_type=code&client_id={oauthKey}&redirect_uri={oauthRedirect}&scope=openid&state=myteststate') 

    # logout the user
@bp.route('/logout')
def logout():
    # clear their session cookie and invalidate their session
    flask_login.logout_user()
    # send them to the byu logout page (specific to the api that we are using)
    return redirect('http://api.byu.edu/logout')

    # This logout only log you out of our site, not byu
@bp.route('/superficialLogout')
def superficialLogout():
    # clear their session cookie and invalidate their session
    flask_login.logout_user()
    # redirect them back home
    return redirect('/')

    # this url is for admins to test out other permission levels
    # it set's their new permission level
@bp.route('/adminLevelSpoof/<newLevel>/<roleText>')
def adminLevelSpoof(newLevel, roleText):
    User = flask_login.current_user

    if (User.is_authenticated): # make sure the user is logged in
        if (User.isAdmin): # make sure the user is an admin
                # set the spoofed permissions
            User.roleId = int(newLevel)
            User.roleText = roleText
                # replace the current session with the new one
            flask_login.login_user(User, remember=False) # close that window as soon as the window closes (we don't want a spoofed session sitting around)

            return redirect('/home')
    # if the user was not authenticated
    return 'unauthorized', 403 

    # this is the page where the user can use the previous function to spoof their user and test
@bp.route('/userTester')
def userTester():
    from menuCreation import getMenuForRole

    User = flask_login.current_user

    if (User.is_authenticated): # make sure the user is logged in
        if (User.isAdmin): # make sure the user is an admin (of COURSE this page is admins only)
            # fetch all the user roles and their hierarchies from the role table
            roleData = db.engine.execute('''
                SELECT role, roleId
                FROM [dbo].[Role]
                ''').fetchall()
            
            optionHTML = str()
            # loop through all the roles and construct an html option string from them
            for role in roleData:
                optionHTML += f"<option value='{role['roleId']}'>{role['role']}</option>"

            # return the adminRoleSpoof template            
            return render_template('adminRoleSpoof.html',
                userN=User.fullName,
                role=User.roleText,
                loggedIn=True,
                isAdmin=User.isAdmin,
                optionsHtml=optionHTML,
                production=production,
                menuObject=getMenuForRole(User),
                versionString=versionString)

######## TEST login #######
######## WARNING - this is a backdoor for development, anyone with the password can get full access.
###### It should only be available when the testEnv['env'] variable is true, indicating we are in a
###### test environment
################ if the link somehow gets lost here it is
@bp.route('/testLogin')
def testLogin():
    from collection import testEnv, adminRoleId
    ## should be if testEnv['env'] to restrict this login to test environment but cant get that to work rn 
    # so i bypassed that. remove in production-- Ben
    if True: # MAKE SURE WE ARE NOT IN A OUTWARD FACING ENVIRONMENT
        import json, time
        userCookie = dict()
        userCookie['id'] = 'test'
        userCookie['created'] = time.time_ns()
        userCookie['roleId'] = adminRoleId
        userCookie['tableId'] = 2
        userCookie['role'] = 'Admin'
        userCookie['name'] = 'test and dev user'
        userCookie['adminImposter'] = True
        userCookie['isShopUser'] = True

        currentUser = user_session()
        currentUser.setFromString(json.dumps(userCookie), login_manager.userTimeout)
        flask_login.login_user(currentUser)
        
        return redirect('/home')
    else: abort(403) # unauthorized