const colors = {
    blue: "#4D99FF",
    green: "#00CC00",
    white: "#CCCCCC"
};

const candidates = {
    blue: "侯友宜",
    green: "賴清德",
    white: "柯文哲"
};

document.addEventListener('DOMContentLoaded', () => {
    // Add chart selector
    const chartSelector = document.createElement('select');
    chartSelector.id = 'chartSelector';
    chartSelector.innerHTML = `
        <option value="cumulativeChart1">收入累積分布</option>
        <option value="cumulativeChart2">教育程度累積分布</option>
        <option value="barChart1">各收入等級投票分布</option>
        <option value="barChart2">各教育程度投票分布</option>
    `;
    document.querySelector('#chartContainer').appendChild(chartSelector);
    
    // Add chart divs
    const charts = ['cumulativeChart1', 'cumulativeChart2', 'barChart1', 'barChart2'];
    charts.forEach(chartId => {
        const div = document.createElement('div');
        div.id = chartId;
        div.style.display = chartId === 'cumulativeChart1' ? 'block' : 'none';
        document.querySelector('#chartContainer').appendChild(div);
    });

    // Add change event listener
    chartSelector.addEventListener('change', (e) => {
        charts.forEach(chartId => {
            document.querySelector(`#${chartId}`).style.display = 
                chartId === e.target.value ? 'block' : 'none';
        });
    });

    loadElectionData();
});

async function loadElectionData() {
    try {
        const response = await fetch('data/data.json');
        const data = await response.json();
        
        const processedData = processElectionData(data);
        
        // 使用處理後的資料繪製圖表
        drawCumulativeChart("#cumulativeChart1", processedData.incomeCumulativeChart);
        drawCumulativeChart("#cumulativeChart2", processedData.educationCumulativeChart);
        drawBarChart("#barChart1", processedData.incomeDistributionChart);
        drawBarChart("#barChart2", processedData.educationDistributionChart);

    } catch (error) {
        console.error('Error loading election data:', error);
    }
}

// 處理選舉資料
function processElectionData(data) {
    // 過濾掉無效的資料項目
    const validDistricts = Object.values(data).filter(district => 
        district && 
        district.income && 
        typeof district.income.mean === 'number' &&
        district.education &&
        district.得票率 &&
        district.得票率["柯文哲"] &&
        district.得票率["賴清德"] &&
        district.得票率["侯友宜"]
    );

    // Sort districts by income and education
    const sortedByIncome = [...validDistricts].sort((a, b) => b.income.mean - a.income.mean);
    const sortedByEducation = [...validDistricts].sort((a, b) => b.education.rate - a.education.rate);

    const processed = {
        incomeCumulativeChart: {
            name: "收入累積分布",
            data: calculateCumulativeData(sortedByIncome, 'income')
        },
        educationCumulativeChart: {
            name: "教育程度累積分布",
            data: calculateCumulativeData(sortedByEducation, 'education')
        },
        incomeDistributionChart: {
            name: "各收入等級投票分布",
            data: calculateDistributionData(sortedByIncome, 'income')
        },
        educationDistributionChart: {
            name: "各教育程度投票分布",
            data: calculateDistributionData(sortedByEducation, 'education')
        }
    };

    console.log(processed.incomeCumulativeChart.data);

    return processed;
}

function calculateCumulativeData(sortedData, type) {
    const totalDistricts = sortedData.length;
    let cumulativeBlue = 0;
    let cumulativeGreen = 0;
    let cumulativeWhite = 0;
    let cumulativeTotal = 0;
    
    return sortedData.map((district, index) => {
        const percentage = ((index + 1) / totalDistricts) * 100;
        
        // Accumulate votes for each candidate
        cumulativeBlue += district.得票數["侯友宜"];
        cumulativeGreen += district.得票數["賴清德"];
        cumulativeWhite += district.得票數["柯文哲"];
        cumulativeTotal += district.得票數["柯文哲"] + district.得票數["賴清德"] + district.得票數["侯友宜"];
        
        // Calculate average cumulative percentages
        return {
            percentage: percentage.toFixed(4),
            name: district.name,
            value: type === 'income' ? district.income.mean : district.education,
            income: district.income,
            education: district.education,
            cumulativeData: {
                total: cumulativeTotal,
                blueTotal: cumulativeBlue,
                greenTotal: cumulativeGreen,
                whiteTotal: cumulativeWhite,
                bluePercentage: cumulativeBlue / cumulativeTotal * 100,
                greenPercentage: cumulativeGreen / cumulativeTotal * 100,
                whitePercentage: cumulativeWhite / cumulativeTotal * 100,
            },
        };
    });
}

