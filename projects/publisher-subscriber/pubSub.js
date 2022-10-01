"use strict";

let subscribers = {};

module.exports = {
  publish(event, ...data) {
    if (!subscribers[event]) return;
    subscribers[event].forEach((callback) => {
      callback(...data);
      console.log(data);
      console.log(...data);
    });
  },

  subscribe(event, callback) {
    if (!subscribers[event]) subscribers[event] = [];
    const index = subscribers[event].push(callback) - 1;
    console.log(subscribers);

    return {
      unsubscribe() {
        subscribers[event].splice(index, 1);
      },
    };
  },
};
