const Transform = require('stream').Transform;
const ObjectStore = require('./objectStore');

const store = new ObjectStore(()=>({}));

const parser = new Transform();

const utf8 = new TextEncoder();

const endl = utf8.encode("\n");
const comma = utf8.encode(",");

var titles;
const outputdata = new Array();
var lastTail;

parser._transform = function(data, encoding, done){
  data = titles ? data : setTitles(data);
  const [head, tail] = chunkSlice(data, lastTail);
  lastTail = tail;
  processChunk(head);
  done();
}

function chunkSlice (chunk, tail){
  const indexOfLastNewLine = chunk.lastIndexOf(endl);
  const size = chunk.byteLength;
  const tailSize = tail?.byteLength || 0;
  const sliceLength = size - (size - indexOfLastNewLine) + tailSize + 1;
  const head = Buffer.allocUnsafe(sliceLength);
  tail && tail.copy(head);
  chunk.copy(head, tailSize);
  return [
    head,
    chunk.slice(indexOfLastNewLine),
  ]
}


function processChunk (chunk){
  let idx = 0;
  let nextIdx = 0;
  let nextLine = 0;
  while (idx < chunk.byteLength - 1) {
    let col = 0;
    nextLine = chunk.indexOf(endl, idx);
    const out = store.get();
    while (idx < nextLine && nextLine < chunk.byteLength - 1) {
      nextIdx = Math.min(chunk.indexOf(comma, idx), nextLine)
      out[titles[col]] = chunk.slice(idx, nextIdx).toString();
      idx = nextIdx + 1;
      col++
    }
    idx = nextLine + 1;
    outputdata.push(out);
    store.store(out);
  }
};

function setTitles (data) {
  const idxOfLine = data.indexOf(endl);
  titles = new Array();
  let idx = 0;
  let nextIdx = 0;
  while(idx < idxOfLine) {
    nextIdx = Math.min(data.indexOf(comma, idx), idxOfLine);
    var title = data.slice(idx, nextIdx);
    titles.push(title);
    idx = nextIdx +1
  }
  return data.slice(idx)
}

module.exports = async function csvStreamToJson(stream) {
  return await new Promise((resolve, reject)=> {
    stream.pipe(parser)
    stream.on('error', reject)
    stream.on('end', ()=>resolve(outputdata))
  })
}
