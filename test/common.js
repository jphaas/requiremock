"use strict";
global.sinon = require('sinon');
var chai = require('chai');
global.expect = chai.expect;
chai.use(require('sinon-chai'));
global.requireMockFactory = require("../lib/requiremock");
