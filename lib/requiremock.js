var cache = {};
global.__requireMock_originalRequire = require;

function getRequireMock(originalFile, optionalMockSpecs, optionalCache) {
	var mockSpecs = optionalMockSpecs || [];
	var cache = optionalCache || {};
	var fs = require('fs'), path = require('path');
	var existsSync = fs.existsSync || path.existsSync;

	interceptRequire.cache = cache;
	interceptRequire.resolve = global.__requireMock_originalRequire.resolve;
	interceptRequire.mock = addMockSpec;
	interceptRequire.mockFilePath = addFilePathMockSpec;
	return interceptRequire;

	function load(file) {
		var raw = fs.readFileSync(file, 'utf8'), compiled;
		if (file.match(/\.coffee$/)) {
			compiled = require('coffee-script').compile(raw, {filename:file});
		} else {
			try {
				var object = JSON.parse(raw);
				return object;
			} catch (ex) {
				compiled = raw;
			}
		}
		return compiled;
	}

	function getRealFile(file) {
		if (existsSync(file + ".js")) {
			return file + ".js";
		}
		if (existsSync(file + ".json")) {
			return file + ".json";
		}
		if (existsSync(file + ".coffee")) {
			return file + ".coffee";
		}
		if (existsSync(path.join(file, "index.js"))) {
			return path.join(file, "index.js");
		}
		if (existsSync(path.join(file, "index.coffee"))) {
			return path.join(file, "index.coffee");
		}
		if (existsSync(file)) {
			return file;
		}
		throw new Error("cant find module " + file);
	}

	function getFile(lib) {
		var file;
		if (lib.indexOf('./') === 0 || lib.indexOf('../') === 0) {
			file = path.resolve(path.join(path.dirname(originalFile), lib));
		} else {
			//search in local path
			var lastDirName;
			for (var dirName = path.dirname(originalFile); dirName !== lastDirName; dirName = path.join(dirName, "..")) {
				var nodeModulePath = path.join(dirName, "node_modules", lib);
				if (existsSync(path.join(nodeModulePath, "package.json"))) {
					return {originalRequire:true, file:nodeModulePath};
				}
				lastDirName = dirName;
			}
			//search for modules using original require
			file = global.__requireMock_originalRequire.resolve(lib);
			if (file === lib && lib.indexOf("/") === -1 && lib.indexOf("\\") === -1) {
				//resolving did not change path, must be a build in module like "events"
				return {originalRequire:true, file:lib};//global.__requireMock_originalRequire(lib);
			}
		}
		return {file:getRealFile(file)};
	}

	function interceptRequire(lib) {
		var requireSpec = getFile(lib);
		var mock = getMock(lib, requireSpec.file);
		if (mock) {
			return mock;
		}
		if (requireSpec.originalRequire) {
			return global.__requireMock_originalRequire(requireSpec.file);
		}
		var filePath = requireSpec.file;
		if (!cache[filePath]) {
			var data = load(filePath);
			if(typeof data !== "string"){
				//we have json
				cache[filePath] = data;
				return data;
			}
			while (data[0] === "#") {
				var lines = data.split("\n");
				lines.shift();
				data = lines.join("\n");
			}
			var tmpVar = "requireMock_tmp_" + Date.now() + "_" + (Math.random().toString().replace(".", ""));
			var code = "global." + tmpVar + " = (function (){" +
				"var __filename = " + JSON.stringify(filePath) + ";" +
				"var __dirname = " + JSON.stringify(path.dirname(filePath)) + ";" +
				"var require = __requireMock_originalRequire(" + JSON.stringify(__filename) + ")(__filename, global.__mockSpecs, global.__requireMock_cache);" +
				"if(global.__getLastModule){ require.cache[global.__lastRequire] = global.__getLastModule(); }" + //this is needed to avoid require loops
				"var module={exports:{},paths:[]};" +
				"var exports = module.exports;" +
				"global." + tmpVar + " = module;" +
				"global.__getLastModule = function(){ return global." + tmpVar + ";};" +
				"global.__lastRequire = " + JSON.stringify(filePath) + ";" +
				"" + data + "" +
				"\nreturn global." + tmpVar + ";})();";
			var moduleReturned = run(code, filePath, tmpVar, mockSpecs, cache);
			cache[filePath] = moduleReturned;
		}
		return cache[filePath].exports;
	}

	function _addMockSpec(pattern, mock, isFilePathMock) {
		var patternToUse = pattern;
		if (typeof patternToUse === "string") {
			patternToUse = new RegExp("^" + escapeStringForRegExp(patternToUse) + "$", "g");
		}
		mockSpecs.push({pattern:patternToUse, mock:mock, isFilePathMock: isFilePathMock});
	}
	function addMockSpec(pattern, mock) {
		_addMockSpec(pattern, mock, false);
	}
	function addFilePathMockSpec(pattern, mock) {
		_addMockSpec(pattern, mock, true);
	}

	function escapeStringForRegExp(text) {
		var regExpMetaCharacters = /(\/|\[|\\|\^|\$|\.|\||\?|\*|\+|\(|\))/gmi;
		return text.replace(regExpMetaCharacters, function (strMetaCharacter) {
			if (strMetaCharacter === "*") {
				return ".*";
			}
			return "\\" + strMetaCharacter;
		});
	}

	function getMock(lib, filePath) {
		for (var i = 0; i < mockSpecs.length; i++) {
			var mockSpec = mockSpecs[i];
			if (mockSpec.pattern.test(lib) || mockSpec.pattern.test(filePath)) {
				var mockResult;
				if (typeof mockSpec.mock === "function") {
					mockResult = mockSpec.mock(lib, filePath, originalFile);
				} else {
					mockResult = mockSpec.mock;
				}
				if(mockSpec.isFilePathMock){
					return interceptRequire(mockResult);
				}
				return mockResult;
			}
		}
		return null;
	}
}

function run(__code__, __file__, ___tmpVar___, __mockSpecs__, __cache__) {
	global.__mockSpecs = __mockSpecs__;
	global.__requireMock_cache = __cache__;
	global.__requireMock_originalRequire('vm').runInThisContext(__code__, __file__);
	var __returnValue__ = global[___tmpVar___];
	delete global[___tmpVar___];
	delete global.__getLastModule; //this is only used for nested requires, we can delete now
	delete global.__lastRequire; //this is only used for nested requires, we can delete now
	delete global.__mockSpecs;
	delete global.__requireMock_cache;
	if (!__returnValue__) {
		throw new Error("No return value from requiring " + __file__);
	}
	return __returnValue__;
}

module.exports = getRequireMock;