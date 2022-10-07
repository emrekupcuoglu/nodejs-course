"use strict";



const bubbleSort = function (arr) {

  for (let i = 0; i < arr.length; ++i) {

    for (let j = 0; j < arr.length - 1 - i; ++j) {

      if (arr[j] > arr[j + 1]) {
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  console.log(arr);
};

const unsortedArr = [3, 2, 5, 1, 7, 34, 123, 543, 4567,];
bubbleSort(unsortedArr);