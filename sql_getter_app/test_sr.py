import requests
import pytest
import json

# local imports
from sql_getter_app.collection import db
from sql_getter_app import app
from datetime import datetime

# Set up base URL for your development server
BASE_URL = "http://127.0.0.1:5000"  # Update this if necessary

# DATA --------------------------------------------------------------------------------
# this data is sent to the /NewServiceRequest route to create a new request
# this also tests adding a notes and parts to a new service request
good_new_sr_form_data = {
    'date': '2024-11-21T09:23:07',
    'requestor': 'Ben Haggard',
    'priority': 'Low',
    'description': 'test_new_service_request',
    'location': 'BRWB',
    'assignedTo': 'Ben Haggard',
    'building': 'CB',
    'estimate': datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3], # timestamp formatting
    'status': 'Good',
    'completed': '',
    'cc': '',
    'contactedDate': '',
    'externalId': '',
    'newSRNotes': [{'note': 'good_new_sr_form_data note', 'public': 0, 'modDate': '2024-11-21T09:23:50', 'noteinputBy': 'Ben Haggard'},
              {'note': 'good_new_sr_form_data note2', 'public': 0, 'modDate': '2024-11-21T09:23:50', 'noteinputBy': 'Ben Haggard'}],
    'newSRParts': [{'parts': 'ACT 2301', 'partquantity': '1', 'inputBy': 'Ben Haggard'}, {'parts': 'ACT 2301', 'partquantity': '2', 'inputBy': 'Ben Haggard'}]
}

# this data is sent to the /NewServiceRequest route and should fail because it leaves out required fields (status)
bad_new_sr_form_data1 = {
    'date': 'a',
    'requestor': 'Ben Haggard',
    'priority': 'Low',
    'description': 'test_new_service_request',
    'location': 'BRWB',
    'assignedTo': 'Ben Haggard',
    'building': 'CB',
    'estimate': datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3], # timestamp formatting
    'status': '',
    'completed': '',
    'cc': '',
    'contactedDate': '',
    'externalId': '',
    'newSRNotes': [],
    'newSRParts': []
}

# HELPER FUNCTIONS --------------------------------------------------------------------------------

# Fixture to log in and create a session that persists across tests
# scope="module" argument makes this fixture run once for all tests
@pytest.fixture(scope="module")
def logged_in_session():
    session = requests.Session()
    # Send login request and check if successful
    login_response = session.get(f"{BASE_URL}/testLogin")
    assert login_response.status_code == 200, "Login failed"
    return session


def get_last_service_request_id():
    # neccessary to use app.app_context() to query the database
    with app.app_context():
        # Fetch the latest service request ID from the database
        service_request_id = db.engine.execute(
            "SELECT MAX(serviceRequestId) FROM ServiceRequest;"
        ).fetchone()
    assert service_request_id is not None, "No service request found"
    return service_request_id[0]

# TESTS ---------------------------------------------------------------------------------------------

# CREATE: each argument in the list will be passed into the function as form_data
@pytest.mark.parametrize("form_data", [good_new_sr_form_data])
def test_new_service_request_valid(logged_in_session, form_data):
    # use json.dumps to allow nested data (notes and parts)
    response = logged_in_session.post(f"{BASE_URL}/NewServiceRequest",
        data=json.dumps(form_data), headers={"Content-Type": "application/json"})
    assert response.status_code == 200, "New Service Request failed"

# CREATE FAIL: each argument in the list will be passed into the function as form_data
@pytest.mark.parametrize("form_data", [bad_new_sr_form_data1])
def test_new_service_request_invalid(logged_in_session, form_data):
    response = logged_in_session.post(f"{BASE_URL}/NewServiceRequest", data=form_data)
    print(form_data)
    assert response.status_code == 500, "Expected 500 Bad Request for invalid data"



# DELETE: sets the most recent service request to inactive (could be one that is already inactive)
def test_delete_service_request(logged_in_session, service_request_id = None):
    if service_request_id is None: # this if statement allows the function to be run on its own
        service_request_id = get_last_service_request_id()
    print(service_request_id)
    response = logged_in_session.post(f"{BASE_URL}/NewServiceRequest", data={"idinput": service_request_id})
    assert response.status_code == 200, "Failed to delete the service request"

# EDIT
def test_edit_service_request(logged_in_session, form_data = None):
    # this if statement allows the function to be run on its own
    # seperate from the test_post_edit_delete_service_request test
    if form_data == None:
        srID= get_last_service_request_id()
        # using currId is how the backend knows to edit an existing service request
        form_data = {"currId": srID, **good_new_sr_form_data}
    response = logged_in_session.post(f"{BASE_URL}/NewServiceRequest", data=form_data)
    assert response.status_code == 200, "Edit Service Request failed"


# test to create edit and delete a service request (this calls 3 seperate tests)
@pytest.mark.parametrize("form_data", [good_new_sr_form_data])
def test_post_edit_delete_service_request (logged_in_session, form_data):
    # NEW
    test_new_service_request_valid(logged_in_session, form_data)
    # get last sr id
    service_request_id = get_last_service_request_id()
    # EDIT
    form_data = {"currId": service_request_id, **form_data} # make currID the first key
    test_edit_service_request(logged_in_session, form_data)
    # DELETE (set to inactive)
    test_delete_service_request(logged_in_session, service_request_id)


# ADD NOTES
def test_add_note_existing_service_reqeust(logged_in_session):

    service_request_id = get_last_service_request_id()
    note_data = {
        'note': 'test_add_note_existing_service_reqeust',
        'public': 'on',
        'modDate': datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3], # timestamp formatting
        'noteinputBy': 'test',
        'servReqId': service_request_id
    }
    response = logged_in_session.post(f"{BASE_URL}/NewServiceRequest", data=note_data)
    assert response.status_code == 200, "Failed to add note to service request"


    # ADD Part
def test_add_part_existing_service_request(logged_in_session):
    service_request_id = get_last_service_request_id()
    part_data = {
        'parts': 'ACT 2301',
        'partquantity': '1',
        'inputBy': 'test',
        'servReqId': service_request_id
    }
    response = logged_in_session.post(f"{BASE_URL}/NewServiceRequest", data=part_data)
    assert response.status_code == 200, "Failed to add part to service request"



