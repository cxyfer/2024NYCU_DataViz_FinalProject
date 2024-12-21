const colors = {
    blue: "#4D99FF",
    green: "#00CC00",
    white: "red"
};

const candidates = {
    blue: "侯友宜",
    green: "賴清德",
    white: "柯文哲"
};

document.addEventListener('DOMContentLoaded', () => {
    // Add chart divs
    const charts = ['cumulativeChart1', 'cumulativeChart2', 'barChart1', 'barChart2'];
    charts.forEach(chartId => {
        const div = document.createElement('div');
        div.id = chartId;
        div.style.display = chartId === 'cumulativeChart1' ? 'block' : 'none';
        document.querySelector('#chartContainer').appendChild(div);
    });

    document.querySelector('#rangeInputs').style.display = 'block';

    // Add change event listener for chart selector
    document.querySelector('#chartSelector').addEventListener('change', (e) => {
        const selectedChart = e.target.value;
        charts.forEach(chartId => {
            document.querySelector(`#${chartId}`).style.display = 
                chartId === selectedChart ? 'block' : 'none';
        });
        
        // Show/hide range inputs based on chart type
        const rangeInputs = document.querySelector('#rangeInputs');
        rangeInputs.style.display = selectedChart.includes('cumulative') ? 'block' : 'none';
        
        // Show/hide range inputs based on chart type
        const groupsInputs = document.querySelector('#groupsInputs');
        groupsInputs.style.display = selectedChart.includes('barChart') ? 'block' : 'none';

        // Reset range inputs to default values
        if (selectedChart.includes('cumulative')) {
            document.querySelector('#startRange').value = 0;
            document.querySelector('#endRange').value = 100;
            
            // Redraw the chart with reset range
            const chartData = selectedChart === 'cumulativeChart1' ? 
                processedDataGlobal.incomeCumulativeChart :
                processedDataGlobal.educationCumulativeChart;
            drawCumulativeChart(`#${selectedChart}`, chartData, 0, 100);
        }

        // Reset groups inputs to default values
        if (selectedChart.includes('barChart')) {
            document.querySelector('#groupsNum').value = 10;
            if (selectedChart === 'barChart1') {
                processedDataGlobal.incomeDistributionChart.data = calculateDistributionData(sortedByIncome, 10);
                drawBarChart("#barChart1", processedDataGlobal.incomeDistributionChart);
            }
            else if (selectedChart === 'barChart2') {
                processedDataGlobal.educationDistributionChart.data = calculateDistributionData(sortedByEducation, 10);
                drawBarChart("#barChart2", processedDataGlobal.educationDistributionChart);
            }
        }
    });

    // Add click event listener for range update button
    document.querySelector('#updateRange').addEventListener('click', () => {
        const start = parseInt(document.querySelector('#startRange').value);
        const end = parseInt(document.querySelector('#endRange').value);
        const selectedChart = document.querySelector('#chartSelector').value;
        
        // Get the current chart data
        const chartData = selectedChart === 'cumulativeChart1' ? 
            processedDataGlobal.incomeCumulativeChart :
            processedDataGlobal.educationCumulativeChart;
        
        // Redraw the chart with new range
        drawCumulativeChart(`#${selectedChart}`, chartData, start, end);
    });

    // Add click event listener for range update button
    document.querySelector('#updateGroups').addEventListener('click', () => {
        const groupNum = parseInt(document.querySelector('#groupsNum').value);
        const selectedChart = document.querySelector('#chartSelector').value;
        if (selectedChart === 'barChart1') {
            processedDataGlobal.incomeDistributionChart.data = calculateDistributionData(sortedByIncome, groupNum);
            drawBarChart("#barChart1", processedDataGlobal.incomeDistributionChart);
        }
        else if (selectedChart === 'barChart2') {
            processedDataGlobal.educationDistributionChart.data = calculateDistributionData(sortedByEducation, groupNum);
            drawBarChart("#barChart2", processedDataGlobal.educationDistributionChart);
        }
    });

    loadElectionData();
});

// Add global variable to store processed data
let processedDataGlobal;
let sortedByIncome, sortedByEducation;

