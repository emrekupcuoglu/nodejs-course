"use strict";

const sub = require("./sub");
const pub = require("./pub");

pub.publishEvent("hello from data", 2);
pub.publishEvent("hello for the second time");
