# High level summary of this page:
#   1. import modules we need
#   2. defines functions for the test environment
#       a. load user
#       b. redirect from auth
#       c. logout

import pytest
from unittest.mock import patch, MagicMock, create_autospec
import sql_getter_app
import flask_login
from flask import app, url_for, request

from sql_getter_app.collection import db, login_manager
from sql_getter_app.user_class import user_session
from sql_getter_app.auth import load_user, login_required, redirect_from_auth, logout
from sql_getter_app.test_app import client
from sql_getter_app.conftest import test_app_context

def test_load_user():
    # patch the user_session.setFromString (returns True)
    with patch('auth.user_session.setFromString', return_value=True) as setMock:
        # run the test (valid user)
        result = load_user('data Things')
        # assert results
        setMock.assert_called_once_with('data Things', login_manager.userTimeout)
        assert isinstance(result, user_session)

    # patch the user_session.setFromString (returns False)
    with patch('auth.user_session.setFromString', return_value=False) as setMock:
        # run the test (invalid/timedout user)
        result = load_user('data Things')
        # assert results
        setMock.assert_called_once_with('data Things', login_manager.userTimeout)
        assert result == None

def test_redirect_from_auth(test_app_context):
    # get the request context
    with test_app_context.test_client() as c:
        # patch the user_session.setFromTolken member
        with patch('auth.user_session.setFromTolken') as setMock:
            # patch the login_user method
            with patch('auth.flask_login.login_user') as loginMock:
                # call the url with the a code argument
                c.get('/redirect_from_auth?code=testResponse')
                setMock.assert_called_once_with('testResponse')
                loginMock.assert_called_once()
                
def test_logout(test_app_context):
    # get the request context
    with test_app_context.test_client() as c:
        # patch the flask logout function
        with patch('auth.flask_login.logout_user') as logoutMock:
            # run the test
            response = c.get('/logout', follow_redirects=False)
            # assert that everything went correctly
            assert response.location == 'http://api.byu.edu/logout'
            logoutMock.assert_called_once()