window.onhashchange = ()=>window.location.reload();

Highcharts.setOptions({global: {useUTC: false}});

const stream = new EventSource('/stream');

stream.onmessage = (e)=>{
  let data = JSON.parse(e.data);

  if (data.appId !== window.location.hash.slice(1)) return;

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
  });
};

stream.onerror = (e)=>{
  console.log(e);
  fetchData(true);
}

async function fetchData(single) {
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
    });
  });

  if (!single) setTimeout(fetchData, 10*60*1000);
}

const chart = Highcharts.chart('container', {
  chart: {
    events: {
      load: ()=>{
        console.log('Chart loaded!');
        fetchData();
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
