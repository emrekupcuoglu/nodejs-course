"use strict";

const pubSub = require("./pubSub");

module.exports = {
  publishEvent(...data) {
    pubSub.publish("newEvent", ...data);
  },
};
