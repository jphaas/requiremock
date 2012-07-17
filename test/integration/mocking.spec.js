"use strict";
var path = require("path");

describe("mocking", function () {
	var requireMock;
	var standardMock = {mocking:"success"};
	beforeEach(function () {
		requireMock = requireMockFactory(__filename);
	});

	it("handles full string matching", function () {
		requireMock.mock("./requireMe.js", standardMock);
		var requireMockResult = requireMock("../requireExamples/standard/test.js");
		expect(requireMockResult).to.eql(standardMock);
	});

	it("does not match on not full string", function () {
		requireMock.mock("./requireMe.j", standardMock);
		var requireMockResult = requireMock("../requireExamples/standard/test.js");
		expect(requireMockResult).to.eql({ success:true });
	});

	it("matches wildcard at end", function () {
		requireMock.mock("./requireMe*", standardMock);
		var requireMockResult = requireMock("../requireExamples/standard/test.js");
		expect(requireMockResult).to.eql(standardMock);
	});

	it("matches wildcard at beginning", function () {
		requireMock.mock("*requireMe.js", standardMock);
		var requireMockResult = requireMock("../requireExamples/standard/test.js");
		expect(requireMockResult).to.eql(standardMock);
	});

	it("matches wildcard at both ends", function () {
		requireMock.mock("*requireMe*", standardMock);
		var requireMockResult = requireMock("../requireExamples/standard/test.js");
		expect(requireMockResult).to.eql(standardMock);
	});

	it("matches wildcard in middle", function () {
		requireMock.mock("./require*.js", standardMock);
		var requireMockResult = requireMock("../requireExamples/standard/test.js");
		expect(requireMockResult).to.eql(standardMock);
	});

	it("matches a regExp", function () {
		requireMock.mock(/requireMe\.js/, standardMock);
		var requireMockResult = requireMock("../requireExamples/standard/test.js");
		expect(requireMockResult).to.eql(standardMock);
	});

	it("calls function for mock", function () {
		var stub = sinon.stub().returns(standardMock);
		requireMock.mock("./require*.js", stub);
		var requireMockResult = requireMock("../requireExamples/standard/test.js");
		expect(requireMockResult).to.eql(standardMock);
		expect(stub).to.be.calledWith(
			"./requireMe.js",
			path.resolve("test/requireExamples/standard/requireMe.js"),
			path.resolve("test/requireExamples/standard/test.js")
		);
	});

	describe("passing __filename and __dirname", function () {

		it("sets __filename if passed", function () {
			var testFileName = "MyTestFileName";
			var requireMockResult = requireMock("../requireExamples/returnFilenameAndDirname/requireMe.js", testFileName);
			var dirname = path.dirname(path.resolve("test/requireExamples/returnFilenameAndDirname/requireMe.js"));
			expect(requireMockResult).to.eql({filename:testFileName, dirname:dirname});
		});

		it("sets __filename  and __dirname if passed", function () {
			var testFileName = "MyTestFileName";
			var testDirName = "MyTestDirName";
			var requireMockResult = requireMock("../requireExamples/returnFilenameAndDirname/requireMe.js", testFileName, testDirName );
			expect(requireMockResult).to.eql({filename:testFileName, dirname:testDirName});
		});

		it("sets __dirname if passed", function () {
			var testDirName = "MyTestDirName";
			var requireMockResult = requireMock("../requireExamples/returnFilenameAndDirname/requireMe.js", null, testDirName );
			var filename = path.resolve("test/requireExamples/returnFilenameAndDirname/requireMe.js");
			expect(requireMockResult).to.eql({filename:filename, dirname:testDirName});
		});

	});

	describe("fileMocks", function () {

		it("replaces filePath with string passed", function () {
			requireMock.mockFilePath("./requireMe.js", path.resolve("test/requireExamples/filePathMock/requireMeFilePath.js"));
			var requireMockResult = requireMock("../requireExamples/filePathMock/test.js");
			expect(requireMockResult).to.eql({filePathMockSuccess:true});
		});

		it("replaces filePath by calling function passed", function () {
			var stub = sinon.stub().returns(path.resolve("test/requireExamples/filePathMock/requireMeFilePath.js"));
			requireMock.mockFilePath("./require*.js", stub);
			var requireMockResult = requireMock("../requireExamples/filePathMock/test.js");
			expect(requireMockResult).to.eql({filePathMockSuccess:true});
			expect(stub).to.be.calledWith(
				"./requireMe.js",
				path.resolve("test/requireExamples/filePathMock/requireMe.js"),
				path.resolve("test/requireExamples/filePathMock/test.js")
			);
		});

	});
});
