const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const SSE = require('express-sse');
const {addPoint, getData} = require('./data.js');
const hook = require('./hook.js');

const sse = new SSE();

// serve static pwa
app.use(express.static('static'));
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true,
}));

// auto launch static pwa
app.get('/', (req, res)=>{
  res.redirect(301, 'index.html');
});

// h2 server side events
app.get('/stream', sse.init);
setInterval(()=>{
  // keepalive data
  sse.send({appId: ''});
}, 60*1000);

// fetching a complete dataset
app.get('/data/:set', (req, res)=>{
  res.send(getData(req.params.set));
});

// recv data from ttn
app.post('/hook', (req, res)=>{
  let evts = hook(req.body);
  evts.forEach((e)=>{
    // add point to a given dataset
    addPoint(e.appId, e.name, e.x, e.y);
    // notify clients about new data
    sse.send(e);
  });

  res.send('OK');
});

app.listen(9090, ()=>{
  console.log('App listening on port 9090!');
});
