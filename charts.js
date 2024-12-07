// 颜色配置
const colors = {
    blue: "#4D99FF",
    green: "#00CC00",
    white: "#CCCCCC"
};

// 加载数据并绘制图表
d3.json("charts_data.json").then(function (data) {
    drawLineChart("#lineChart1", data.lineChart1);
    drawLineChart("#lineChart2", data.lineChart2);
    drawBarChart("#barChart1", data.barChart1);
    drawBarChart("#barChart2", data.barChart2);
});

// 绘制折线图
function drawLineChart(selector, chartData) {
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 400 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = d3.select(selector)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 创建比例尺
    const x = d3.scaleBand()
        .domain(chartData.data.map(d => d.percentage))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    // 添加坐标轴
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-45)");

    svg.append("g")
        .call(d3.axisLeft(y));

    // 创建折线生成器
    const line = d3.line()
        .x(d => x(d.percentage) + x.bandwidth() / 2)
        .y(d => y(d.value));

    // 绘制三条折线
    ["blue", "green", "white"].forEach(color => {
        svg.append("path")
            .datum(chartData.data)
            .attr("fill", "none")
            .attr("stroke", colors[color])
            .attr("stroke-width", 2)
            .attr("d", line.y(d => y(d[color])));
    });

    // 添加图例
    const legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "start")
        .selectAll("g")
        .data(["blue", "green", "white"])
        .enter().append("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", d => colors[d]);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => d);
}

// 绘制柱状图
function drawBarChart(selector, chartData) {
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 400 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = d3.select(selector)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 创建比例尺
    const x = d3.scaleBand()
        .domain(chartData.data.map(d => d.percentage))
        .range([0, width])
        .padding(0.2);

    // 为三个柱子创建子比例尺
    const xSubgroup = d3.scaleBand()
        .domain(["blue", "green", "white"])
        .range([0, x.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    // 添加坐标轴
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-45)");

    svg.append("g")
        .call(d3.axisLeft(y));

    // 绘制分组柱状图
    svg.append("g")
        .selectAll("g")
        .data(chartData.data)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${x(d.percentage)},0)`)
        .selectAll("rect")
        .data(d => ["blue", "green", "white"].map(key => ({ key: key, value: d[key] })))
        .enter()
        .append("rect")
        .attr("x", d => xSubgroup(d.key))
        .attr("y", d => y(d.value))
        .attr("width", xSubgroup.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => colors[d.key]);

    // 添加图例
    const legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "start")
        .selectAll("g")
        .data(["blue", "green", "white"])
        .enter().append("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", d => colors[d]);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => d);
}