async function loadElectionData() {
    try {
        const response = await fetch('data/data.json');
        const data = await response.json();
        
        processedDataGlobal = processElectionData(data);
        
        // 使用處理後的資料繪製圖表
        drawCumulativeChart("#cumulativeChart1", processedDataGlobal.incomeCumulativeChart);
        drawCumulativeChart("#cumulativeChart2", processedDataGlobal.educationCumulativeChart);
        drawBarChart("#barChart1", processedDataGlobal.incomeDistributionChart);
        drawBarChart("#barChart2", processedDataGlobal.educationDistributionChart);

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
        typeof district.income.median === 'number' &&
        district.education &&
        district.得票率 &&
        district.得票率["柯文哲"] &&
        district.得票率["賴清德"] &&
        district.得票率["侯友宜"]
    );

    // Sort districts by income and education
    sortedByIncome = [...validDistricts].sort((a, b) => b.income.median - a.income.median);
    sortedByEducation = [...validDistricts].sort((a, b) => b.education.rate - a.education.rate);

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
            data: calculateDistributionData(sortedByIncome, 10)
        },
        educationDistributionChart: {
            name: "各教育程度投票分布",
            data: calculateDistributionData(sortedByEducation, 10)
        }
    };
    
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
            value: type === 'income' ? district.income.median : district.education,
            income: district.income,
            education: district.education,
            originalData: {
                blue: district.得票數["侯友宜"],
                green: district.得票數["賴清德"],
                white: district.得票數["柯文哲"],
                total: district.得票數["柯文哲"] + district.得票數["賴清德"] + district.得票數["侯友宜"],
            },
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

