# High level summary of this page:
# This is very simple
#   1. creates a function that sets up the instance of the app to use for testing
#   2. creates a function that starts an instance of the user_session class and fake logs it in

import pytest
import sys
import os
# for production
#sys.path.append('C:\\control-app\\appEnv\\sql_getter_app')
import sql_getter_app
from sql_getter_app import app
from .collection import db
from flask import Flask, appcontext_pushed
from flask_sqlalchemy import SQLAlchemy

# here we setup the instance of our app we will use for testing.
@pytest.fixture
def test_app_context():
    # setting testing as true lets us use the test_context() member of the flask app
    app.testing = True
    
    # using the test_request_context() allows flask_login and everything else to work
    with app.test_request_context():
        print('Running the test using the test database')
        app.config.from_mapping( # force the test to use the controlsTest database
            SQLALCHEMY_DATABASE_URI='mssql+pyodbc://controlsApp:ContApp1@SSVS470/ControlsTest?driver=SQL+Server'
        )
        # restart the database connection to use the new app
        db.init_app(app)
        # login a fake user
        import flask_login
        flask_login.login_user(testLoginUser())
        def handler(sender, **kwargs):
            flask_login.login_user(testLoginUser())
        with appcontext_pushed.connected_to(handler, app):
            # send the test client as well as the with context to the test function
            yield app
        
def testLoginUser():
    # start an instance of the user_session class and fake log it in
    from .user_class import user_session
    testUser = user_session()
    testUser.logged_in = True
    testUser.byuId = 'test_net_id'
    testUser.fullName = 'TESTING USER'
    testUser.roleId = 1
    # setting this one as test user in the test database is essential. 
    testUser.tableId = 1
    testUser.roleText = 'TESTING USER'
    # return the fake user
    return testUser