"use strict";
require("./requireMe.js");
module.exports = global.__requireTest;
delete global.__requireTest;