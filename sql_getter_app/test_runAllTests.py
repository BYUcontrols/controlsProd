# imports
import pytest

# import modules
from . import test_app
from . import test_auth
from . import test_createTableHtml
from . import test_crud
from . import test_crudHelpers
from . import test_sqlCommandClass
from . import test_userClass
from . import test_views
from . import conftest
from . import test_sr

# important context for certain test cases
from sql_getter_app.test_app import client
from sql_getter_app.conftest import test_app_context

# a function to set up the test environment and run all the python tests
def runAllTests():
    ######################## conftest ########################
    conftest.testLoginUser()

    ######################## test_app ########################
    test_app.test_assert()
    test_app.test_login_logout()

    ######################## test_auth ########################
    test_auth.test_load_user()
    test_auth.test_redirect_from_auth(test_app_context)
    test_auth.test_logout(test_app_context)

    ######################## test_createTableHtml ########################
    # there's lots of setup methods in this module that I haven't implemented yet
    test_createTableHtml.test__init__()
    test_createTableHtml.test_newHeader()
    test_createTableHtml.test_content()
    test_createTableHtml.test_linkedElements()
    test_createTableHtml.test_getLinkedColumn()

    ######################## test_crud ########################
    test_db = test_app.test_db
    test_crud.test_read_user()
    test_crud.test_create_user()
    test_crud.test_delete_user(test_db)
    test_crud.test_update_user(test_db)

    ######################## test_crudHelpers ########################
    test_crudHelpers.test_swapPositions()
    test_crudHelpers.test_verifyColumn()
    test_crudHelpers.test_getKeys(test_app_context)
    test_crudHelpers.test_getOrderedKeys(test_app_context)
    test_crudHelpers.test_getColumnTypes(test_app_context)
    test_crudHelpers.test_getIdColumn(test_app_context)
    test_crudHelpers.test_verifyTableName(test_app_context)

    ######################## test_sqlCommandClass ########################
    test_sqlCommandClass.test_initSqlCom()
    test_sqlCommandClass.test_values()
    test_sqlCommandClass.test_where()

    ######################## test_userClass ########################
    test_userClass.test_userSession_getData(test_app_context)
    test_userClass.test_userSession_accessTableAccessLevel(test_app_context)
    test_userClass.test_userSession_canView()
    test_userClass.test_userSession_canEdit()
    test_userClass.test_userSession_canAdd()
    test_userClass.test_userSession_canDelete()
    test_userClass.test_userSession_setFromString()
    test_userClass.test_userSession_processOauthResponse()
    test_userClass.test_userSession_setFromTolken()
    test_userClass.test_getPermissionsObject()

    ######################## test_views ########################
    test_views.test_home_page(client)
    test_views.test_bbmd(client)
    test_views.test_building(client)
    test_views.test_country(client)
    test_views.test_device(client)
    test_views.test_device_license(client)
    test_views.test_device_subtype(client)
    test_views.test_device_type(client)
    test_views.test_dns(client)
    test_views.test_failure(client)
    test_views.test_failure_type(client)
    test_views.test_inventory(client)
    test_views.test_ip(client)
    test_views.test_item(client)
    test_views.test_manufacturer(client)
    test_views.test_ncrs_node(client)
    test_views.test_oit_jack(client)
    test_views.test_patch_panel(client)
    test_views.test_patch_panel_type(client)
    test_views.test_phone_number(client)
    test_views.test_phone_number_type(client)
    test_views.test_priority(client)
    test_views.test_request_item(client)
    test_views.test_request_note(client)
    test_views.test_role(client)
    test_views.test_service_request(client)
    test_views.test_service_type(client)
    test_views.test_state(client)
    test_views.test_status(client)
    test_views.test_table_permissions(client)
    test_views.test_user(client)
    test_views.test_user_role(client)
    test_views.test_vendor(client)
    test_views.test_vm_cloud_director(client)

    ######################## test_sr ########################
    test_sr.logged_in_session()
    test_sr.test_new_service_request_valid()
    test_sr.test_new_service_request_invalid()
