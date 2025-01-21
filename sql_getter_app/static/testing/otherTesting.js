
/* A place to test other functions in the javascript
 * My criteria for functions that need tests written for them are:
 * 1. Functions involved or close to the server requests
 * 2. Complicated functions used by other functions
 * 3. Places where error is likely to occur
 * 
 * For example we wrote a test for initialize.js/generateColumnsObject() because
 *  it is used by a ton of other functions and takes data directly from the server
 * But we did not write a test for the filter.js/FilterOption class because it
 *  is very self contained and we have tested its only input already
 */

function otherTesting() {

    titleLog('post()')
    console.log('This one is super important as it handles all the requests made to the server');

    // sub out the 'Alert' function
    let instance = sinon.createSandbox();
    let alerted = null;
    instance.replace(window, 'alert', function(a=null) { alerted = true; });

    // fake server answer
    let requests = [];
    xhr = instance.useFakeXMLHttpRequest();
    xhr.onCreate = function (reqObj) {
        requests.push(reqObj);
    };

    // create a finish function
    dataPassed = null;
    checkFinishFunction = function(data=null) { dataPassed = [data, this]; }

    console.log(' - 200 code response without finish function');
    alerted = false;
    post(['some Data', '27'], 'GET', '/help');
    testObject(1, requests.length);

    requests[0].respond(200, { "Content-Type": "application/json" }, 'Success!');
    testObject(false, alerted);


    console.log(' - 200 code response with finish function');
    alerted = false;
    requests = []; // reset the requests list 
    post(['some Data', '27'], 'GET', '/help', checkFinishFunction, 'passing Data');
    testObject(1, requests.length);

    requests[0].respond(200, { "Content-Type": "application/json" }, 'Sucess!');
    testObject('passing Data', dataPassed[0]);
    testObject('Sucess!', dataPassed[1].responseText);
    testObject(false, alerted);

    console.log(' - 500 code (Server error)');
    alerted = false;
    requests = []; // reset the requests list 
    post(['some Data', '27'], 'GET', '/help', checkFinishFunction, 'passingData');
    testObject(1, requests.length);
    requests[0].respond(500, { "Content-Type": "application/json" }, 'Sucess!');
    testObject(true, alerted);

    console.log(' - 472 code (Sql error)');
    alerted = false;
    requests = []; // reset the requests list 
    post(['some Data', '27'], 'GET', '/help', checkFinishFunction, 'passingData');
    testObject(1, requests.length);
    requests[0].respond(500, { "Content-Type": "application/json" }, 'Sucess!');
    testObject(true, alerted);

    console.log(' - random unknown code (something unexpected)');
    alerted = false;
    requests = []; // reset the requests list 
    post(['some Data', '27'], 'GET', '/help', checkFinishFunction, 'passingData');
    testObject(1, requests.length);
    requests[0].respond(999, { "Content-Type": "application/json" }, 'Sucess!');
    testObject(true, alerted);

    instance.restore();
}