# High level summary of this page:
#   1. imports modules/libraries
#   2. defines if we are in production
#   3. sets the version string
#   4. defines the environment automatically
#   5. starts SQLAlchemy for database access
#   6. sets up login_manager
#   7. sets up the server depending on which environment we are in
#   8. sets the admin role id, should be the same as the database
#   9. sets up profiler to check compile speed
#   10. sets up logging for messages
#   11. defines a function to change things in camel case to title case
#   12. experiments with some code to work with email services


# this file is for initializing services for the app, these were moved from __init__
# so that we don't have children referencing resources from their parent
import flask_login                              # flask_login holds the settings for logging in
from flask_sqlalchemy import SQLAlchemy         # makes SQLAlchemy code available
import os




# variable to be passed into other files to run things based on production status
production = os.environ.get('FLASK_ENV') == 'production'
    

# set the version string, declaring this variable
# This is important to change as it forces browsers to reload their cashed js and css files, removing compatability errors
# You change this when you push to production. Same as the production variable above at about line 29
versionString = '1.1.3'


# This is similar to production but is set automatically by __init__.py/createApp()
# It tells us if we are running on vs code or Apache
# it must be an object that way when we edit it in _init__.py it will stay edited everywhere
# declaring this variable
testEnv = {'env':True}

# start a sqlAlchemy session to handle database access
db = SQLAlchemy()

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

login_manager = flask_login.LoginManager()  # declares the login_manager variable and assigns it the LoginManager() class from the flask_login module we imported above

if production:
    # FOR THE PRODUCTION SERVER
    oauthKey = 'Ko4Jf56QQD6XkzCyjL0wvrdqdD4a'                           # this is the stuff that you would get by following the instructions
    oauthSecret = 'z76WY79fNkTBpVrrR9cHQAb3NPIa'                        # under 'YOU NEED TO SUBSCRIBE...' section above
    oauthRedirect = 'https://controls.byu.edu/redirect_from_auth'
else:
    # for dev server
    oauthKey = '9sFLS8QY4facFFt5zfMjMJdIJuMa'
    oauthSecret = 'EIb9pjBidIKhcpmy6yuRf3QBXtca'
    oauthRedirect = 'https://controlstest.byu.edu/redirect_from_auth'



# Admin Level one is the access level for the admin (the hierarchy number in the Role table for admin)
# IF YOU CHANGE ADMIN PERMISSIONS YOU NEED TO CHANGE THIS VALUE OR PEOPLE YOU DON'T WANT TO COULD GET ACCESS TO ADMIN TOOLS
adminRoleId = 1

# Other useful variables to have that get imported to other modules
userTechId = '(True,)' # MASON: The value for in the technician column of the User table that means a user IS a technician. If that value changes, you need to change it here, too.
devUserName = 'test'

# LOG PROCESS TIMES FOR PYTHON
# to implement put code inside 
#
# from extensions import profiled
# with profiled():
#    code you want to examine

import cProfile         # cProfile is a built-in python module that can perform profiling (doing a dynamic analysis that measures the execution time of the program and everything that compose it. That means measuring the time spent in each of its functions. This will give you data about where your program is spending time, and what area might be worth optimizing)
import io               # io is the input/output operations module for python
import pstats           # pstats module is a tool that analyzes data collected by the Python profiler
import contextlib       # provides utilities for resource allocation to the with statement. The with statement in Python is used for resource management and exception handling

# info on the @ symbol when used like this: https://en.wikipedia.org/wiki/Python_syntax_and_semantics#Decorators
@contextlib.contextmanager          # the decorator is passed the object being modified (in this case contextlib.contextmanager)
def profiled():                     # everything under profiled is the modification to the original object
    pr = cProfile.Profile()         # creates an instance of the Profile class
    pr.enable()                     # starts collecting profile data
    yield                           # used to return from a function without destroying the states of its local variable and when the function is called, the execution starts from the last yield statement. Any function that contains a yield keyword is termed a generator.
    pr.disable()                    # stops collecting profile data. what comes next formats the statistics
    s = io.StringIO()               # creates an instance of the StringIO class
    ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')    # generates the report
    ps.print_stats()                # Create a Stats object based on the current profile and print the results to stdout
    print(s.getvalue())             # see who's calling what
# the above essentially states: profiled = contextlib.contextmanager(profiled)

# Setup the logging for errors and other things
def startLogging(location):                     # define the startLogging function with the location variable as a parameter
    import logging                              # logging module lets you save (or log) messages. https://realpython.com/python-logging/
    import logging.handlers as handlers         # lets you refer to logging.handlers as handlers (so you don't have to type as much below)
    # set the logger to include the date and process before each log
    log_formatter = logging.Formatter('%(asctime)s %(levelname)s %(funcName)s(%(lineno)d) %(message)s') # this formats the log
    # get the basic logger
    basicLogger = logging.getLogger('root')     # root is the basic logger from logging. this creates a variable basicLogger and assigns root (the basic logger) to it
    basicLogger.setLevel(logging.DEBUG)         # the basic logger will log debug messages
    # settup the logger for activity
    logHandler = handlers.RotatingFileHandler(location+'activity.log', maxBytes=1024*100, backupCount=10)   # specifies the location file of the log, the max memory, and the number of backup files of the log
    logHandler.setLevel(logging.DEBUG)          # the log handler is for logs that log debug messages
    logHandler.setFormatter(log_formatter)      # it uses the format that was specified above in log_formatter
    basicLogger.addHandler(logHandler)          # this connects the logHandler object to the basicLogger object
    # settup the logger for errors
    logHandler = handlers.RotatingFileHandler(location+'errors.log', maxBytes=1024*100, backupCount=10)     # specifies the location file of the log, the max memory, and the number of backup files of the log 
    logHandler.setLevel(logging.ERROR)          # the log handler is for logs that log error messages
    logHandler.setFormatter(log_formatter)      # it uses the format that was specified above in log_formatter
    basicLogger.addHandler(logHandler)          # this connects the logHandler object to the basicLogger object


#useful function
def camel_to_title(name):   # starts defining the camel_to_title function with the object name as parameter
    import re               # imports the re module (regular expression) re is a special sequence of characters that helps you match or find other strings or sets of strings
    name = re.sub('(.)([A-Z][a-z]+)', r'\1 \2', name)           # this specifies the kind of string that name has to be
    return re.sub('([a-z0-9])([A-Z])', r'\1 \2', name).title()  # this somehow converts the name string from camel case to title case
