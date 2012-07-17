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
- you can have the mock you pass be supplied by a function
- you can specify what __filename and __dirname should be when you require with requiremock.
- instead of passing a mock object, you can pass a path to a module to be used as a mock

NOTE: When matching, matching is done both on the string passed to ```require``` and the complete
path to the file that is required.

NOTE: Nested ```require``` statements are also mocked, so if you mock ```fs``` and use ```requiremock``` on  a file
```A`` that requires a file ```B``` that requires a file ```C``` and the file ```C``` has the statement
```require("fs")``` that require is mocked. Also if ```A``` or ```B``` has the statement ```require("fs")```, those are
also mocked.

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
requireMock("./myModule.js");
```
This will mean that the following code in ```myModule.js``` will output ```my test file contents```
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
 requireMock("./myModule.js");
 ```

This will mean that the following code in ```myModule.js``` will output ```logging: test```
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
  requireMock("./myModule.js");
  ```

 This will mean that the following code in ```myModule.js``` will output ```logging: test```
 ```
 var logger = require("../../util/logger.js");
 logger.log("test");
 ```


Have the mock you pass be supplied by a function
------------------------------------------------
 You can mock out the result of ```require("fs")``` in the file ```test.js``` like this
 ```
 var fsMock = {
 	readFileSync: function(){
 		return "my test file contents";
 	}
 }

 var requireMock = require("requiremock")(__filename);
 requireMock.mock("fs", function(stringPassedToRequire, filePathRequired, fileDoingRequire){
 	return fsMock;
 });
 requireMock("./myModule.js");
 ```
 This will mean that the following code in ```myModule.js``` will output ```my test file contents```
 ```
 var fs = require("fs");
 console.log(fs.readFileSync("config.txt", "utf-8));
 ```
In this example we are not really using the function for anything, but you can see the parameters passed
in the parameter names above.


Specify what __filename and __dirname should be
-----------------------------------------------
You specify what __filename and __dirname should be like this:
```
var requireMock = require("requiremock")(__filename);
requireMock("./myModule.js", "myFileName, "myDirName");
```

This will mean that the following code in ```myModule.js``` will output ```myFileName myDirName```
```
console.log(__filename, __dirname);
```

NOTE: This can be combined with also mocking things.


Instead of passing a mock object, you can pass a path to a module to be used as a mock
--------------------------------------------------------------------------------------
```
var requireMock = require("requiremock")(__filename);
requireMock.mockFilePath("./logger.js", path.resolve("test/mocks/loggerMock.js));
requireMock("./myModule.js");
```

This will mean that the following code in ```myModule.js``` will have the logger mocked
```
var logger = require("./logger.js"); //this returns the mock object in test/mocks/loggerMock.js
logger.log("test");
```

The difference between doing the above and
```
requireMock.mockFilePath("./logger.js", require("../mocks/loggerMock.js));
```
Is that when using ```mockFilePath``` any mocks defined are also applied to ```path.resolve("test/mocks/loggerMock.js)```
You may not need that very often, but I needed it, so I made it.

NOTE: ```mockFilePath``` can also take a function that returns a string as the second parameter.

