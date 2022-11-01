const csvStreamToJson = require('./main');
const fs = require('fs');

const stream = fs.createReadStream('./data.csv');

console.time('time')
Promise.resolve(csvStreamToJson(stream))
  .finally(()=>{console.timeEnd('time')})

