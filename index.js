const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const SSE = require('express-sse');
const {addPoint, getData} = require('./data.js');
const hook = require('./hook.js');

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
  sse.send({appId: ''});
}, 60*1000);

app.get('/data/:set', (req, res)=>{
  res.send(getData(req.params.set));
});

app.post('/hook', (req, res)=>{
  let evts = hook(req.body);
  evts.forEach((e)=>{
    addPoint(e.appId, e.name, e.x, e.y);
    sse.send(e);
  });

  res.send('OK');
});

app.listen(9090, ()=>{
  console.log('App listening on port 9090!');
});
