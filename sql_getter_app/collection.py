import sys
# for production
#sys.path.append('C:\\control-app\\appEnv\\sql_getter_app')


# this file is for initializing services for the app, these were moved from __init__
#   so that we don't have children referencing resources from their parent
import flask_login
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine

# TRUE if we are in a production environment
production = True

# set the version string
# This is important to change as it forces browsers to reload their cashed js and css files, removing compatability errors
versionString = '1.1.3'


# This is similar to production but is set automatically by __init__.py/createApp()
# It tells us if we are running on vs code or Apache
# it must be an object that way when we edit it in _init__.py it will stay edited everywhere
testEnv = {'env':False}

# start a sqlAlchemy session to handle database access
db = SQLAlchemy(session_options={'echo':True})

# YOU NEED TO SUBSCRIBE TO THE BYU /token API WHEN CHANGING URLS:
#   1. api.byu.edu/store
#   2. Login using your byu account
#   3. create a new application
#       - callback url should be [ourApplicationUrl.byu.edu]/redirect_from_auth
#   4. subscribe to the 'OpenID-Userinfo-v1' api
#   5. go to 'My Subscriptions' and get the consumer key and secret
#       Key: is used when we redirect the client to CAS
#           and in the auth for the request made to the api
#       Secret: is used for auth by the api
#
login_manager = flask_login.LoginManager()

if production:
    # FOR THE PRODUCTION SERVER
    oauthKey = 'Ko4Jf56QQD6XkzCyjL0wvrdqdD4a'
    oauthSecret = 'z76WY79fNkTBpVrrR9cHQAb3NPIa'
    oauthRedirect = 'https://controls.byu.edu/redirect_from_auth'
else:
    # for dev server
    oauthKey = '9sFLS8QY4facFFt5zfMjMJdIJuMa'
    oauthSecret = 'EIb9pjBidIKhcpmy6yuRf3QBXtca'
    oauthRedirect = 'https://controlstest.byu.edu/redirect_from_auth'



# Admin Level this one is the access level for the admin (the hierarchy number in the Role table for admin)
# IF YOU CHANGE ADMIN PERMISSIONS YOU NEED TO CHANGE THIS VALUE OR PEOPLE YOU DON"T WANT TO COULD GET ACCESS TO ADMIN TOOLS
adminRoleId = 1



# LOG PROCESS TIMES FOR PYTHON
# to implement put code inside 
#
# from extensions import profiled
# with profiled():
#    code you want to examine
import cProfile
import io
import pstats
import contextlib

@contextlib.contextmanager
def profiled():
    pr = cProfile.Profile()
    pr.enable()
    yield
    pr.disable()
    s = io.StringIO()
    ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
    ps.print_stats()
        # uncomment this to see who's calling what
    print(s.getvalue())


# Settup the logging for errors and other things
def startLogging(location):
    import logging
    import logging.handlers as handlers
    # set the logger to include the date and process before each log
    log_formatter = logging.Formatter('%(asctime)s %(levelname)s %(funcName)s(%(lineno)d) %(message)s')
    # get the basic logger
    basicLogger = logging.getLogger('root')
    basicLogger.setLevel(logging.DEBUG)
    # settup the logger for activity
    logHandler = handlers.RotatingFileHandler(location+'activity.log', maxBytes=1024*100, backupCount=10)
    logHandler.setLevel(logging.DEBUG)
    logHandler.setFormatter(log_formatter)
    basicLogger.addHandler(logHandler)
    # settup the logger for errors
    logHandler = handlers.RotatingFileHandler(location+'errors.log', maxBytes=1024*100, backupCount=10)
    logHandler.setLevel(logging.ERROR)
    logHandler.setFormatter(log_formatter)
    basicLogger.addHandler(logHandler)


#useful function
def camel_to_title(name):
    import re
    name = re.sub('(.)([A-Z][a-z]+)', r'\1 \2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1 \2', name).title()


# EMAIL EXPERIMENTS

# works with any @byu.edu email

import smtplib, ssl, imaplib

sendPort = 587
checkPort = 993
username = ''
password = ''
externalEmailServer = 'mail.byu.edu'
secureContext = ssl.create_default_context()

sendEmails = smtplib.SMTP(externalEmailServer, sendPort)
sendEmails.starttls(context=secureContext)

receiveEmails = imaplib.IMAP4_SSL(externalEmailServer, checkPort, ssl_context=secureContext)

def startEmailServices():
    try: 
        sendEmails.login(username, password)
        receiveEmails.login(username, password)

    except:
        print('Login to emails failed')
    