/*
    Mason Hunter
    Functions to more easily build dynamic tables using javascript
*/

function createTableHeader(value) {
    let th = document.createElement('th');
    th.innerText = value;
    return th;
}

function createTableCell(value=null) {
    let td = document.createElement('td');
    td.innerText = value;
    return td;
}

function createNestedTable(key, value){
    let tab = document.createElement('table');
    tab.className = 'noBorders nestedTable';
    let tabBod = document.createElement('tbody');
    tabBod.className = 'noBorders';
    tab.appendChild(tabBod);
    let tBodRow = document.createElement('tr');
    tBodRow.className = 'noBorders';
    tabBod.appendChild(tBodRow);

    let keyContents = createTableCell(key + ':');
    keyContents.classList = 'noBorders keyContents';
    tBodRow.appendChild(keyContents);
    let valueContents = createTableCell(value);
    valueContents.classList = 'noBorders valueContents';
    tBodRow.appendChild(valueContents);

    return tab;
}

