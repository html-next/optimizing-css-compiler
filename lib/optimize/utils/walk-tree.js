/*
  Walks a Directory recursively, calling the callback for each file found with the file's path and contents
 */
const fs = require('fs');
const path = require('path');

function walkTree(dirPath, cb) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirPath, { encoding: 'utf-8' }, (err, files) => {
      if (err) { reject(err); }
      else {
        processDir(dirPath, files, cb).then(resolve, reject);
      }
    });
  });
};

function processDir(dirPath, files, cb) {
  let awaits = [];

  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    let fullPath = path.join(dirPath, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      awaits.push(walkTree(fullPath, cb));
    } else {
      awaits.push(processFile(fullPath, cb));
    }
  }

  return Promise.all(awaits);
}

function processFile(file, cb) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, { encoding: 'utf-8' }, (err, data) => {
      if (err) { reject(err); }
      else {
        resolve(cb(file, data));
      }
    });
  });
}

module.exports = walkTree;
