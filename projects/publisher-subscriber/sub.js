"use strict";

const pubSub = require("./pubSub");

const subscription = pubSub.subscribe("newEvent", (arg1, arg2) => {
  console.log(`callback function is called with ${arg1} ${arg2}`);
  subscription.unsubscribe();
});

// unsubscribe();
