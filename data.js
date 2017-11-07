const fs = require('fs');

const data = {
  a: {
    0: 1,
    1: 1,
    2: 1,
  },
  b: {
    0: 0,
    1: 1,
    2: 2,
  },
};
const series = {
  title: 'LORAWAN Data Plot',
  data: data,
};
let datasets = {
  'default': series,
};

if (fs.existsSync('./data.json')) {
   datasets = require('./data.json');
   console.log('Loaded.');
}

setInterval(()=>{
  fs.writeFile('data.json', JSON.stringify(datasets), 'utf8', ()=>{
    console.log('Data saved.');
  });
}, 5*60*1000);

function saveExit() {
  fs.writeFileSync('data.json', JSON.stringify(datasets), 'utf8');
  console.log('Data saved.');
  process.exit();
}
process.on('SIGTERM', saveExit);
process.on('SIGINT', saveExit);

function getData(set) {
  return datasets[set];
}

function addPoint(appId, name, x, y) {
  if (!datasets[appId]) {
    datasets[appId] = {
      title: 'TTN Dataset '+ appId,
      data: {},
    };
  }
  let set = datasets[appId];

  if (!set.data[name]) set.data[name] = {};
  let data = set.data[name];

  data[x] = y;
}

module.exports = {
  addPoint,
  getData,
};
