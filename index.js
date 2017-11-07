// const ttn = require('ttn');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const SSE = require('express-sse');
const {addPoint, getData} = require('./data.js');
const hook = require('./hook.js');

// const config = require('./config.json');-

const sse = new SSE();

app.use(express.static('static'));
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true,
}));

app.get('/', (req, res)=>{
  res.redirect(301, 'index.html');
});

app.get('/stream', sse.init);
setInterval(()=>{
  sse.send({addId: ''}, 'keepalive');
}, 60*1000);

app.get('/data/:set', (req, res)=>{
  res.send(getData(req.params.set));
});

app.post('/hook', (req, res)=>{
  let evt = hook(req.body);
  addPoint(evt.addId, evt.name, evt.x, evt.y);
  sse.send(evt);

  res.send('OK');
});

app.listen(9090, ()=>{
  console.log('App listening on port 9090!');
});