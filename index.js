

function makeVis(){
  var d = parseData();
  drawGraph(d);
}


function parseData(){
  var d = document.getElementById('data').value.trim();
  if (d == '') return null;
  var lines = d.split('\n');

  // Transform into values
  var sep = document.getElementById('sep').value;
  var values = lines.map(function(l){
    return l.split(sep == '\\t' ? '\t' : sep);
  });

  return values;
}


function drawGraph(data){
  document.getElementById('visArea').innerHTML = '';

  var w = parseInt(document.getElementById('width').value);
  var hbar = parseInt(document.getElementById('bar-height').value);
  var h = (hbar+1) * data.length;
  var wlab = parseInt(document.getElementById('width-labels').value);
  var wbars = w - wlab;
  var colbars = document.getElementById('color-bars').value;


  var svg = d3.select('#visArea')
              .append('svg')
              .attr('width', w)
              .attr('height', h);

  var stats = computeStats(data);
  
  // Check if we have a calibration width that would replace the max value in the stats.
  var calib_width = parseInt(document.getElementById('calib-width').value || '0');
  if (calib_width > 0) stats.max = calib_width;

  var x = d3.scaleLinear()
            .range([0, wbars])
            .domain([0, stats.max]);

  var bars = svg.append('g').attr('class', 'bars');
  bars.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', wlab)
      .attr('y', function(d,i){ return i*(hbar+1); })
      .attr('width', function(d){ return d[1] == '' ? 0 : x(parseFloat(d[1])); })
      .attr('height', hbar)
      .attr('fill', colbars);

  var delimStep = document.getElementById('delim-step').value;
  delimStep = delimStep == 'auto' ? estimateDelimStep(stats) : parseFloat(delimStep);
  dataDelimSteps = [];
  for (var i=1; i < stats.max / delimStep; i++){
    dataDelimSteps.push( i * delimStep );
  }

  var barSteps = svg.append('g').attr('class', 'bars separators');
  barSteps.selectAll('line')
    .data(dataDelimSteps)
    .enter()
    .append('line')
    .attr('x1', function(d){ return wlab + x(d); })
    .attr('x2', function(d){ return wlab + x(d); })
    .attr('y1', 0)
    .attr('y2', h)
    .style('stroke', '#ffffff')
    .style('stroke-width', '1')
    .style('opacity', '0.5');

  
  var labels = svg.append('g').attr('class', 'labels');
  labels.selectAll('text')
    .data(data)
    .enter()
    .append('text')
    .attr('x', wlab-10)
    .attr('y', function(d,i){ return labelY(i, hbar); })
    .text(function(d){ return d[0]; })
    .style('text-anchor', 'end')
    .style('font-size', '12px');

  var showProps = document.getElementById('show-proportions').checked;
  var nDecim = parseInt(document.getElementById('proportions-decimals').value);
  var labelsBars = svg.append('g').attr('class', 'labels bars');
  labelsBars.selectAll('text')
    .data(data)
    .enter()
    .append('text')
    .attr('x', function(d){ 
      var v = x(parseFloat(d[1]));
      return labelInside(v, showProps) ? (wlab + v - 5) : (wlab + v + 5);
    })
    .attr('y', function(d,i){ return labelY(i, hbar); })
    .text(function(d){ 
      if (!showProps) return d[1];
      return d[1] +" (" + Math.round(d[1]/stats.sum*100 * Math.pow(10, nDecim), 1) / Math.pow(10, nDecim) + "%)" ; 
    })
    .style('text-anchor', function(d){
      var v = x(parseFloat(d[1]));
      return labelInside(v, showProps) ? 'end' : 'start';
    })
    .style('fill', function(d){
      var v = x(parseFloat(d[1]));
      return labelInside(v, showProps) ? '#ffffff' : '#000000';
    })
    .style('font-size', '12px');

  
}


function labelInside(v, showProps){
  if (showProps) return v > 60;
  return v > 30;
}

function labelY(i, hbar){
  return i*(hbar+1) + (hbar/2) + 4;
}


function estimateDelimStep(stats){
  var separatorUnit = Math.pow(10, Math.floor(Math.log10(stats.max)) - 1);
  var nbars = Math.floor(stats.max / separatorUnit);
  var barStep = 1;
  if (nbars / 10.0 > 1) barStep = Math.floor(nbars / 10.0);
  return separatorUnit * barStep;
}


/*
 * Calculates min and max of values (second column)
 */
function computeStats(data){
  var vmin = Infinity, vmax = -Infinity, vsum = 0;
  for (var i=0; i < data.length; i++){
    if (data[i][1] != '' && parseFloat(data[i][1]) < vmin) vmin = parseFloat(data[i][1]);
    if (data[i][1] != '' && parseFloat(data[i][1]) > vmax) vmax = parseFloat(data[i][1]);
    if (data[i][1] != '') vsum += parseFloat(data[i][1]);
  }
  if (document.getElementById('sum-proportions').value != 'auto'){
    vsum = parseFloat(document.getElementById('sum-proportions').value);
  }
  return { min: vmin, max: vmax, sum: vsum };
}



function downloadChart(){
  var svg = document.getElementById('visArea').innerHTML;
  var fname = document.getElementById('filename').value;
  if (fname.length == 0) fname = 'chart.svg';
  if (fname.substr(0, 1) == '.') fname = 'chart'+fname;
  if (fname.substr(fname.length-4, 4) != '.svg') fname += '.svg';
  var uri = "data:application/octet-stream," + encodeURIComponent(svg);
  var link = document.createElement("a");    
  link.href = uri;
  link.style = "visibility:hidden";
  link.download = fname;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}



const pickr = Pickr.create({
    el: '.color-picker',

    position: 'top',
    default: '#3e73a8',

    components: {

        // Main components
        preview: true,
        hue: true,

        // Input / output Options
        interaction: {
            hex: false,
            input: true,
            clear: false,
            save: true
        }
    },

    onSave(hsva, instance) {
      document.getElementById('color-bars').value = hsva.toHEX().toString();
    }

});
