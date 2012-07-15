"use strict";
describe("When using requiremock", function(){
	var requireMock;
	beforeEach(function(){
		requireMock = requireMockFactory(__filename);
	});

	it("handles build in libraries", function (){
		var requireMockResult = requireMock("fs");
		var requireResult = require("fs");
		expect(requireMockResult).to.eql(requireResult);
	});

	it("handles standard requires", function (){
		var requireMockResult = requireMock("../requireExamples/standard/test.js");
		var requireResult = require("../requireExamples/standard/test.js");
		expect(requireMockResult).to.eql(requireResult);
		expect(requireMockResult).to.eql({ success: true });
	});

	it("handles standard coffee requires", function (){
		var requireMockResult = requireMock("../requireExamples/standardCoffee/test.coffee");
		var requireResult = require("../requireExamples/standardCoffee/test.coffee");
		expect(requireMockResult).to.eql(requireResult);
		expect(requireMockResult).to.eql({ success: true });
	});

	it("handles index.js", function (){
		var requireMockResult = requireMock("../requireExamples/indexJs");
		var requireResult = require("../requireExamples/indexJs");
		expect(requireMockResult).to.eql(requireResult);
		expect(requireMockResult).to.eql({ success: true });
	});

	it("handles index.coffee", function (){
		var requireMockResult = requireMock("../requireExamples/indexCoffee");
		var requireResult = require("../requireExamples/indexCoffee");
		expect(requireMockResult).to.eql(requireResult);
		expect(requireMockResult).to.eql({ success: true });
	});

	it("handles standard requires, adding .js", function (){
		var requireMockResult = requireMock("../requireExamples/standard/test");
		var requireResult = require("../requireExamples/standard/test");
		expect(requireMockResult).to.eql(requireResult);
		expect(requireMockResult).to.eql({ success: true });
	});

	it("handles standard requires, adding .coffee", function (){
		var requireMockResult = requireMock("../requireExamples/standardCoffee/test");
		var requireResult = require("../requireExamples/standardCoffee/test");
		expect(requireMockResult).to.eql(requireResult);
		expect(requireMockResult).to.eql({ success: true });
	});

	it("handles modification of global", function (){
		var requireMockResult = requireMock("../requireExamples/global/test.js");
		var requireResult = require("../requireExamples/global/test.js");
		expect(requireMockResult).to.eql(requireResult);
		expect(requireMockResult).to.eql({ success: true });
	});

	it("handles modification of exports", function (){
		var requireMockResult = requireMock("../requireExamples/exports/test.js");
		var requireResult = require("../requireExamples/exports/test.js");
		expect(requireMockResult).to.eql(requireResult);
		expect(requireMockResult).to.eql({ test: { success: true } });
	});

	it("handles cyclic references", function (){
		var requireMockResult = requireMock("../requireExamples/cyclic/test.js");
		var requireResult = require("../requireExamples/cyclic/test.js");
		expect(requireMockResult).to.eql(requireResult);
		expect(requireMockResult).to.eql({ cyclicDefined: true, test: { success: true } });
	});

	it("handles requiring files beginning with hash", function (){
		var requireMockResult = requireMock("../requireExamples/hash/test.js");
		var requireResult = require("../requireExamples/hash/test.js");
		expect(requireMockResult).to.eql(requireResult);
		expect(requireMockResult).to.eql({ success: true });
	});

	it("handles local packages", function (){
		var requireMockResult = requireMock("../requireExamples/localPackage/test.js");
		var requireResult = require("../requireExamples/localPackage/test.js");
		expect(requireMockResult).to.eql(requireResult);
		expect(requireMockResult).to.eql({ success: true });
	});
});
