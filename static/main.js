window.onhashchange = ()=>window.location.reload();

Highcharts.setOptions({global: {useUTC: false}});

let stream;
let fetchInterval;

async function fetchData() {
  if (!window.location.hash) window.location.hash = '#default';
  let {title, data} = await fetch('/data/'+window.location.hash.slice(1))
  .then((txt)=>txt.json())
  .catch((e)=>{
    console.log(e);
    return {title: 'No data available', data: []};
  });

  //console.log('new data', title, data);

  chart.setTitle({text: title});

  chart.series.forEach((graph)=>{
    if (data[graph.name]) {
      //console.log('updating',graph.name,data[graph.name]);
      graph.data.forEach((point)=>{
        if (point && data[graph.name][point.name]) delete data[graph.name][point.name];
      });
      //console.log('remaing',graph.name,data[graph.name]);
      Object.keys(data[graph.name]).forEach((x)=>{
        graph.addPoint([Number(x), Number(data[graph.name][x])]);
      });
      //console.log('update',graph.name,'complete');

      if (data[graph.name]) delete data[graph.name];
    }
  });
  //console.log('remaining res',data);
  Object.keys(data).forEach((name)=>{
    chart.addSeries({
      name: name,
      data: Object.keys(data[name]).map((key)=>[Number(key), Number(data[name][key])]),
      visible: !name.includes(" _"),
    });
  });

  console.log('New data fetched.');
}

const chart = Highcharts.chart('container', {
  chart: {
    events: {
      load: ()=>{
        console.log('Chart loaded.');
        setupStream();
      },
    },
    zoomType: 'x',
  },

  title: {},

  yAxis: {
    title: {
      text: 'Measurement',
    },
  },
  xAxis: {
    type: 'datetime',
    title: {
      text: 'Time',
    },
  },
  legend: {
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
  },

  plotOptions: {
    series: {
      pointStart: 0,
    },
  },

  series: [],

});

function setupStream() {
  console.log('Connecting to stream.');
  stream = new EventSource('/stream');
  fetchData();
  
  stream.onopen = (e)=>{
    console.log('Stream connected.');
    window.clearInterval(fetchInterval);
    fetchInterval = window.setInterval(fetchData, 2*60*1000);
  }
  
  stream.onmessage = (e)=>{
    console.log("backoff, stream still connected.");
    window.clearInterval(fetchInterval);
    fetchInterval = window.setInterval(fetchData, 2*60*1000);

    let data = JSON.parse(e.data);

    if (data.appId !== window.location.hash.slice(1)) return;

    console.log('New data streamed.');

    let match = false;
    chart.series.forEach((graph)=>{
      if (graph.name === data.name) {
        graph.addPoint([Number(data.x), Number(data.y)]);
        match = true;
      }
    });
    if (match) return;
    chart.addSeries({
      name: data.name,
      data: [[Number(data.x), Number(data.y)]],
      visible: !data.name.includes(" _"),
    });
  };

  stream.onerror = (e)=>{
    console.log(e);
    fetchData();
    window.setTimeout(setupStream, 10*1000);
  }
}
