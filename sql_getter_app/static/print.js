/*  
    Functions that deal with printing the table

           Written by: 
      Isaac Cutler 12/1/2020
           Updated by:
      Mason Hunter 4/18/2022
    Property of the BYU A/C Shop
*/

// takes the table and puts it into an object along with some parameters
// to pass to the /print url
function makeDocument(element = document.getElementById('table'), requests=null) {
    // create a clone of the table to work with
    let tableRaw = element.cloneNode(true);
    // if we are printing the SR list page then we need to add some data
    if(document.getElementById('srtable')){
        // new headers
        let header = tableRaw.querySelector('#tableHead');
        let reqPhoneHead = document.createElement('th')
        reqPhoneHead.innerText = 'Requestor\'s Phone';
        header.appendChild(reqPhoneHead);
        let locHead = document.createElement('th')
        locHead.innerText = 'Location';
        header.appendChild(locHead);
        let noteHead = document.createElement('th')
        noteHead.innerText = 'Note';
        header.appendChild(noteHead);

        for (id in requests){
            let tBodRow = tableRaw.querySelector('[data-id=\''+requests[id]['servReqId']+'\']');
            let reqPhone = "";
            if (requests[id]['requestorPhone']){
                reqPhone = createTableCell(requests[id]['requestorPhone']);
            }
            else {
                reqPhone = createTableCell("None");
            }
            tBodRow.appendChild(reqPhone);

            let location = "";
            if (requests[id]['location']){
                location = createTableCell(requests[id]['location']);
            }
            else {
                location = createTableCell("None");
            }
            tBodRow.appendChild(location);

            if (requests[id]['notes']){
                for (note in requests[id]['notes']){
                    if (!requests[id]['notes'][note]['private'] || userIsTech){
                    let currnote = createTableCell(requests[id]['notes'][note]['note']);
                    tBodRow.appendChild(currnote);
                    break;
                    }
                }
            }
            else {
                let currnote = createTableCell("None");
                tBodRow.appendChild(currnote);
            }
        }
    }
    // get the tbody (where all the rows are)
    let tableBody = tableRaw.querySelector('#tableBody');
    // un-hide all the rows
    for (row of tableBody.rows) row.style.display = 'table-row';
    // place the raw table in nice containers 
    let tableResponse = putInContainer(tableRaw, 'div');
    // so the server can have a place to style the table from
    tableResponse.classList = 'printDiv';
    tableData = putInContainer(tableResponse, 'div');  
    // create an object where we can store data to send to the server neatly  
    let data = new Object;
    data['html'] = tableData.innerHTML;
    data['params'] = filterReadableText();
    // if we are on the SR list page
    if(document.getElementById('srtable')){
        data['sort'] = 'ID';
    }
    else {
        data['sort'] = columnsInfo[sortBy].readableName; //Global variables
    }
    data['tableName'] = window.tableName;

    return data;
}

// helper function that puts a node into another created node
// and returns the created node
function putInContainer(node, type) {
    tbl = document.createElement(type);
    tbl.appendChild(node);
    return tbl;
}

// posts the table data to /print and redirects the result to 
// a new window. The only way to do this is to create a temporary
// form and populate it with our data and then .submit it. Don't
// ask why; I have no idea. But it works so we don't ask questions
function redirectPost(data, endpoint = '/print') {
    let form = document.createElement('form');
    document.body.appendChild(form);
    form.method = 'post';
    form.action = endpoint;     // specify the place to send the data
    form.target = 'TheWindow';  // specify what the form should do when the data comes in
    
    let input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'html';
    input.value = JSON.stringify(data);
    form.appendChild(input);
    
    window.open('', 'TheWindow'); // open a new window called 'TheWindow' that the form can target
    form.submit();
    form.innerHTML = ''; // clean up
}

// function that makes sure that all the rows are ready to be printed (saved properly)
function prepareTableForPrint(rows = window.rowCollection) {
        // define a boolean that we can change when there is an edited row
    let failedTest = false;

    for (rowId in rows) {
        row = rows[rowId]
        if (!row.prepareForPrint()) failedTest = true;
    }

    if (!failedTest) return true
    else {
        if (window.confirm('There are rows with unsaved changes in this table. Would you like us to undo those changes before printing?')) {
            for (rowId in rows) rows[rowId].prepareForPrint(true); // run prepareForPrint on every row with the 'force' flag as true
            return true;
        }
        else return false;
    }
}

// creates the print button
function generatePrintButton(container = document.getElementById('tableFunctions')) {
        // create a print button that checks to see if the table is ready for printing and if so makes the document
        // and sends it off to the server for printing
    let button = generateByuButton('Print', function() { 
        if (prepareTableForPrint()){
            // if we are on the SR list page
            if(document.getElementById('srtable')){
                redirectPost(makeDocument(document.getElementById('srtable'), requests));
            }
            else{
                redirectPost(makeDocument());
            }
        } 
    });
    button.id = 'printButton';

    setTooltip(button, 'Prints all the rows in this table with whatever filters you have applied');
    div = putInContainer(button, 'div');
    div.classList = 'tableFunction';
    container.appendChild(div);
}