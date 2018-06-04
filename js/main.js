function wrapper(){

//initialize Leaflet map

var topLeft = [50, -85],
    botRight = [42, -102],
    bounds = L.latLngBounds(botRight,topLeft);





var map = L.map('mapid', {center: [46,-94], zoom: 7, maxBounds: bounds});

//add tiles
L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
  subdomains: 'abcd',
	maxZoom: 14,
	minZoom: 5
}).addTo(map);


d3.json("data/formattedData.json", function(error, json) {
  if(error) throw error;


var data = json.data;

  for(site of data){
    var lat = site["latitude"],
        long = site["longitude"],
        name = site["name"].replace(/ /g, "").replace("'", "");

//create site divMarker
  var siteIcon = L.divIcon({className: "div-icon", html: `<div id=${name}> </div>`});
 //add divMarker to map
  L.marker([lat, long], {icon: siteIcon}).addTo(map);

//////////draw radar chart

///format data for radar chart generator
    var d = formatRadar(site);
    ///draw radarChart with my data
    RadarChart.draw(`#${name}`, d, mycfg);

  }
  


});
//////end d3 async function call///////////////

var RadarChart = {
  draw: function(id, d, options){
  var cfg = {
   radius: 5,
   w: 600,
   h: 600,
   factor: 1,
   factorLegend: .85,
   levels: 3,
   maxValue: 0,
   radians: 2 * Math.PI,
   opacityArea: 0.5,
   ToRight: 5,
   TranslateX: -25,
   TranslateY: -25,
   ExtraWidthX: 100,
   ExtraWidthY: 100,
   color: color
  };
  
  if('undefined' !== typeof options){
    for(var i in options){
    if('undefined' !== typeof options[i]){
      cfg[i] = options[i];
    }
    }
  }
  cfg.maxValue = Math.max(cfg.maxValue, d3.max(d, function(i){return d3.max(i.map(function(o){return o.value;}))}));
  var allAxis = (d[0].map(function(i, j){return i.axis}));
  var total = allAxis.length;
  var radius = cfg.factor*Math.min(cfg.w/2, cfg.h/2);
  var Format = d3.format('%');
  d3.select(id).select("svg").remove();
  
  var g = d3.select(id)
      .append("svg")
      .attr("transform", "translate(" + cfg.TranslateX + "," + cfg.TranslateY + ")")
      .attr("width", cfg.w+cfg.ExtraWidthX)
      .attr("height", cfg.h+cfg.ExtraWidthY)
      .append("g");
      //.attr("transform", "translate(" + cfg.TranslateX + "," + cfg.TranslateY + ")");
      

  var tooltip;
  
  //Circular segments
  for(var j=0; j<cfg.levels; j++){
    var levelFactor = cfg.factor*radius*((j+1)/cfg.levels);
    g.selectAll(".levels")
     .data(allAxis)
     .enter()
     .append("svg:line")
     .attr("x1", function(d, i){return levelFactor*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
     .attr("y1", function(d, i){return levelFactor*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
     .attr("x2", function(d, i){return levelFactor*(1-cfg.factor*Math.sin((i+1)*cfg.radians/total));})
     .attr("y2", function(d, i){return levelFactor*(1-cfg.factor*Math.cos((i+1)*cfg.radians/total));})
     .attr("class", "line")
     .style("stroke", "grey")
     .style("stroke-opacity", "0.25")
     .style("stroke-width", "0.3px")
     .attr("transform", "translate(" + (cfg.w/2-levelFactor) + ", " + (cfg.h/2-levelFactor) + ")");
  }

  //Text indicating at what % each level is: no labels for now
/*
  for(var j=0; j<cfg.levels; j++){
    var levelFactor = cfg.factor*radius*((j+1)/cfg.levels);
    g.selectAll(".levels")
     .data([1]) //dummy data
     .enter()
     .append("svg:text")
     .attr("x", function(d){return levelFactor*(1-cfg.factor*Math.sin(0));})
     .attr("y", function(d){return levelFactor*(1-cfg.factor*Math.cos(0));})
     .attr("class", "legend")
     .style("font-family", "sans-serif")
     .style("font-size", "10px")
     .attr("transform", "translate(" + (cfg.w/2-levelFactor + cfg.ToRight) + ", " + (cfg.h/2-levelFactor) + ")")
     .attr("fill", "#737373")
     .text(Format((j+1)*cfg.maxValue/cfg.levels));
  }
  */
  
  series = 0;

  var axis = g.selectAll(".axis")
      .data(allAxis)
      .enter()
      .append("g")
      .attr("class", "axis");

  axis.append("line")
    .attr("x1", cfg.w/2)
    .attr("y1", cfg.h/2)
    .attr("x2", function(d, i){return cfg.w/2*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
    .attr("y2", function(d, i){return cfg.h/2*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
    .attr("class", "line")
    .style("stroke", "grey")
    .style("stroke-width", "1px")
    .style("stroke-opacity", ".25");


/*
  axis.append("text")
    .attr("class", "legend")
    .text(function(d){return d})
    .style("font-family", "sans-serif")
    .style("font-size", "11px")
    .attr("text-anchor", "middle")
    .attr("dy", "1.5em")
    .attr("transform", function(d, i){return "translate(0, -10)"})
    .attr("x", function(d, i){return cfg.w/2*(1-cfg.factorLegend*Math.sin(i*cfg.radians/total))-60*Math.sin(i*cfg.radians/total);})
    .attr("y", function(d, i){return cfg.h/2*(1-Math.cos(i*cfg.radians/total))-20*Math.cos(i*cfg.radians/total);});
*/


 
  d.forEach(function(y, x){
    dataValues = [];
    g.selectAll(".nodes")
    .data(y, function(j, i){
      dataValues.push([
      cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)), 
      cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
      ]);
    });
    dataValues.push(dataValues[0]);
    g.selectAll(".area")
           .data([dataValues])
           .enter()
           .append("polygon")
           .attr("class", "radar-chart-serie"+series)
           .style("stroke-width", ".1px")
           .style("stroke", cfg.color(series))
           .attr("points",function(d) {
             var str="";
             for(var pti=0;pti<d.length;pti++){
               str=str+d[pti][0]+","+d[pti][1]+" ";
             }
             return str;
            })
           .style("fill", function(j, i){return cfg.color(series)})
           .style("fill-opacity", cfg.opacityArea);
           
/*
           .on('mouseover', function (d){
                    z = "polygon."+d3.select(this).attr("class");
                    g.selectAll("polygon")
                     .transition(200)
                     .style("fill-opacity", 0.1); 
                    g.selectAll(z)
                     .transition(200)
                     .style("fill-opacity", .7);
                    })
           .on('mouseout', function(){
                    g.selectAll("polygon")
                     .transition(200)
                     .style("fill-opacity", cfg.opacityArea);
           });
           */
    series++;
  });
  series=0;


  d.forEach(function(y, x){
    g.selectAll(".nodes")
    .data(y).enter()
    .append("svg:circle")
    .attr("class", "radar-chart-serie"+series)
    .attr('r', cfg.radius)
    .attr("alt", function(j){return Math.max(j.value, 0)})
    .attr("cx", function(j, i){
      dataValues.push([
      cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)), 
      cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
    ]);
    return cfg.w/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total));
    })
    .attr("cy", function(j, i){
      return cfg.h/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total));
    })
    .attr("data-id", function(j){return j.axis})
    .style("fill", cfg.color(series)).style("fill-opacity", .9)
    .on('mouseover', function (d){
          newX =  parseFloat(d3.select(this).attr('cx')) - 10;
          newY =  parseFloat(d3.select(this).attr('cy')) - 5;
          
          tooltip
            .attr('x', newX)
            .attr('y', newY)
            .text(Format(d.value))
            .transition(200)
            .style('opacity', 1);
            
          z = "polygon."+d3.select(this).attr("class");
          g.selectAll("polygon")
            .transition(200)
            .style("fill-opacity", 0.1); 
          g.selectAll(z)
            .transition(200)
            .style("fill-opacity", .7);
          })
    .on('mouseout', function(){
          tooltip
            .transition(200)
            .style('opacity', 0);
          g.selectAll("polygon")
            .transition(200)
            .style("fill-opacity", cfg.opacityArea);
          })
    .append("svg:title")
    .text(function(j){return Math.max(j.value, 0)});

    series++;
  });
  //Tooltip
  tooltip = g.append('text')
         .style('opacity', 0)
         .style('font-family', 'sans-serif')
         .style('font-size', '13px');
  }
};



