function rowEngineTesting() {

    try {
        titleLog('constructor()');
        console.log(rowEngineTestConstruction());
    }
    catch(a) {testCatch(a)};

    try {
        titleLog('generateInputFields()');
        let x = rowEngineTestConstruction();
        let div = document.createElement('div');
        x.generateInputFields(div);
        console.log(x);
    }
    catch(a) {testCatch(a)};
    
    try {
        titleLog('loadRow()');
        let x = rowEngineTestConstruction();
        let rowRef = returnNodeFromText('<tr data-id="1"><td>icecream</td><td>3</td><td>True</td><td>850</td><td>2021-12-30 00:38:54.840</td><td class="noPrint"></td></tr>');
        
        console.log(' - row before');
        console.log(rowRef);

        x.loadRow(rowRef);

        console.log(' - engine');
        console.log(x);

        console.log(' - row after');
        console.log(rowRef)
    }
    catch(a) {testCatch(a)};
    
    try {
        titleLog('editRow()');
        let x = rowEngineRowInTable();
        // Isolate function
        replaceEverythingInArray(x.fields, 'getVal', function(x=null,y=null) { return {'test':'ing'}; });
        let edit_timesRan = 0;
        replaceEverythingInArray(x.fields, 'edit', function(x=null,y=null) { edit_timesRan += 1; });

        x.editRow();

        console.log('- Blue Border');
        testObject({0:"editable"}, x.rowRef.classList);
        console.log('- Save backup');
        testObject({'test':'ing'}, x.backupObj);
        console.log('- ran this.edit the correct number of times')
        testObject(5, edit_timesRan);
    }
    catch(a) {testCatch(a)};
    
    try {
        titleLog('editRow() - with an object passed');
        let x = rowEngineRowInTable();
        // Isolate function
        replaceEverythingInArray(x.fields, 'getVal', function(x=null,y=null) { return {'test':'ing'}; });
        let edit_currentValues = new Array()
        replaceEverythingInArray(x.fields, 'edit', function(x=null,y=null) { edit_currentValues.push(y); });
        
        x.editRow(null, {"Food":12, "foodTypeId":13, "Edible":14, "Calories":15, "ExpirationDate":16});

        console.log('- passed the correct values into the cells')
        testObject([12,13,14,15,16], edit_currentValues);
    }
    catch(a) {testCatch(a)};
    
    try {
        titleLog('getValues()');
        let x = rowEngineRowInTable();
        // isolate function
        replaceEverythingInArray(x.fields, 'getVal', function(y=null,z=null) { let data = new Object(); data[y.colName] = 'testing'; return data; });

        let out = x.getValues();

        console.log('- generated correct object');
        testObject({Food: "testing", foodTypeId: "testing", Edible: "testing", Calories: "testing", ExpirationDate: "testing"}, out);
    }
    catch(a) {testCatch(a)};
    
    try {
        titleLog('saveRow() - without passing an object');
        let x = rowEngineRowInTable();
        // Isolate function
        // fake the rowEngine.getVal member
        replaceEverythingInArray(x.fields, 'getVal', function(y=null,z=null) { let data = new Object(); data[y.colName] = 'testing'; return data; });

        // fake the post() function
        let instance = sinon.createSandbox();
        let post_returnData = null;
        instance.replace(window, 'post', function(a=null,b=null,c=null,d=null) { post_returnData = [a,b,c,d]; });
        x.saveRow();
        instance.restore();
        
        console.log('- posted correct data');
        testObject([{"info":{"id":"1","table":"food"},"data":{"Food":"testing","foodTypeId":"testing","Edible":"testing","Calories":"testing","ExpirationDate":"testing"}},"POST","/update",null], post_returnData);
    }
    catch(a) {testCatch(a)};
    
    try {
        titleLog('saveRow() - object passed');
        let x = rowEngineRowInTable();
        // Isolate function
        // fake the rowEngine.getVal member
        replaceEverythingInArray(x.fields, 'getVal', function(y=null,z=null) { let data = new Object(); data[y.colName] = 'testing'; return data; });

        // object to pass 
        let testObj = {"Food":"blah","foodTypeId":"bleh","Edible":"blih","Calories":"bloh","ExpirationDate":"bluh"};
        // fake the post() function
        let instance = sinon.createSandbox();
        let post_returnData = null;
        instance.replace(window, 'post', function(a=null,b=null,c=null,d=null) { post_returnData = [a,b,c,d]; });
        x.saveRow(null, testObj, 'thisShouldBePassedToPost()');
        instance.restore();
        
        console.log('- posted correct data');
        testObject([{"info":{"id":"1","table":"food"},"data":{"Food":"blah","foodTypeId":"bleh","Edible":"blih","Calories":"bloh","ExpirationDate":"bluh"}},"POST","/update",'thisShouldBePassedToPost()'], post_returnData);
    }
    catch(a) {testCatch(a)};
    
    try {
        titleLog('onSaveReturn() - without object');
        let x = rowEngineRowInTable();
        // Isolate function
        // fake the rowEngine.getVal member
        let restoreCell_called = 0;
        replaceEverythingInArray(x.fields, 'restoreCell', function(y=null,z=null) { if (!z) restoreCell_called += 1; });

        x.onSaveReturn();

        console.log("- button disabled");
        testObject(true, x.saveBtn.disabled);
        testObject(false, x.undoBtn.disabled);
        testObject(false, x.editBtn.disabled);

        console.log("- this.editing = false");
        testObject(false, x.editing);

        console.log("- this.restoreCell() called the appropriate number of times");
        testObject(5, restoreCell_called);

    }
    catch(a) {testCatch(a)};
    
    try {
        titleLog('onSaveReturn() - with Object');
        let x = rowEngineRowInTable();
        // Isolate function
        // fake the rowEngine.getVal member
        let restoreCell_called = 0;
        replaceEverythingInArray(x.fields, 'restoreCell', function(y=null,z=null) { if (!z) restoreCell_called += 1;});

        x.onSaveReturn();

        console.log("- button disabled");
        testObject(true, x.saveBtn.disabled);
        testObject(false, x.undoBtn.disabled);
        testObject(false, x.editBtn.disabled);

        console.log("- this.editing = false");
        testObject(false, x.editing);

        console.log("- this.restoreCell() called the appropriate number of times");
        testObject(5, restoreCell_called);

    }
    catch(a) {testCatch(a)};

    try {
        titleLog('undoRow() - editing');
        let x = rowEngineRowInTable();

        x.editing = true;
        x.backupObj = 'tester';

        // fake saveRow, onSaveReturn, and confirm()
        let saveReturn_dataPassed = null;
        x.saveRow = function (a=null, b=null) { saveReturn_dataPassed = b; }

        let onSaveReturn_dataPassed = null;
        x.onSaveReturn = function (a=null) { onSaveReturn_dataPassed = a; }

        let instance = sinon.createSandbox();
        let confirm_called = false;
        instance.replace(window, 'confirm', function(a=null) { confirm_called = true; return true; });
        x.undoRow();
        instance.restore();

        console.log("- passed this.onSaveReturn the correct data");
        testObject('tester', onSaveReturn_dataPassed);

        console.log("- didn't alert anything")
        testObject(false, confirm_called);
    }
    catch(a) {testCatch(a)};

    try {
        titleLog('undoRow() - not editing, user clicks \'cancel\'');
        let x = rowEngineRowInTable();

        x.editing = false;
        x.backupObj = 'tester';

        // fake saveRow, onSaveReturn, and confirm()
        let saveRow_called = false;
        x.saveRow = function (a=null, b=null) { saveRow_called = true; }

        let onSaveReturn_called = false;
        x.onSaveReturn = function (a=null) { onSaveReturn_called = true; }

        let instance = sinon.createSandbox();
        let confirm_called = false;
        instance.replace(window, 'confirm', function(a=null) { confirm_called = true; return false; });
        x.undoRow();
        instance.restore();

        console.log("- didn't call this.onSaveReturn()");
        testObject(false, onSaveReturn_called);

        console.log("- didn't call this.saveRow()");
        testObject(false, saveRow_called);

        console.log("- pushed the alsert")
        testObject(true, confirm_called);
    }
    catch(a) {testCatch(a)};

    try {
        titleLog('undoRow() - not editing, user clicks \'ok\'');
        let x = rowEngineRowInTable();

        x.editing = false;
        x.backupObj = 'tester';

        // fake saveRow, onSaveReturn, and confirm()
        let saveRow_data = false;
        x.saveRow = function (a=null, b=null) { saveRow_data = b; }

        let onSaveReturn_called = false;
        x.onSaveReturn = function (a=null) { onSaveReturn_called = true; }

        let instance = sinon.createSandbox();
        let confirm_called = false;
        instance.replace(window, 'confirm', function(a=null) { confirm_called = true; return true; });
        x.undoRow();
        instance.restore();

        console.log("- didn't call this.onSaveReturn()");
        testObject(false, onSaveReturn_called);

        console.log("- passed data to this.saveRow()");
        testObject('tester', saveRow_data);

        console.log("- pushed the alsert")
        testObject(true, confirm_called);
    }
    catch(a) {testCatch(a)};

    try {
        titleLog('this.deleteRow() - user clicks "no"');
        let x = rowEngineRowInTable();

        // fake the post() function
        let instance = sinon.createSandbox();

        let post_called = false;
        instance.replace(window, 'post', function(a=null,b=null,c=null,d=null) { post_called = true; });

        let confirm_called = false;
        instance.replace(window, 'confirm', function(a=null) { confirm_called = true; return false; });

        x.deleteRow();

        instance.restore();

        console.log('- confirm called');
        testObject(true, confirm_called);  
        
        console.log('- post not called');
        testObject(false, post_called); 
    }
    catch(a) {testCatch(a)}

    try {
        titleLog('this.deleteRow() - user clicks "yes"');
        let x = rowEngineRowInTable();

        // fake the post() and confirm() function
        let instance = sinon.createSandbox();

        let post_data = null;
        instance.replace(window, 'post', function(a=null,b=null,c=null,d=null) { post_data = [a,b,c]; });

        let confirm_called = false;
        instance.replace(window, 'confirm', function(a=null) { confirm_called = true; return true; });

        x.deleteRow();

        instance.restore();

        console.log('- confirm called');
        testObject(true, confirm_called);  
        
        console.log('- post not called');
        testObject([{table: "food", id: "1"}, "DELETE", "/delete"], post_data); 
    } catch(a) {testCatch(a)}

    try {
        titleLog("finishDelete()")
        let x = rowEngineRowInTable();

        // fake the removeStorageItem function
        let instance = sinon.createSandbox();

        let removeStorageItem_data = null;
        instance.replace(window, 'removeStorageItem', function(a=null) { removeStorageItem_data = a; });

        x.finishDelete();

        instance.restore();

        console.log("- passed removeStorageItem() the correct data");
        testObject('1RowProgress', removeStorageItem_data);

        console.log("- removed row html");
        testObject('', x.rowRef.innerHTML);

    } catch(a) {testCatch(a)}
    
}


