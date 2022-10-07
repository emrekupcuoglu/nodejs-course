"use strict";

const fs = require(`fs`);
const superagent = require("superagent");
const http = require(`http`);
const { dir } = require("console");
const { resolve } = require("path");
const { rejects } = require("assert");
// https://dog.ceo/api/breed/hound/images/random

// *Callback Hell
// fs.readFile(`${__dirname}/dog.txt`, "utf-8", (err, data) => {
//   console.log(`Breed:${data}`);
//   superagent.get(`https://dog.ceo/api/breed/${data}/images/random`).end((err, res) => {
//     console.log(res.body.message);
//     fs.writeFile("dog-img.txt", res.body.message, err => {

//       if (err) return console.log(`error ${err}`);

//       console.log("Random dog image saved to file");
//     });
//   });
// });


// *Promise

// fs.readFile(`${__dirname}/dog.txt`, "utf-8", (err, data) => {
//   console.log(data);

//   superagent
//     .get(`https://dog.ceo/api/breed/${data}/images/random`)
//     .then(res => {
//       console.log(res.body.message);

//       fs.writeFile("dog-img.txt", res.body.message, err => {
//         if (err) return console.log(`error ${err.message}`);
//         console.log("Random dog image saved to file");

//       });

//     })
//     .catch(err => console.log(err.message));
// });


// * Promisify the readFile and writeFile functions

const readFilePromise = file => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf-8", (err, data) => {
      // If there is an error we will reject the promise
      // whatever we pass into the reject function will be the 
      // error that is later available in the catch method
      if (err) reject("file not found");
      // Whatever we pass into the resolve function
      // will be the data that will be available on the then() method
      resolve(data);
    });
  });
};

const writeFilePromise = (file, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(`${__dirname}/dog-img.txt`, data, err => {
      if (err) reject(err);
      resolve("Success");
    });

  });
};

// *Chaning promises

// readFilePromise(`${__dirname}/dog.txt`)
//   .then(data => {
//     return superagent.get(`https://dog.ceo/api/breed/${data}/images/random`);
//   })
//   .then(data => {
//     return writeFilePromise(`${__dirname}/dog-img.txt`, data.body.message);
//   })
//   .then(() => console.log("Random dog image saved to file"))
//   .catch(err => console.log(err.message));


const start = Date.now();

// *Async/await
const getDog = async function () {
  try {
    console.log("inside getDog");

    let y = 0;
    for (let i = 0; i < 10; i++) {

      for (let j = 0; j < 100000000; j++) {
        y++;
      }
      console.log("y", y, Date.now() - start);
    }
    console.log("y finished", Date.now() - start);

    const breed = await readFilePromise(`${__dirname}/dog.atxt`);
    const data = await superagent.get(`https://dog.ceo/api/breed/${breed}/images/random`);
    await writeFilePromise(`${__dirname}/dog-img.txt`, data.body.message);
    console.log(" Async/await: Random dog image saved to file");
  }

  catch (err) {
    console.log(err);
    throw (err);
  }
  // When we return a value from an async function we return a promise instead of the value

  let x = 0;
  for (let i = 0; i < 10; i++) {

    for (let j = 0; j < 100000000; j++) {
      x++;
    }
    console.log("x", x, Date.now() - start);
  }

  console.log("x finished", Date.now() - start);
  let z = 0;

  for (let i = 0; i < 10; i++) {

    for (let j = 0; j < 100000000; j++) {
      z++;
    }

    console.log("z", z, Date.now() - start);

  }

  console.log("z finished", Date.now() - start);

  return "Success";

};
console.log("1");
// This throws an unhandled promise rejection error 
// This happens because we are not using the catch method with it
// This is also useless because we can't use the result without the then() method
// So thening tihs is the way to go in a real app
// const dog = getDog();
// When we log this into the console we get
// Promise{pending} because when we return something
// from an async function we always get a promise
// Instead of saving the result into a variable we can use the then method to get the result
// Even if we have an error inside the async function
// the promise returning from there will be marked as successful
// ! We are using async/await and promises togerther this is not ideal
// ! We have turned this into an async function below
getDog()
  .then(x => console.log(x))
  .catch(err => {
    console.log("Error 💥");
  });
// We can not catch it using the catch method as well
// If we need to mark it asrejected we need to throw the error inside the async code


// console.log("dog", dog);
console.log("3");
let a = 0, b = 0;
for (let i = 0; i < 10; i++) {

  for (let j = 0; j < 100000000; j++) {
    a++;
  }

  console.log("a", a, Date.now() - start);

}
console.log("a finished", Date.now() - start);

for (let i = 0; i < 10; i++) {

  for (let j = 0; j < 100000000; j++) {
    b++;
  }

  console.log("b", b, Date.now() - start);

}
console.log("b finished", Date.now() - start);


// *IIFE

(async () => {
  try {

    const x = await getDog();
    console.log(x);


  }
  catch (err) {
    console.log("Error from IIFE");

  }
})();

// *Handling multiple promises at the same time

const getDog2 = async function () {
  const breed = await readFilePromise(`${__dirname}/dog.txt`);

  const pro1 = superagent.get(`https://dog.ceo/api/breed/${breed}/images/random`);
  const pro2 = superagent.get(`https://dog.ceo/api/breed/${breed}/images/random`);
  const pro3 = superagent.get(`https://dog.ceo/api/breed/${breed}/images/random`);
  const all = await Promise.all([pro1, pro2, pro3]);
  const imgs = all.map(img => img.body.message);
  console.log(imgs);
  writeFilePromise(`${__dirname}/dog-img.txt`, imgs.join("\n"));



  console.log(" Async/await parallel: Random dog image saved to file");
};
getDog2();
