// Code reference to https://github.com/jacychutw/d3-practice-GYM/blob/main/index.js
// Shape file of Taiwan Map from Taiwan Government Website https://data.gov.tw/en/datasets/all

// Set Background
d3.select('#map-container')
  .select('svg')
  .append('rect')
  .attr('width', 1650)
  .attr('height', 550)
  .attr('fill', 'lightblue');

// Map on the left
var svg = d3.select('#map-container').select('svg');

const g = svg
  .append('g')
  .attr('width', 650)
  .attr('height', 550)
  .attr('id', 'map');

svg.call(
  d3.zoom().on('zoom', () => {
    g.attr('transform', d3.event.transform);
  }),
);

// Using Mercator projection
var projection = d3
  .geoMercator()
  .center([123.5, 23.5])
  .scale(5500);
var pathGenerator = d3.geoPath().projection(projection);

d3.select('body')
  .append('div')
  .attr('id', 'tooltip')
  .attr('style', 'position: absolute; opacity: 0;');

// Scatter Plot on the right
const scatterWidth = 600;
const scatterHeight = 580;
const scatterMargin = {
  top: 20,
  right: 30,
  bottom: 35,
  left: 50,
};

let scatterSvg = d3
  .select('#scatterplot-container')
  .select('svg');

if (scatterSvg.empty()) {
  scatterSvg = d3
    .select('#scatterplot-container')
    .append('svg')
    .attr('id', 'scatterplot')
    .attr('width', scatterWidth)
    .attr('height', scatterHeight);
} else {
  scatterSvg
    .attr('width', scatterWidth)
    .attr('height', scatterHeight);
}

let xScale, yScale, xAxis, yAxis;

// Function to get max vote rate for each candidate
const getMaxVoteRate = (voteData, candidate) => {
  return Math.max(...Object.values(voteData)
    .map(county => county.得票率[candidate] || 0));
};

// Define base colors for each candidate with color scales
const createColorScale = (colorScheme, maxRate) => {
  // Get the color scheme arra
  console.log(d3[`scheme${colorScheme}`]);
  const colors = d3[`scheme${colorScheme}`][9];
  // Use colors from index 4 (middle) to 9 (end)
  return d3.scaleLinear()
    .domain([33, maxRate])
    .range([
      d3.color(colors[3]),
      d3.color(colors[8])
    ]);
};

// Define fixed colors for tooltip
const singleColor = {
  '賴清德': '#84CB98',  // DPP Green
  '侯友宜': '#000095',  // KMT Blue
  '柯文哲': '#FF6B6B'   // TPP Pink
};

const sequentialColor = {
  '賴清德': '#YlGn',
  '侯友宜': '#YlGnBu',
  '柯文哲': '#OrRd'
};

// Create color scales after loading data
const createColorScales = (voteData) => {
  return {
    '賴清德': createColorScale('YlGn', getMaxVoteRate(voteData, '賴清德')),  // DPP
    '侯友宜': createColorScale('YlGnBu', getMaxVoteRate(voteData, '侯友宜')),  // KMT
    '柯文哲': createColorScale('OrRd', getMaxVoteRate(voteData, '柯文哲'))   // TPP
  };
};

// Function to normalize county names (convert 台 to 臺)
const normalizeCountyName = (name) => {
  return name.replace('台', '臺');
};