////////////////////////////////////////////////////////////////////////////
var w = 50,
  h = 50;

var color = d3.scaleOrdinal()
        .range(["#4F77BB", '#A6CFE5', '#31A148', "#B3D88A"]);



/////////////////////////loading pollen data

var formattedData;
var ageBin = [];
var ageStep = 1000;
var ageStart = 1000;
var ageStop = 12000;
var taxaNames = ["Picea", "Quercus", "Betula", "Pinus"];

for(var i = ageStart; i <= ageStop; i+=ageStep) {
  ageBin.push(i);
}

//setup to handle single site///time blocks as axis

var formatRadar = function(site) {
  var radarData = [];
  var maxVal = 0;
  
    for(taxa of taxaNames){
      var taxaPoly = []
  
    for(var step of ageBin){
      var age = site.time[step];

      if(age["totalValue"] == 0){
        var val = 0;
      }
      else {
      var val = age[taxa]/age["totalValue"];
      }
      maxVal = Math.max(maxVal, val);
      taxaPoly.push({axis: step, value: val});
    }
      radarData.push(taxaPoly);
    }
    mycfg.maxValue = maxVal;
      return radarData;

};


//Options for the Radar chart, other than default
var mycfg = {
  w: w,
  h: h,
  levels: 3,
  ExtraWidthX: 200,
  ExtraWidthY: 200,
  radius: .5,
  opacityArea: .9
}

///end wrapper function
};

window.onload = wrapper();