function calculateDistributionData(sortedData, type) {
    return sortedData.reduce((acc, district, index) => {
        const decile = Math.floor((index / sortedData.length) * 10);
        if (!acc[decile]) {
            acc[decile] = {
                percentage: `${decile * 10}-${(decile + 1) * 10}%`,
                blue: 0,
                green: 0,
                white: 0,
                total: 0
            };
        }
        acc[decile].blue += district.得票數["侯友宜"];
        acc[decile].green += district.得票數["賴清德"];
        acc[decile].white += district.得票數["柯文哲"];
        acc[decile].total += (district.得票數["柯文哲"] + district.得票數["賴清德"] + district.得票數["侯友宜"]);
        return acc;
    }, []).map(group => ({
        percentage: group.percentage,
        total: group.total,
        blueTotal: group.blue,
        greenTotal: group.green,
        whiteTotal: group.white,
        blue: Math.round((group.blue / group.total) * 100),
        green: Math.round((group.green / group.total) * 100),
        white: Math.round((group.white / group.total) * 100),
    }))
}

function drawCumulativeChart(selector, chartData) {
    // Clear previous chart
    d3.select(selector).html('');
    
    const margin = { top: 40, right: 80, bottom: 30, left: 60 };
    const width = 800 - margin.left - margin.right;  // Increased width
    const height = 600 - margin.top - margin.bottom; // Increased height

    // Create SVG container
    const svg = d3.select(selector)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(chartData.name);

    // Create scales
    const x = d3.scaleLinear()
        .domain([0, 100])  // Percentage from 0 to 100
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([20, 45])
        .range([height, 0]);

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Create line generator with curve interpolation
    const line = d3.line()
        .x(d => x(parseFloat(d.percentage)))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

    // Draw lines for each candidate
    ["blue", "green", "white"].forEach(color => {
        svg.append("path")
            .datum(chartData.data)
            .attr("fill", "none")
            .attr("stroke", colors[color])
            .attr("stroke-width", 2)
            .attr("d", line.y(d => y(d.cumulativeData[`${color}Percentage`])));
    });

    // Add legend
    const legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "start")
        .selectAll("g")
        .data(["blue", "green", "white"])
        .enter().append("g")
        .attr("transform", (d, i) => `translate(${width + 10},${i * 20})`); // 移動到右側

    legend.append("rect")
        .attr("x", 0)  // 重設 x 位置
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", d => colors[d]);

    legend.append("text")
        .attr("x", 25)  // 調整文字位置
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => candidates[d]);
}

function drawBarChart(selector, chartData) {
    // Clear previous chart
    d3.select(selector).html('');
    
    const margin = { top: 40, right: 80, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;  // Increased width
    const height = 600 - margin.top - margin.bottom; // Increased height

    // Create SVG container
    const svg = d3.select(selector)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(chartData.name);

    // Create scales
    const x = d3.scaleBand()
        .domain(chartData.data.map(d => d.percentage))
        .range([0, width])
        .padding(0.2);

    const xSubgroup = d3.scaleBand()
        .domain(["blue", "green", "white"])
        .range([0, x.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, 50])
        .range([height, 0]);

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-45)")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em");

    svg.append("g")
        .call(d3.axisLeft(y));

    // Draw grouped bar chart
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

    // Add legend
    const legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "start")
        .selectAll("g")
        .data(["blue", "green", "white"])
        .enter().append("g")
        .attr("transform", (d, i) => `translate(${width + 10},${i * 20})`); // 移動到右側

    legend.append("rect")
        .attr("x", 0)  // 重設 x 位置
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", d => colors[d]);

    legend.append("text")
        .attr("x", 25)  // 調整文字位置
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => candidates[d]);
}