# High level summary of this page:
#   1. imports modules we need
#   2. defines functions for the test environment & login/out situation

import pytest
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
# for production
# sys.path.append('C:\\control-app\\appEnv\\sql_getter_app')
import sql_getter_app
from sql_getter_app import app
from sql_getter_app.collection import db
from sql_getter_app.auth import login, logout

# app = Flask(__name__)
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///C:/control-app/appEnv/sql_getter_app/'
# db = SQLAlchemy(app)

test_db = db

def test_assert():
    assert True

def test_login_logout():
    response = login()
    assert "location.replace(\'https://api.byu.edu/authorize?response_type=code&client_id=9sFLS8QY4facFFt5zfMjMJdIJuMa&redirect_uri=https://controlstest.byu.edu/redirect_from_auth&scope=openid&state=myteststate');" in response

    response = logout()
    assert str(response) == "<Response 257 bytes [302 FOUND]>"

@pytest.fixture
def client():
    app.testing=True
    client = app.test_client()
    with app.test_client():
        with app.app_context():
            db.init_app(app)
            client.db=db
            yield client
        # yield client