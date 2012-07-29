"use strict";
var fs = require("fs");
module.exports = { success: fs.existsSync(__filename)};