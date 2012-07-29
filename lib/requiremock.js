var cache = {};
global.__requireMock_originalRequire = global.__requireMock_originalRequire || require;
var fs = global.__requireMock_originalRequire('fs'), path = global.__requireMock_originalRequire('path');
//these things need to be put in vars, so they are not overwritten if people add spies to fs or path
var fsStatSync = fs.statSync;
var existsSync = function (path) {
	try {
		fsStatSync(path);
		return true;
	} catch (ex) {
		return false;
	}
};
var readFileSync = fs.readFileSync;
var pathJoin = path.join;
var pathDirname = path.dirname;
var pathResolve = path.resolve;

function getRequireMock(originalFile, optionalMockSpecs, optionalCache) {
	var mockSpecs = optionalMockSpecs || [];
	var cache = optionalCache || {};

	interceptRequire.cache = cache;
	interceptRequire.resolve = global.__requireMock_originalRequire.resolve;
	interceptRequire.mock = addMockSpec;
	interceptRequire.mockFilePath = addFilePathMockSpec;
	interceptRequire.globalMock = addGlobalMockSpec;
	return interceptRequire;

	function load(file) {
		//read the raw file
		var raw = readFileSync(file, 'utf8');
		var compiled;
		if (file.match(/\.coffee$/)) {
			compiled = global.__requireMock_originalRequire('coffee-script').compile(raw, {filename:file});
		} else {
			try {
				return JSON.parse(raw);
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
		if (existsSync(pathJoin(file, "index.js"))) {
			return pathJoin(file, "index.js");
		}
		if (existsSync(pathJoin(file, "index.coffee"))) {
			return pathJoin(file, "index.coffee");
		}
		if (existsSync(file)) {
			return file;
		}
		return new Error("cant find module " + file);
	}

	function getFile(lib) {
		if (lib === "fs" || lib === "path") {
			//these are special because we use them here in requiremock.
			//we need this special check in order not to fuck up when people put spies on fs or path
			return {originalRequire:true, file:lib};
		}
		var file;
		if (lib.indexOf('./') === 0 || lib.indexOf('../') === 0) {
			file = pathResolve(pathJoin(pathDirname(originalFile), lib));
		} else {
			//search in local path
			var lastDirName;
			for (var dirName = pathDirname(originalFile); dirName !== lastDirName; dirName = pathJoin(dirName, "..")) {
				var nodeModulePath = pathJoin(dirName, "node_modules", lib);
				if (existsSync(pathJoin(nodeModulePath, "package.json"))) {
					return {originalRequire:true, file:nodeModulePath};
				}
				lastDirName = dirName;
			}
			//search for modules using original require
			try{
				file = global.__requireMock_originalRequire.resolve(lib);
			} catch (ex){
				file = pathResolve(pathJoin(pathDirname(originalFile), lib));
			}
			if (file === lib && lib.indexOf("/") === -1 && lib.indexOf("\\") === -1) {
				//resolving did not change path, must be a build in module like "events"
				return {originalRequire:true, file:lib};
			}
		}
		return {file:getRealFile(file)};
	}

	function interceptRequire(lib, optional__filename, optional__dirname) {
		var requireSpec;
		requireSpec = getFile(lib);
		var mock = getMock(lib, requireSpec.file);
		if (mock) {
			return mock;
		}
		if (requireSpec.originalRequire) {
			return global.__requireMock_originalRequire(requireSpec.file);
		}
		//if there is no file and no mock we have an error
		if(requireSpec.file instanceof Error){
			throw requireSpec.file;
		}
		var filePath = requireSpec.file;
		if (!cache[filePath]) {
			var data = load(filePath);
			if (typeof data !== "string") {
				//we have json
				cache[filePath] = data;
				return data;
			}
			while (data[0] === "#") {
				var lines = data.split("\n");
				lines.shift();
				data = lines.join("\n");
			}
			var filename = optional__filename ? JSON.stringify(optional__filename) : JSON.stringify(filePath);
			var dirname = optional__dirname ? JSON.stringify(optional__dirname) : JSON.stringify(pathDirname(filePath));
			var tmpVar = "requireMock_tmp_" + Date.now() + "_" + (Math.random().toString().replace(".", ""));
			var code = "global." + tmpVar + " = (function (){" +
				"var __filename = " + filename + ";" +
				"var __dirname = " + dirname + ";" +
				"var require = __requireMock_originalRequire(" + JSON.stringify(__filename) + ")(" + filename + ", global.__mockSpecs, global.__requireMock_cache);" +
				"if(global.__getLastModule){ require.cache[global.__lastRequire] = global.__getLastModule(); }" + //this is needed to avoid require loops
				"var module={exports:{},paths:[]};" +
				"var exports = module.exports;" +
				"global." + tmpVar + " = module;" +
				"global.__getLastModule = function(){ return global." + tmpVar + ";};" +
				"global.__lastRequire = " + JSON.stringify(filePath) + ";" +
				"" + data + "" +
				"\nreturn global." + tmpVar + ";})();";
			cache[filePath] = run(code, filePath, tmpVar, mockSpecs, cache);
		}
		return cache[filePath].exports;
	}

	function _addMockSpec(pattern, mock, isFilePathMock, onlyMockOnce) {
		var patternToUse = pattern;
		if (typeof patternToUse === "string") {
			patternToUse = new RegExp("^" + escapeStringForRegExp(patternToUse) + "$", "g");
		}
		mockSpecs.push({pattern:patternToUse, mock:mock, isFilePathMock:isFilePathMock, onlyMockOnce:onlyMockOnce});
	}

	function addMockSpec(pattern, mock) {
		_addMockSpec(pattern, mock, false, true);
	}

	function addGlobalMockSpec(pattern, mock) {
		_addMockSpec(pattern, mock, false, false);
	}

	function addFilePathMockSpec(pattern, mock) {
		_addMockSpec(pattern, mock, true, true);
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
				if (mockSpec.onlyMockOnce) {
					mockSpecs.splice(i, 1);
				}
				if (mockSpec.isFilePathMock) {
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