function calculateDistributionData(sortedData, groupNum=10) {
    const perGroup = 100 / groupNum;
    return sortedData.reduce((acc, district, index) => {
        const decile = Math.floor((index / sortedData.length) * groupNum);
        if (!acc[decile]) {
            acc[decile] = {
                percentage: `${(decile * perGroup).toFixed(1)}-${((decile + 1) * perGroup).toFixed(1)}%`,
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
        blue: (group.blue / group.total) * 100,
        green: (group.green / group.total) * 100,
        white: (group.white / group.total) * 100,
    }))
}

function drawCumulativeChart(selector, chartData, start=0, end=100) {
    // Clear previous chart
    d3.select(selector).html('');
    
    // Filter data based on start and end percentages
    const filteredData = chartData.data.filter(d => {
        const percentage = parseFloat(d.percentage);
        return percentage >= start && percentage <= end;
    });

    // Recalculate cumulative percentages for filtered data
    let min = 100, max = 0;
    let cumulativeBlue = 0;
    let cumulativeGreen = 0;
    let cumulativeWhite = 0;
    let cumulativeTotal = 0;
    
    const recalculatedData = filteredData.map(d => {
        // Add current district's votes
        cumulativeBlue += d.originalData.blue;
        cumulativeGreen += d.originalData.green;
        cumulativeWhite += d.originalData.white;
        cumulativeTotal += d.originalData.total;

        max = Math.max(max, cumulativeBlue / cumulativeTotal * 100, cumulativeGreen / cumulativeTotal * 100, cumulativeWhite / cumulativeTotal * 100);
        min = Math.min(min, cumulativeBlue / cumulativeTotal * 100, cumulativeGreen / cumulativeTotal * 100, cumulativeWhite / cumulativeTotal * 100);

        return {
            ...d,
            cumulativeData: {
                ...d.cumulativeData,
                total: cumulativeTotal,
                blueTotal: cumulativeBlue,
                greenTotal: cumulativeGreen,
                whiteTotal: cumulativeWhite,
                bluePercentage: (cumulativeBlue / cumulativeTotal) * 100,
                greenPercentage: (cumulativeGreen / cumulativeTotal) * 100,
                whitePercentage: (cumulativeWhite / cumulativeTotal) * 100,
            }
        };
    });

    // console.log(recalculatedData);

    const margin = { top: 60, right: 80, bottom: 60, left: 30 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create SVG container
    const svg = d3.select(selector)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add title with larger font
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text(chartData.name);

    // Create scales
    const x = d3.scaleLinear()
        .domain([start, end])  // Percentage from 0 to 100
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([min * 0.9, max * 1.1])
        .range([height, 0]);

    // Add axes with larger font
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .style("font-size", "12px");

    svg.append("g")
        .call(d3.axisLeft(y))
        .style("font-size", "12px");

    // Create line generator with curve interpolation
    const line = d3.line()
        .x(d => x(parseFloat(d.percentage)))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

    // Draw lines for each candidate
    ["blue", "green", "white"].forEach(color => {
        svg.append("path")
            .datum(recalculatedData)  // Use recalculated data
            .attr("fill", "none")
            .attr("stroke", colors[color])
            .attr("stroke-width", 2)
            .attr("d", line.y(d => y(d.cumulativeData[`${color}Percentage`])));
    });

    // Add legend
    const legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", "14px")
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

    // Add tooltip div
    const tooltip = d3.select(selector)
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "4px")
        .style("padding", "8px")
        .style("pointer-events", "none")
        .style("z-index", "1000");  // 確保 tooltip 顯示在最上層

    // 添加一個透明的覆蓋層來捕捉滑鼠事件
    const overlay = svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all");

    // 添加輔助線
    const guideline = svg.append("line")
        .attr("class", "guideline")
        .attr("y1", 0)
        .attr("y2", height)
        .style("stroke", "#999")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0);

    // 在覆蓋層上添加標移動事件
    overlay.on("mousemove", function() {
        const mouseX = d3.mouse(this)[0];
        const xValue = x.invert(mouseX);
        
        // 找出最接近的數據點
        const bisect = d3.bisector(d => parseFloat(d.percentage)).left;
        const index = bisect(recalculatedData, xValue);  // Use recalculated data
        const d = recalculatedData[index];
        
        if (d) {
            // 更新輔助線位置
            guideline
                .attr("x1", x(parseFloat(d.percentage)))
                .attr("x2", x(parseFloat(d.percentage)))
                .style("opacity", 1);

            // 更新 tooltip
            const tooltipContent = `
                <strong>${d.name}</strong><br/>
                累積百分比: ${d.percentage}%<br/>
                所得中位數: ${(d.income.median / 10).toFixed(2)}萬元<br/>
                所得平均數: ${(d.income.mean / 10).toFixed(2)}萬元<br/>
                大學以上人口比例: ${(d.education.rate * 100).toFixed(2)}%<br/>
                <hr/>
                <strong>該地區得票率：</strong><br/>
                <span style="color: ${colors.blue}">${candidates.blue}</span>: ${(d.originalData.blue / d.originalData.total * 100).toFixed(2)}%<br/>
                <span style="color: ${colors.green}">${candidates.green}</span>: ${(d.originalData.green / d.originalData.total * 100).toFixed(2)}%<br/>
                <span style="color: ${colors.white}">${candidates.white}</span>: ${(d.originalData.white / d.originalData.total * 100).toFixed(2)}%
                <hr/>
                <strong>累積得票率：</strong><br/>
                <span style="color: ${colors.blue}">${candidates.blue}</span>: ${d.cumulativeData.blueTotal} / ${d.cumulativeData.total} = ${d.cumulativeData.bluePercentage.toFixed(2)}%<br/>
                <span style="color: ${colors.green}">${candidates.green}</span>: ${d.cumulativeData.greenTotal} / ${d.cumulativeData.total} = ${d.cumulativeData.greenPercentage.toFixed(2)}%<br/>
                <span style="color: ${colors.white}">${candidates.white}</span>: ${d.cumulativeData.whiteTotal} / ${d.cumulativeData.total} = ${d.cumulativeData.whitePercentage.toFixed(2)}%<br/>
                <hr/>
            `;
            
            // 取得視窗尺寸
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            // 取得 tooltip 的尺寸
            tooltip.html(tooltipContent);
            const tooltipNode = tooltip.node();
            const tooltipWidth = tooltipNode.offsetWidth;
            const tooltipHeight = tooltipNode.offsetHeight;
            
            // 計算 tooltip 位置
            const svgNode = svg.node().parentNode;
            const svgRect = svgNode.getBoundingClientRect();
            let left = svgRect.left + x(parseFloat(d.percentage)) + margin.left;
            let top = d3.event.pageY;
            
            // 確保 tooltip 不會超出右側邊界
            if (left + tooltipWidth > windowWidth) {
                left = left - tooltipWidth - 20;
            }
            
            // 確保 tooltip 不會超出底部邊界
            if (top + tooltipHeight > windowHeight) {
                top = top - tooltipHeight - 20;
            }
            
            // 設定 tooltip 置
            tooltip
                .style("left", `${left}px`)
                .style("top", `${top}px`)
                .style("opacity", 1);
        }
    })
    .on("mouseleave", function() {
        guideline.style("opacity", 0);
        tooltip.style("opacity", 0);
    });
}

function drawBarChart(selector, chartData) {
    // Clear previous chart
    d3.select(selector).html('');
    
    const margin = { top: 60, right: 80, bottom: 60, left: 30 };
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
        .style("font-size", "20px")
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

    // Add axes with larger font
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "12px")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-45)")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em");

    svg.append("g")
        .call(d3.axisLeft(y))
        .style("font-size", "12px");

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
        .attr("font-size", "14px")
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