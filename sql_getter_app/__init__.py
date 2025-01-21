

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine

from collection import db as sqlDB
from collection import (login_manager, oauthKey, oauthRedirect, startEmailServices, startLogging, production, testEnv)

from menuCreation import createMenus


def create_app(test_config = None):

    # start the logging to files in the /controls_app/logs folder
    # when not running on APACHE (ie vsCode) then this redirects errors and messages form the terminal to a file
    # pass the location for the logging folder as a string, eg '/control-app/logs/'
    #startLogging('/control-app/logs/')
    
    
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)

    # choose the database to use based on the production variable in collection
    if (production): databasePath = 'mssql+pyodbc://controlsApp:ContApp1@SSVS470/Controls?driver=SQL+Server'
    else: databasePath = 'mssql+pyodbc://controlsApp:ContApp1@SSVS470/ControlsTest3?driver=SQL+Server'

    app.config.from_mapping(
        SECRET_KEY='D&C 43:34 3EFioajnJ1m68A7VxbkrNTV4IQSPNLLqmHOAN9C6tOqUh1ihWh4xbNVOtb7jbXZ7S7x6z9RosVimcc', # for encripting session cookies
        SQLALCHEMY_DATABASE_URI=databasePath,
        SQLALCHEMY_TRACK_MODIFICATIONS='False',
        USE_SESSION_FOR_NEXT=True
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = 'False'
    
    #database initialization
    sqlDB.init_app(app)

    #if we are a production server or not
    #app.production = (app.FLASK_ENV == 'production')
    app.production = production

    # if we are running on a test environment or not
    # this is defined by the visual studio debug config file
    # default is False, so it will be false if run on apache
    testEnv['env'] = (app.config.get('ENV') == 'development')

    # Initialize and configure the login manager    
    login_manager.init_app(app)
    app.login_manager = login_manager

    # TIME BEFORE A USER MUST TO LOGIN AGAIN IN SECONDS
    login_manager.userTimeout = 18000

    # load blueprints
    # These are portals by which flask can search various files for @route() tags

    from crud import bp as crudbp
    app.register_blueprint(crudbp)
    from auth import bp as authbp
    app.register_blueprint(authbp)
    from tables import bp as tablesbp
    app.register_blueprint(tablesbp)
    from tableLinks import bp as tableLinksbp
    app.register_blueprint(tableLinksbp)
    from errors import bp as errorsbp
    app.register_blueprint(errorsbp)
    from serviceRequests import bp as serviceRequestBp
    app.register_blueprint(serviceRequestBp)
    from navigationPages import bp as navigationPagesBp
    app.register_blueprint(navigationPagesBp)
    
    # experimental, starts email services
    startEmailServices()

    # create the menu templates for the various roles
    createMenus(app)

    return app

app = create_app()
