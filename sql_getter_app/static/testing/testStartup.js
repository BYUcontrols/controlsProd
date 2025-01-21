
function initializeFileTesting() {

    titleLog('generateColumnsObject()');
    headerRef = createElementFromHTML(`<tr id="tableHead">
    <th style="display: table-cell;">Here we go</th>
    <th style="display: table-cell;">down circle road</th>
    <th style="display: table-cell;">strong and hopeful hearted</th>
    <th style="display: table-cell;">through the dust and wind up just</th>
    <th style="display: table-cell;">exactly where you started</th></tr>`)
    columnsArray = ['Here we go', 'down circle road', 'strong and hopeful hearted', 'through the dust and wind up just', 'exactly where you started'];
    columnTypesObject = {'Here we go':{"COLUMN_NAME": "Here we go", "DATA_TYPE": "varchar", "CHARACTER_MAXIMUM_LENGTH": 20, "IS_NULLABLE": "YES"},
        'down circle road':{"COLUMN_NAME": "down circle road", "DATA_TYPE": "int", "CHARACTER_MAXIMUM_LENGTH": null, "IS_NULLABLE": "NO"},
        'strong and hopeful hearted':{"COLUMN_NAME": "strong and hopeful hearted", "DATA_TYPE": "varchar", "CHARACTER_MAXIMUM_LENGTH": 20, "IS_NULLABLE": "YES"},
        'through the dust and wind up just':{"COLUMN_NAME": "through the dust and wind up just", "DATA_TYPE": "varchar", "CHARACTER_MAXIMUM_LENGTH": 20, "IS_NULLABLE": "NO"},
        'exactly where you started':{"COLUMN_NAME": "exactly where you started", "DATA_TYPE": "varchar", "CHARACTER_MAXIMUM_LENGTH": 20, "IS_NULLABLE": "NO"}}
    linkedColumns = {'down circle road':{"1":"a", "2":"b", "info": {"table": "poetry", "replacement": "ART"}}}
    tablename = 'Poetry: Shel Silverstein';
    result = generateColumnsObject(headerRef.firstChild, columnsArray, columnTypesObject, linkedColumns, tablename);
    testObject(JSON.parse(`[{"name":"Here we go","readableName":"Here we go","htmlRef":{},"type":"varchar","nullable":true,"maxChar":20},
        {"name":"down circle road","readableName":"ART","htmlRef":{},"type":"linked","nullable":false,"maxChar":null,"linkTable":"poetry","linkObject":{"1":"a","2":"b","info":{"table":"poetry","replacement":"ART"}}},
        {"name":"strong and hopeful hearted","readableName":"strong and hopeful hearted","htmlRef":{},"type":"varchar","nullable":true,"maxChar":20},
        {"name":"through the dust and wind up just","readableName":"through the dust and wind up just","htmlRef":{},"type":"varchar","nullable":false,"maxChar":20},
        {"name":"exactly where you started","readableName":"exactly where you started","htmlRef":{},"type":"varchar","nullable":false,"maxChar":20}]`), result);

    titleLog('updateSaveCookies()');
    console.log(' - nothing being edited');
    rowCollection = {1:rowEngineRowInTable(), 2:rowEngineRowInTable()};
    inputEngine = rowEngineRowInTable();
    inputEngine.editRow();

    let instance = sinon.createSandbox();
    let setStorageItem_data = {};
    instance.replace(window, 'setStorageItem', function(a=null, b=null) { setStorageItem_data[a] = b; });

    updateSaveCookies()
    instance.restore()
    testObject({'newProgress':'{"Food":"icecream","foodTypeId":"3","Edible":"True","Calories":"850","ExpirationDate":"2021-12-30T00:38:54.000"}', scroll:0}, setStorageItem_data);



    console.log(' - editing one row');
    rowCollection = {1:rowEngineRowInTable(), 2:rowEngineRowInTable()};
    rowCollection[2].editRow(); // set one of the rows as being edited
    inputEngine = rowEngineRowInTable();
    inputEngine.editRow();

    instance = sinon.createSandbox();
    setStorageItem_data = {};
    instance.replace(window, 'setStorageItem', function(a=null, b=null) { setStorageItem_data[a] = b; });

    updateSaveCookies()
    instance.restore()
    testObject({'1RowProgress':'{"Food":"icecream","foodTypeId":"3","Edible":"True","Calories":"850","ExpirationDate":"2021-12-30T00:38:54.000"}', 'newProgress':'{"Food":"icecream","foodTypeId":"3","Edible":"True","Calories":"850","ExpirationDate":"2021-12-30T00:38:54.000"}', scroll:0}, setStorageItem_data);
}