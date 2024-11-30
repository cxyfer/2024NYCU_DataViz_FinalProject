// Code reference to https://github.com/jacychutw/d3-practice-GYM/blob/main/index.js
// Shape file of Taiwan Map from Taiwan Government Website https://data.gov.tw/en/datasets/all

// var blue = d3.rgb('#aec7e8');
// var purple = d3.rgb('#c5b0d5');
// var green = d3.rgb('#cedb9c');
// var pink = d3.rgb('#ff9896');
// var yellow = d3.rgb('#fdd0a2');

// Set Background
d3.select("#map-container")
  .select("svg")
  .append("rect")
  .attr("width", 650)
  .attr("height", 550)
  .attr("fill", "lightblue");

// Map on the left
var svg = d3.select("#map-container").select("svg");

const g = svg
  .append("g")
  .attr("width", 650)
  .attr("height", 550)
  .attr("id", "map");

svg.call(
  d3.zoom().on("zoom", () => {
    g.attr("transform", d3.event.transform);
  })
);

// Using Mercator projection
var projection = d3.geoMercator().center([123.5, 23.5]).scale(5500);
var pathGenerator = d3.geoPath().projection(projection);

d3.select("body")
  .append("div")
  .attr("id", "tooltip")
  .attr("style", "position: absolute; opacity: 0;");

// Clean data function
const parseRow = (d) => {
  d["lat"] = +d["lat"];
  d["lon"] = +d["lon"];
  d["ML"] = +d["ML"];
  d["depth"] = +d["depth"];

  // Make date format to Date() format with the parsed values
  const [year, month, day] = d.date.split("-");
  const [hour, minute, second] = d.time.split(":");
  const dateTime = new Date(year, month - 1, day, hour, minute, second);
  d.date = dateTime;
  return d;
};

// Scatter Plot on the right
const scatterWidth = 600;
const scatterHeight = 580;
const scatterMargin = {
  top: 20,
  right: 30,
  bottom: 35,
  left: 50,
};

let scatterSvg = d3.select("#scatterplot-container").select("svg");

if (scatterSvg.empty()) {
  scatterSvg = d3
    .select("#scatterplot-container")
    .append("svg")
    .attr("id", "scatterplot")
    .attr("width", scatterWidth)
    .attr("height", scatterHeight);
} else {
  scatterSvg.attr("width", scatterWidth).attr("height", scatterHeight);
}

let xScale, yScale, xAxis, yAxis;

// Render Function
async function render(
  selectedYear,
  selectedXAttr,
  selectedYAttr,
  selectedColorAttr
) {
  svg.selectAll("circle").remove();
  g.selectAll("path").remove();
  g.selectAll("circle").remove();
  scatterSvg.selectAll("circle").remove();
  scatterSvg.selectAll("text").remove();
  scatterSvg.selectAll("g").remove();

  const [jsondata, csvdata] = await Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/taiwan-atlas/counties-10t.json"),
    d3.csv(
      "https://raw.githubusercontent.com/esa0624/cp341/main/Earthquake_1973_2024.csv",
      parseRow
    ),
  ]);
  console.log(csvdata);

  const filteredData = csvdata.filter(
    (d) => d.date.getFullYear() === selectedYear && d.quality != ""
  );

  // Get map TopoJSON data
  const geometries = topojson.feature(jsondata, jsondata.objects["counties"]);
  console.log(jsondata);

  g.append("path");
  const paths = g.selectAll("path").data(geometries.features);
  paths
    .enter()
    .append("path")
    .attr("d", pathGenerator)
    .attr("class", "county")
    .on("mouseover", function (d) {
      const [x, y] = pathGenerator.centroid(d);
      const name = d.properties.COUNTYENG;
      console.log(name);
      d3.select("#tooltip")
        .style("opacity", 1)
        .html("<div>Name: " + name + "</div>")
        .style("left", `${x}px`)
        .style("top", `${y}px`);
    })
    .on("mousemove", function () {
      d3.select("#tooltip")
        .style("left", d3.event.pageX + 10 + "px")
        .style("top", d3.event.pageY + 10 + "px");
    })
    .on("mouseout", function () {
      d3.select("#tooltip").style("opacity", 0);
    });
}

const xSelect = document.getElementById("xAttrSelect");
const ySelect = document.getElementById("yAttrSelect");
const colorSelect = document.getElementById("colorAttrSelect");

// render();
render(1973, "ML", "ML", "depth");
