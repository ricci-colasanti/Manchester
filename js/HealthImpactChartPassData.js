console.log("PAssdata"); // Logging a message to the console for debugging purposes

/**
 * Class representing a Health Impact Chart that visualizes mean and standard deviation data.
 */
class HealthImpactChartPassData {
    /**
     * Constructs a HealthImpactChartPassData instance.
     * @param {string} containerId - The ID of the container where the chart will be rendered.
     * @param {Array} meanData - The mean data to be visualized.
     * @param {Array} stdData - The standard deviation data to be visualized.
     * @param {Array} allGroup - The groups of data to be visualized.
     * @param {string} xFeature - The feature to be used for the x-axis.
     * @param {Array} color - The colors to be used for each group.
     * @param {string} xAxisLable - The label for the x-axis.
     * @param {string} yAxisLable - The label for the y-axis.
     * @param {Array} xRange - The range for the x-axis.
     * @param {Array} yRange - The range for the y-axis.
     */
    constructor(containerId, meanData, stdData, allGroup, xFeature, color, xAxisLable, yAxisLable, xRange, yRange) {
        this.containerId = containerId; // ID of the container
        this.allGroup = allGroup; // All groups of data
        this.color = color; // Colors for each group
        this.xAxisLable = xAxisLable; // Label for the x-axis
        this.yAxisLable = yAxisLable; // Label for the y-axis
        this.xFeature = xFeature; // Feature for the x-axis
        this.meanData = []; // Mean data
        this.stdData = []; // Standard deviation data
        this.xRange = xRange; // Range for the x-axis
        this.yRange = yRange; // Range for the y-axis
        this.line = []; // Lines for each group
        this.dot = []; // Dots for each group
        this.area = []; // Areas for each group

        // Margins for the SVG
        this.margin = { top: 10, right: 10, bottom: 50, left: 180 };
        // Calculate width and height of the chart
        this.width = document.getElementById(containerId).clientWidth - this.margin.left - this.margin.right;
        this.height = this.width * 0.35;

        // Create SVG element
        this.svg = d3.select(`#${containerId}`)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        // Define x and y scales
        this.x = d3.scaleLinear()
            .domain(this.xRange)
            .range([0, this.width]);

        this.y = d3.scaleLinear()
            .domain(this.yRange)
            .range([this.height, 0]);

        // Initialize tooltip
        this.tooltip = d3.select(".tooltip");

        // Initialize axes and chart
        this.initializeAxes();
        this.meanData = meanData;
        this.stdData = stdData;
        this.initializeChart();
        this.update(0, this.color);
    }

    /**
     * Initializes the x and y axes.
     */
    initializeAxes() {
        // Create x-axis
        //const xAxis = d3.axisBottom(this.x).tickFormat(d => d.toString().replace(',', ''));
        // Assuming this.xRange is an array of your domain values
        const tickValues = d3.range(this.xRange[0], this.xRange[1], 2); // Adjust the step as needed
        const xAxis = d3.axisBottom(this.x)
                .tickValues(tickValues) // Specify the exact tick values
                .tickFormat(d => d.toString().replace(',', '')); // Format the ticks as needed
        
        this.svg.append("g")
            .attr("transform", `translate(0,${this.height})`)
            .attr("class", "x-axis")
            .call(xAxis);

        // Add x-axis label
        this.svg.append("text")
            .attr("x", this.width / 2)
            .attr("y", this.height + 40)
            .attr("text-anchor", "middle")
            .text(this.xAxisLable);

        // Create y-axis
        this.svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(this.y));

        // Add y-axis label
        this.svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -this.height / 2)
            .attr("y", -60)
            .attr("text-anchor", "middle")
            .text(this.yAxisLable);
    }

    /**
     * Initializes the chart by creating lines, areas, and dots for each group.
     */
    initializeChart() {
        this.allGroup.forEach((group, index) => {
            // Line for the group
            const line = this.svg.append("path")
                .data(this.meanData)
                .attr("d", d3.line()
                    .x(d => this.x(+d[this.xFeature]))
                    .y(d => this.y(+d[group[0]]))
                )
                .attr("stroke", this.color[index])
                .style("stroke-width", 1)
                .style("fill", "none");

            // Area for the group
            const area = this.svg.append("path")
                .attr("class", "area")
                .style("fill", this.color[index])
                .style("opacity", 0.2);

            // Dots for the group
            const dot = this.svg.selectAll(`.dot-${index}`)
                .data(this.meanData)
                .join("circle")
                .attr("class", `dot-${index}`)
                .attr("cx", d => this.x(+d[this.xFeature]))
                .attr("cy", d => this.y(+d[group[0]]))
                .attr("r", 3)
                .style("fill", this.color[index])
                .on('mouseover', (event, d) => {
                    this.tooltip.style("opacity", 1)
                        .html(`Value: ${d3.format('.3r')(d.value)} <br>Stdev ${d3.format('.3r')(d.std)}`)
                        .style("left", `${event.pageX + 5}px`)
                        .style("top", `${event.pageY - 20}px`);
                        d3.select(event.currentTarget).style("cursor", "pointer");
                })
                .on("mousemove", event => {
                    this.tooltip.style("left", `${event.pageX + 5}px`)
                        .style("top", `${event.pageY - 20}px`);
                })
                .on("mouseout", event => {
                    d3.select(event.currentTarget).style("cursor", "default");
                    this.tooltip.style("opacity", 0)
                });

            this.line.push(line);
            this.area.push(area);
            this.dot.push(dot);
        });
    }

    /**
     * Updates the chart with new data and colors.
     * @param {number} selectedGroup - The index of the selected group.
     * @param {Array} color - The new colors for the groups.
     */
    update(selectedGroup, color) {
        this.allGroup.forEach((group, index) => {
            const dataFilter = this.meanData.map(d => ({
                year: d.year,
                value: d[group[selectedGroup]],
                std: this.stdData.find(sd => sd.year === d.year)[group[selectedGroup]]
            }));

            // Update the line
            this.line[index]
                .datum(dataFilter)
                .transition().duration(500)
                .attr("d", d3.line()
                    .x(d => this.x(+d[this.xFeature]))
                    .y(d => this.y(+d.value))
                )
                .style("stroke", color[index]);

            // Update the area
            this.area[index]
                .datum(dataFilter)
                .transition().duration(500)
                .attr("d", d3.area()
                    .x(d => this.x(+d[this.xFeature]))
                    .y0(d => this.y(+d.value - d.std * 1.0))
                    .y1(d => this.y(+d.value + d.std * 1.0))
                )
                .style("fill", color[index]);

            // Update the dots
            this.dot[index]
                .data(dataFilter)
                .transition().duration(500)
                .attr("cx", d => this.x(+d[this.xFeature]))
                .attr("cy", d => this.y(+d.value))
                .style("fill", color[index]);
        });
    }

    /**
     * Calculates the sum of a specific feature in the mean data.
     * @param {string} feature - The feature to sum.
     * @returns {number} The sum of the feature values.
     */
    sum(feature) {
        return d3.sum(this.meanData, d => d[feature]);
    }
}