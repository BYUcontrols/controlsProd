import sqlite3
import pytest
import sys
import os
# for production
#sys.path.append('C:\\control-app\\appEnv\\sql_getter_app')
import sql_getter_app
from sql_getter_app import app
from collection import db
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

#app = Flask(__name__)
#app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///C:/control-app/appEnv/sql_getter_app/'
#db = SQLAlchemy(app)

def test_assert():
    assert True

def test_login_logout(client):
    response = login(client)
    assert b'testLogin = true' in response.data
    from flask_login import current_user
    #assert current_user.get_id() == 'test'

    response = logout(client)
    print(response.data)
    assert b'Logout Successful' in response.data

    response = login(client, 'incorrect', 'credentials')
    assert b'Logout Failed. Please login with correct credentials.' in response.data



def logout(client):
    return client.get('/testLogout', follow_redirects=True)

@pytest.fixture
def client():
    app.testing=True
    client = app.test_client()
    with app.test_client():
        with app.app_context():
            db.init_app(app)
            client.db=db
        yield client

