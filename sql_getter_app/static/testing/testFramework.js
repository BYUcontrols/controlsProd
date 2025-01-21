/*  
    Functions run on /test to run tests

           Written by: 
      Isaac Cutler 12/1/2020
    Property of the BYU A/C Shop
*/

function testStartup() {
    titleLog("Welcome to the Controls App site JS testing framework");
    console.log('\nThe following tests are designed to exaluate all the functions that make the client side part of this site function. If there are errors they will appear in red and you can trace them by looking on the right at where the titles are called');
    bigTitleLog("HTML from Python");
    testHTMLReq();
    
    bigTitleLog('General Init');
    console.log('this is a test to make sure no errors are thrown during startup');
    titleLog('starting page');
    try {
        init();
        console.log('Success!');
    }
    catch(error) {console.assert(false, error);}

    bigTitleLog("rowEngine Class testing");
    rowEngineTesting();

    bigTitleLog("initialize.js functions");
    initializeFileTesting();

    bigTitleLog("Other functions")
    otherTesting();
}

function testObject(example, output, message = output) {
    console.log(example);
    console.assert((JSON.stringify(example) == JSON.stringify(output)), message);
}

function testNode(example) {
    console.log(example);
    console.assert((example), example);
}

function testCatch(error) {
    console.assert(false, error);
}


// function that takes a string and returns that string as an dom element
function createElementFromHTML(htmlString) {
    let div = document.createElement('table');
    div.innerHTML = htmlString;
  
    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild; 
}

function titleLog(text) {
    console.log('******************* ' + text + ' **********************');
}

function bigTitleLog(text) {
    console.log('⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤>- '+text+' -<⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤⬤');
}