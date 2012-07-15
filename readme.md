requiremock
-----------
With this you can mock out ```require``` statements. It's good for testing, or intercepting requires.
I'm using it in ```nodecoverage``` to inject instrumented versions of code.

Installation
------------
```npm install requiremock```


Usage
-----
There are different ways you can use ```requiremock```, you can.
- mock things that match the exact string passed to require
- mock things that match the string passed to require with wildcard ```*```
- mock things that match the string passed to require with a ```RegExp```
- when you mock you can have the mock you pass be supplied by a function
Each of these uses is described in detail below.

NOTE: When matching, matching is done both on the string passed to ```require``` and the complete
path to the file that is required.

NOTE: Nested ```require``` statements are also mocked, so if you mock ```fs``` and use ```requiremock``` on  a file A
that requires a file B that requires a file C and the file C has the statement ```require("fs")``` that require is mocked.

Match the exact string passed to require
----------------------------------------
You can mock out the result of ```require("fs")``` in the file ```test.js``` like this
```
var fsMock = {
	readFileSync: function(){
		return "my test file contents";
	}
}

var requireMock = require("requiremock")(__filename);
requireMock.mock("fs", fsMock);
requireMock("./test.js");
```
This will mean that the following code in ```test.js``` will output ```my test file contents```
```
var fs = require("fs");
console.log(fs.readFileSync("config.txt", "utf-8));
```


Match the string passed to require with wildcard ```*```
--------------------------------------------------------
You can use wildcards when mocking out ```require("../../util/logger.js")``` with the wildcard ```*```
so your mock does not break if someone decides to move the logger.js file.
```
 var loggerMock = {
 	log: function(text){
 		return console.log("logging: " + text);
 	}
 }

 var requireMock = require("requiremock")(__filename);
 requireMock.mock("*logger.js", fsMock);
 requireMock("./test.js");
 ```

This will mean that the following code in ```test.js``` will output ```logging: test```
```
var logger = require("../../util/logger.js");
logger.log("test");
```


Match the string passed to require with a ```RegExp```
------------------------------------------------------
You can also use a ```RegExp``` when mocking out. This is the equivalent of the wildcard example above,
only using a ```RegExp```.
 ```
  var loggerMock = {
  	log: function(text){
  		return console.log("logging: " + text);
  	}
  }

  var requireMock = require("requiremock")(__filename);
  requireMock.mock(/.*logger\.js.*/g, fsMock);
  requireMock("./test.js");
  ```

 This will mean that the following code in ```test.js``` will output ```logging: test```
 ```
 var logger = require("../../util/logger.js");
 logger.log("test");
 ```

Have the mock you pass be supplied by a function
------------------------------------------------
In this advanced example, we have instrumented all the ```.js``` files in the ```lib``` folder.
Each instrumented file as been placed in the ```.coverage``` folder. So for the file ```lib/app.js```,
the instrumented version of the file is located in ```.coverage/app.js```.
So in this example we want to intercept all ```require``` statements for anything inside ```lib``` and serve the
instrumented version of the file.
```
requireMock = require("requiremock");
requireMock.mock(
	path.join(process.cwd(), "lib") + "*",
	function(stringPassedToRequire, filePathRequired, fileDoingRequire){
		var instrumentedFilePath = filePathRequired.replace(
			path.join(process.cwd(), "lib"),
			path.join(process.cwd(), ".coverage")
		);
		return require(instrumentedFilePath);
	}
);
requireMock("./runAllTests.js"); //all requires done while running tests, will be served instrumented files
```
