# High level summary of this page:
#   1. Imports modules/libraries so you can use their code 
#   2. Defines the create_app() function
#       a. creates an instance of the Flask class as an app
#       b. chooses which db to used base on if we're in production or development mode
#       c. configures the app from part a.
#       d. initializes the database using SQLAlchemy
#       e. looks at if we're in production or development environment
#       f. initializes and configures the log in manager from Flask
#       g. defines the time a user has before getting logged out
#       h. imports blueprints
#       i. creates the menu templates
#       j. returns the instance of app created in part a.
#   3. creates a global instance of app and assigns it to the returned value from create_app()

##########----NOTES ON from AND import CODE IN PYTHON----########
##### from [module] import [function or value] #####
# from identifies the module you are pulling from (the source) in python, a module is a file that ends in .py
# import identifies the function or value you are pulling into your code (the actual thing being implemented)
# hover over flask or Flask below for more info. Works with other keywords, too.


from flask import Flask                 # makes code that builds web apps w/ flask available. flask is framework, Flask is Python class datatype


# local imports
from sql_getter_app.collection import db as sqlDB      # this pulls from collection.py the db variable which can be referenced in this module as sqlDB
from sql_getter_app.collection import (login_manager, production, testEnv)
from sql_getter_app.menuCreation import createMenus    # final description in case you don't understand: makes the createMenus function from the menuCreation.py module available in this module

# set FLASK_ENV to 'production' in the .flaskenv file before deploying to production. set to development when in dev mode


def create_app(test_config = None):     #def keyword defines a function | def name(parameters): | inside function is indented. fun ends with return statement.

    # start the logging to files in the /controls_app/logs folder
    # when not running on APACHE (ie vsCode) then this redirects errors and messages from the terminal to a file
    # pass the location for the logging folder as a string, eg '/control-app/logs/'
    # startLogging('/control-app/logs/')

    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)    # this usually follows the 'from flask import Flask' statement. creates an instance of the Flask class
                                                            # If we set instance_relative_config=True when we create our app with the Flask() call, app.config.from_pyfile() will load the specified file from the instance/ directory.
    # choose the database to use based on the production variable in collection
    if (production):
        databasePath = 'mssql+pyodbc://controlsApp:ContApp1@SSVS470/Controls?driver=SQL+Server' # if testExpression: statement(s) | statements can be indented within the if statement if there are multiple
    else:
        databasePath = 'mssql+pyodbc://controlsApp:ContApp1@SSVS470/ControlsTest?driver=SQL+Server'           
    # databasePath = 'mssql+pyodbc://controlsApp:ContApp1@SSVS470/Controls?driver=SQL+Server'

    app.config.from_mapping(                    # configures the app that was created above | app.config.from_mapping() sets some default configuration that the app will use
        SECRET_KEY='D&C 43:34 3EFioajnJ1m68A7VxbkrNTV4IQSPNLLqmHOAN9C6tOqUh1ihWh4xbNVOtb7jbXZ7S7x6z9RosVimcc', # for encripting session cookies
        SQLALCHEMY_DATABASE_URI=databasePath,   # getting the db path defined above 
        SQLALCHEMY_TRACK_MODIFICATIONS='False', # disables SQLAlchemy tracking to save system resources
        USE_SESSION_FOR_NEXT=True               # if USE_SESSION_FOR_NEXT is True, the page is stored in the session under the key next.         
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = 'False'  # disables SQLAlchemy tracking to save system resources
    
    #database initialization | This is a way to safely bind database handler to Flask app in a way that manages connections.
    sqlDB.init_app(app)         # .init_app() is an instance method that can access unique data from its instance

    #if we are a production server or not
    #app.production = (app.FLASK_ENV == 'production')
    app.production = production #sets the environment to the value of production from collection.py module

    # if we are running on a test environment or not
    # this is defined by the visual studio debug config file
    # default is False, so it will be false if run on apache
    # testEnv is from the collection module
    testEnv['env'] = not production
    # Initialize and configure the login manager    
    login_manager.init_app(app)
    app.login_manager = login_manager

    # TIME BEFORE A USER MUST TO LOGIN AGAIN IN SECONDS
    login_manager.userTimeout = 18000

    # load blueprints
    # These are portals by which flask can search various files for @route() tags
    # these are not classes, but blueprints for classes

    from sql_getter_app.crud import bp as crudbp
    app.register_blueprint(crudbp)
    from sql_getter_app.auth import bp as authbp
    app.register_blueprint(authbp)
    from sql_getter_app.tables import bp as tablesbp
    app.register_blueprint(tablesbp)
    from sql_getter_app.tableLinks import bp as tableLinksbp
    app.register_blueprint(tableLinksbp)
    from sql_getter_app.errors import bp as errorsbp
    app.register_blueprint(errorsbp)
    from sql_getter_app.serviceRequests import bp as serviceRequestBp
    app.register_blueprint(serviceRequestBp)
    from sql_getter_app.navigationPages import bp as navigationPagesBp
    app.register_blueprint(navigationPagesBp)

    # create the menu templates for the various roles from menuCreation module
    createMenus(app)

    return app  # returns the instance of the app that was created

app = create_app()  # instantiates the flask application