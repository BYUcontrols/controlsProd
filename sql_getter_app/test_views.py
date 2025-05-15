import sys
# for production
#sys.path.append('C:\\control-app\\appEnv\\sql_getter_app')

import pytest
import sql_getter_app
from sql_getter_app.test_app import client, login, logout, test_db

def test_home_page(client):
    login(client)
    response = client.get('/')
    logout(client)
    assert response.status_code == 200
    #assert b'Welcome to the AC shop!' in response.data

def test_bbmd(client):
    login(client)
    response = client.get('/BBMD', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_building(client):
    login(client)
    response = client.get('/Building', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_country(client):
    login(client)
    response = client.get('/Country', follow_redirects=True)
    logout(client)
    assert response.status_code == 200
    print(response.data)
    assert b'window.tableName = "Country"' in response.data

def test_device(client):
    login(client)
    response = client.get('/Device', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_device_license(client):
    login(client)
    response = client.get('/DeviceLicense', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_device_subtype(client):
    login(client)
    response = client.get('/DeviceSubType', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_device_type(client):
    login(client)
    response = client.get('/DeviceType', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_dns(client):
    login(client)
    response = client.get('/DNS', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_failure(client):
    login(client)
    response = client.get('/Failure', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_failure_type(client):
    login(client)
    response = client.get('/FailureType', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_inventory(client):
    login(client)
    response = client.get('/Inventory', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_ip(client):
    login(client)
    response = client.get('/IP', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_part(client):
    login(client)
    response = client.get('/Part', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_manufacturer(client):
    login(client)
    response = client.get('/Manufacturer', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_ncrs_node(client):
    login(client)
    response = client.get('/NCRSNode', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_oit_jack(client):
    login(client)
    response = client.get('/OITJack', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_patch_panel(client):
    login(client)
    response = client.get('/PatchPanel', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_patch_panel_type(client):
    login(client)
    response = client.get('/PatchPanelType', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_phone_number(client):
    login(client)
    response = client.get('/PhoneNumber', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_phone_number_type(client):
    login(client)
    response = client.get('/PhoneNumberType', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_priority(client):
    login(client)
    response = client.get('/Priority', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_request_part(client):
    login(client)
    response = client.get('/RequestPart', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_request_note(client):
    login(client)
    response = client.get('/RequestNote', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_role(client):
    login(client)
    response = client.get('/Role', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_service_request(client):
    login(client)
    response = client.get('/ServiceRequest', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

# def test_service_type(client):
#     login(client)
#     logout(client)
#     assert response.status_code == 200

def test_state(client):
    login(client)
    response = client.get('/State', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_status(client):
    login(client)
    response = client.get('/Status', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_table_permissions(client):
    login(client)
    response = client.get('/TablePermissions', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_user(client):
    login(client)
    response = client.get('/User', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_user_role(client):
    login(client)
    response = client.get('/UserRole', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_vendor(client):
    login(client)
    response = client.get('/Vendor', follow_redirects=True)
    logout(client)
    assert response.status_code == 200

def test_vm_cloud_director(client):
    login(client)
    response = client.get('/VMCloudDirector', follow_redirects=True)
    logout(client)
    assert response.status_code == 200