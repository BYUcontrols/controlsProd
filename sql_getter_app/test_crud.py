import sys
# for production
#sys.path.append('C:\\control-app\\appEnv\\sql_getter_app')

import pytest
import sql_getter_app

from .collection import db
from .crud import pull
from test_app import client, test_db, login, logout

def test_read_user(client):
           
    with sql_getter_app.app.test_client() as c:
        with sql_getter_app.app.app_context(): 
            db.engine.execute("""INSERT INTO [dbo].[User] (userName, firstName, lastName, technician, phone, eMail, vendorId, userIdModified, userRoleId) 
                        VALUES ('johndoe', 'John', 'Doe', 0, 1234567890, 'john@doe.com', 1, 1, 1);""")
            with sql_getter_app.app.test_request_context('home', data={"filter" : "userName:{'op':'is','list':['johndoe']}"}):
                login(c)
                results = pull('User')
                print(results)
               # logout(c)                
            assert 'johndoe' in results
            db.engine.execute("DELETE FROM [dbo].[User] WHERE userName = 'johndoe'")

def test_create_user(client):
    with sql_getter_app.app.app_context(): 
        results = db.engine.execute("SELECT userName FROM [dbo].[User] WHERE userName = 'johndoe'").fetchall()
        print(results)
        assert results == []
        db.engine.execute("""INSERT INTO [dbo].[User] (userName, firstName, lastName, technician, phone, eMail, vendorId, userIdModified, userRoleId) 
                            VALUES ('johndoe', 'John', 'Doe', 0, 1234567890, 'john@doe.com', 1, 1, 1);""")
        with sql_getter_app.app.request_context("""?filter={"userName":{"op":"is","list":["johndoe"]}}"""):
            results = pull('User')
            print(results)
            assert 'johndoe' in results
        db.engine.execute("DELETE FROM [dbo].[User] WHERE userName = 'johndoe'")

def test_delete_user(test_db):
    test_db.execute("""INSERT INTO User (userName, firstName, lastName, technician, phone, eMail, vendorId, userIdModified, userRoleId) 
                        VALUES ('johndoe', 'John', 'Doe', 0, 1234567890, 'john@doe.com', 1, 1, 1);""")
    results = test_db.execute("SELECT userName FROM User WHERE userName = 'johndoe'").fetchall()
    assert results == [('johndoe',)]
    test_db.execute("DELETE FROM User WHERE userName = 'johndoe'")
    results = test_db.execute("SELECT userName FROM User WHERE userName = 'johndoe'").fetchall()
    assert results == []

def test_update_user(test_db):
    test_db.execute("""INSERT INTO User (userName, firstName, lastName, technician, phone, eMail, vendorId, userIdModified, userRoleId) 
                        VALUES ('johndoe', 'John', 'Doe', 0, 1234567890, 'john@doe.com', 1, 1, 1);""")
    results = test_db.execute("SELECT userName FROM User WHERE userName = 'johndoe'").fetchall()
    assert results == [('johndoe',)]
    test_db.execute("""UPDATE User
                        SET userName = 'janedeer'
                        WHERE userName = 'johndoe'""")
    results = test_db.execute("SELECT userName FROM User WHERE firstName = 'John'").fetchall()
    assert results == [('janedeer',)]
    test_db.execute("DELETE FROM User WHERE userName = 'johndoe'")