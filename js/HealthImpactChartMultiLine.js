class HealthImpactChartMultiLine {
    constructor(containerId, meanFile, stdFile, allGroup, xFeature, color, xAxisLable, yAxisLable, xRange, yRange) {
        this.containerId = containerId;
        this.meanFile = meanFile;
        this.stdFile = stdFile;
        this.allGroup = allGroup;
        this.color = color;
        this.xAxisLable = xAxisLable;
        this.yAxisLable = yAxisLable;
        this.xFeature = xFeature;
        this.meanData = [];
        this.stdData = [];
        this.xRange = xRange;
        this.yRange = yRange;
        this.line = [];
        this.dot = [];
        this.area = [];

        this.margin = { top: 10, right: 30, bottom: 50, left: 80 };
        this.width = document.getElementById(containerId).clientWidth - this.margin.left - this.margin.right;
        this.height = this.width * 0.6;

        this.svg = d3.select(`#${containerId}`)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        this.x = d3.scaleLinear()
            .domain(this.xRange)
            .range([0, this.width]);

        this.y = d3.scaleLinear()
            .domain(this.yRange)
            .range([this.height, 0]);

        this.tooltip = d3.select(".tooltip");

        this.initializeAxes();
        this.loadDataAndInitializeChart();
    }

    initializeAxes() {
        const xAxis = d3.axisBottom(this.x).tickFormat(d => d.toString().replace(',', ''));
        this.svg.append("g")
            .attr("transform", `translate(0,${this.height})`)
            .attr("class", "x-axis")
            .call(xAxis);

        this.svg.append("text")
            .attr("x", this.width / 2)
            .attr("y", this.height + 40)
            .attr("text-anchor", "middle")
            .text(this.xAxisLable);

        this.svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(this.y));

        this.svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -this.height / 2)
            .attr("y", -60)
            .attr("text-anchor", "middle")
            .text(this.yAxisLable);
    }

    loadDataAndInitializeChart() {
        Promise.all([
            d3.csv(this.meanFile),
            d3.csv(this.stdFile),
        ]).then(([meanData, stdData]) => {
            this.meanData = meanData;
            this.stdData = stdData;
            this.initializeChart();
            this.update(0, this.color);
        }).catch(error => {
            console.error("Error loading data:", error);
        });
    }

    initializeChart() {
        this.allGroup.forEach((group, index) => {
            // Line for the group
            const line = this.svg.append("path")
                .data(this.meanData)
                .attr("d", d3.line()
                    .x(d => this.x(+d[this.xFeature]))
                    .y(d => this.y(+d[group[0]]))
                )
                .attr("stroke", this.color)
                .style("stroke-width", 1)
                .style("fill", "none");

            // Area for the group
            const area = this.svg.append("path")
                .attr("class", "area")
                .style("fill", this.color)
                .style("opacity", 0.2);

            // Dots for the group
            const dot = this.svg.selectAll(`.dot-${index}`)
                .data(this.meanData)
                .join("circle")
                .attr("class", `dot-${index}`)
                .attr("cx", d => this.x(+d[this.xFeature]))
                .attr("cy", d => this.y(+d[group[0]]))
                .attr("r", 5)
                .style("fill", this.color)
                .on('mouseover', (event, d) => {
                    this.tooltip.style("opacity", 1)
                        .html(`Value: ${d3.format('.2r')((d.value))}`)
                        .style("left", `${event.pageX + 5}px`)
                        .style("top", `${event.pageY - 20}px`);
                })
                .on("mousemove", event => {
                    this.tooltip.style("left", `${event.pageX + 5}px`)
                        .style("top", `${event.pageY - 20}px`);
                })
                .on("mouseout", () => this.tooltip.style("opacity", 0));

            this.line.push(line);
            this.area.push(area);
            this.dot.push(dot);
        });
    }

    update(selectedGroup, color) {
        this.allGroup.forEach((group, index) => {
            const dataFilter = this.meanData.map(d => ({
                year: d.year,
                value: d[group[selectedGroup]],
                std: this.stdData.find(sd => sd.year === d.year)[group[selectedGroup]]
            }));

            // Update the line
            this.line[index]
                .data(dataFilter)
                .transition().duration(500)
                .attr("d", d3.line()
                    .x(d => this.x(+d[this.xFeature]))
                    .y(d => this.y(+d.value))
                )
                .style("stroke", color);

            // Update the area
            this.area[index]
                .datum(dataFilter)
                .transition().duration(500)
                .attr("d", d3.area()
                    .x(d => this.x(+d[this.xFeature]))
                    .y0(d => this.y(+d.value - d.std * 1.0))
                    .y1(d => this.y(+d.value + d.std * 1.0))
                )
                .style("fill", color);

            // Update the dots
            this.dot[index]
                .data(dataFilter)
                .transition().duration(500)
                .attr("cx", d => this.x(+d[this.xFeature]))
                .attr("cy", d => this.y(+d.value))
                .style("fill", color);
        });
    }
}