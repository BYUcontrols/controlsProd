
function testHTMLReq() {
    evaluate_globalVariables();
    evaluate_tableHTML();
}

function evaluate_globalVariables() {
    console.log('This is a test of the table template and the createTableHTML class, NOT a test of flask\'s ability to correctly generate these variables');
    console.log('Testing the HTML is SUPER important because it is the javascript\'s only input, failed assertions here are very important');
    console.log('Other testing is important but due to the nature of javascript is is hard to create tests that don\'t immediatly break when you restructure or change code');
    console.log('Long story short if you didn\'t change javascript code but something broke, this group of tests is the first place to look');
    titleLog('Script variables passed')
    console.log(' - tableName');
    testObject("food", tableName);
    console.log(' - links');
    testObject({"foodTypeId": {"0": "Breakfast", "1": "Lunch", "2": "Dinner", "3": "Snack", "4": "person", "info": {"replacement": "Type", "table": "food"}}}, links);
    console.log(' - uneditableColumns');
    testObject(['Calories'], uneditableColumns);
    console.log(' - permissionsObject');
    testObject({"canAdd": true, "canAudit": true, "canDelete": true, "canEdit": true, "canView": true}, permissionsObject);
    console.log(' - columnTypes');
    testObject(
        {
            "Calories":{"CHARACTER_MAXIMUM_LENGTH":null,"COLUMN_NAME":"Calories","DATA_TYPE":"int","IS_NULLABLE":"NO"},
            "Edible":{"CHARACTER_MAXIMUM_LENGTH":null,"COLUMN_NAME":"Edible","DATA_TYPE":"bit","IS_NULLABLE":"NO"},
            "ExpirationDate":{"CHARACTER_MAXIMUM_LENGTH":null,"COLUMN_NAME":"ExpirationDate","DATA_TYPE":"datetime","IS_NULLABLE":"NO"},
            "Food":{"CHARACTER_MAXIMUM_LENGTH":20,"COLUMN_NAME":"Food","DATA_TYPE":"varchar","IS_NULLABLE":"NO"},
            "foodId":{"CHARACTER_MAXIMUM_LENGTH":null,"COLUMN_NAME":"foodId","DATA_TYPE":"int","IS_NULLABLE":"NO"},
            "foodTypeId":{"CHARACTER_MAXIMUM_LENGTH":null,"COLUMN_NAME":"foodTypeId","DATA_TYPE":"int","IS_NULLABLE":"NO"}
        },
    columnTypes);
    console.log(' - tableColumnArray');
    testObject(["Food", "foodTypeId", "Edible", "Calories", "ExpirationDate"], tableColumnArray);
    console.log(' - linkedChildrenExist');
    testObject(true, linkedChildrenExist);
}

function evaluate_tableHTML() {
    titleLog('Table HTML');
    console.log('This tests the python createTableHtml class');

    console.log(' - table head');
    testNode(document.getElementById('tableHead'));
}