// Render Function
async function render() {
  svg.selectAll('circle').remove();
  g.selectAll('path').remove();
  g.selectAll('circle').remove();

  const [jsondata, voteData] = await Promise.all([
    d3.json(
      'https://cdn.jsdelivr.net/npm/taiwan-atlas/counties-10t.json',
      // 'https://cdn.jsdelivr.net/npm/taiwan-atlas/towns-10t.json',
    ),
    d3.json('./各縣市.json'),
  ]);

  // Createcolor scales with the loaded data
  const colorScales = createColorScales(voteData);

  // Get map TopoJSON data
  const geometries = topojson.feature(
    jsondata,
    jsondata.objects['counties'],
  );

  // Function to get winner of each county
  const getWinner = (countyData) => {
    if (!countyData || !countyData.得票數) return null;
    const votes = countyData.得票數;
    return Object.entries(votes).reduce((a, b) =>
      (votes[a] > votes[b[0]] ? a : b[0]));
  };

  // Create legend with continuous color gradients
  const createLegend = (svg) => {
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(30, 400)');

    Object.entries(colorScales).forEach(([candidate, scale], i) => {
      const maxRate = getMaxVoteRate(voteData, candidate);
      const legendGroup = legend.append('g')
        .attr('transform', `translate(0, ${i * 40})`);

      // Add candidate name
      legendGroup.append('text')
        .attr('x', 0)
        .attr('y', 10)
        .style('font-size', '14px')
        .text(candidate);

      // Add continuous color gradient
      const gradientWidth = 80;
      const gradientHeight = 10;
      
      // Create linear gradient definition
      const gradientId = `gradient-${candidate}`;
      const gradient = legendGroup.append('defs')
        .append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%')
        .attr('x2', '100%')
        .attr('y1', '0%')
        .attr('y2', '0%');

      // Add color stops
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', scale(33));

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', scale(maxRate));

      // Create gradient rectangle
      legendGroup.append('rect')
        .attr('x', 60)
        .attr('y', 0)
        .attr('width', gradientWidth)
        .attr('height', gradientHeight)
        .style('fill', `url(#${gradientId})`);

      // Add start and end percentage labels
      [33, maxRate].forEach((value, j) => {
        legendGroup.append('text')
          .attr('x', 60 + j * gradientWidth)
          .attr('y', gradientHeight + 15)
          .attr('text-anchor', j === 0 ? 'start' : 'end')
          .style('font-size', '10px')
          .text(`${value.toFixed(1)}%`);
      });
    });
  };

  createLegend(svg);

  // Draw map with colors based on voting results
  const paths = g
    .selectAll('path')
    .data(geometries.features);

  paths
    .enter()
    .append('path')
    .attr('d', pathGenerator)
    .attr('class', 'county')
    .attr('stroke', '#fff')
    .attr('stroke-width', '1px')
    .style('fill', d => {
      const countyName = normalizeCountyName(d.properties.COUNTYNAME);
      const countyData = voteData[countyName];
      if (!countyData) return '#ccc';
      
      const winner = getWinner(countyData);
      const winnerRate = countyData.得票率[winner];
      return colorScales[winner](winnerRate);
    })
    .on('mouseover', function (d) {
      const countyName = normalizeCountyName(d.properties.COUNTYNAME);
      const countyData = voteData[countyName];
      
      d3.select(this)
        .attr('stroke', '#000')
        .attr('stroke-width', '2px');

      if (countyData) {
        const tooltipContent = `
          <div style="font-weight: bold; margin-bottom: 5px;">縣市: ${countyName}</div>
          <div style="margin-bottom: 5px;">總投票數: ${countyData.總投票數.toLocaleString()}</div>
          ${Object.entries(countyData.得票數).map(([candidate, votes]) => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: ${singleColor[candidate]}; font-weight: bold;">
                ${candidate}:
              </span>
              <span>
                ${votes.toLocaleString()} (${countyData.得票率[candidate]}%)
              </span>
            </div>
          `).join('')}
        `;

        d3.select('#tooltip')
          .style('opacity', 1)
          .style('background-color', 'rgba(255, 255, 255, 0.9)')
          .style('padding', '10px')
          .style('border-radius', '5px')
          .style('box-shadow', '0 0 10px rgba(0,0,0,0.1)')
          .html(tooltipContent)
          .style('left', d3.event.pageX + 10 + 'px')
          .style('top', d3.event.pageY + 10 + 'px');
      }
    })
    .on('mouseout', function () {
      d3.select(this)
        .attr('stroke', '#fff')
        .attr('stroke-width', '1px');
      d3.select('#tooltip').style('opacity', 0);
    });
}

render();