// a function that creates a fake rowEngine to use for testing
function rowEngineTestConstruction() {
    columns = JSON.parse('[{"name":"Food","readableName":"Food","htmlRef":{},"type":"varchar","nullable":false,"maxChar":20},{"name":"foodTypeId","readableName":"Type","htmlRef":{},"type":"linked","nullable":false,"maxChar":null,"linkTable":"food","linkObject":{"0":"Breakfast","1":"Lunch","2":"Dinner","3":"Snack","4":"person","info":{"table":"food","replacement":"Type"}}},{"name":"Edible","readableName":"Edible","htmlRef":{},"type":"bit","nullable":false,"maxChar":null},{"name":"Calories","readableName":"Calories","htmlRef":{},"type":"int","nullable":false,"maxChar":null},{"name":"ExpirationDate","readableName":"ExpirationDate","htmlRef":{},"type":"datetime","nullable":false,"maxChar":null}]');
    table = 'food';
    permissions = JSON.parse('{"canView":true,"canEdit":true,"canAdd":true,"canDelete":true,"canAudit":true}');
    hasLinkedChildren = true;

    return new rowEngine(columns, table, permissions, hasLinkedChildren);
}

// function that creates a fake rowEngine already loaded in a table
function rowEngineRowInTable() {
    let x = rowEngineTestConstruction();
    let rowRef = returnNodeFromText('<tr data-id="1"><td>icecream</td><td>3</td><td>True</td><td>850</td><td>2021-12-30 00:38:54.840</td><td class="noPrint"></td></tr>');
    x.loadRow(rowRef);
    return x;
}

// loop through an array and replace/assign something for each entry
function replaceEverythingInArray(array, key, value) {
    for (x of array) x[key] = value;
    return true;
}

// takes HTML text and returns a HTML Element object with that data.
function returnNodeFromText(text) {
    let div = document.createElement('tbody');
    div.innerHTML = text;
    return div.childNodes[0];
}