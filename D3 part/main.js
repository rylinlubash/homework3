// Load the data
const socialMedia = d3.csv("socialMedia.csv");

// Once the data is loaded, proceed with plotting
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG
    let width = 600, height = 400;

    let margin = {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
    }

    // Create the SVG container
    let svg = d3.select('#boxplot') 
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', '#eeecff')

    // Set up scales for x and y axes
    const yScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.Likes), d3.max(data, d => d.Likes)])
        .range([height - margin.bottom, margin.top]);

    const xScale = d3.scaleBand()
        .domain([...new Set(data.map(d => d.Platform))])
        .range([margin.left, width - margin.right])
        .padding(0.1);

    // Add axes     
    let yaxis = svg.append('g')
        .call(d3.axisLeft().scale(yScale))
        .attr('transform', `translate(${margin.left},0)`);

    let xaxis = svg.append('g')
        .call(d3.axisBottom().scale(xScale))
        .attr('transform', `translate(0,${height - margin.bottom})`);

    // Add x-axis label
    svg.append('text')
        .attr('x', (width - margin.right) / 2)
        .attr('y', height - 15)
        .text('Platform')

    // Add y-axis label
    svg.append('text')
        .attr('x', 0 - (height + margin.top) / 2)
        .attr('y', 20)
        .text('Likes')
        .attr('transform', 'rotate(-90)')

    // Make function to calculate summary stats for a platform
    const rollupFunction = function(groupData) {
        const values = groupData.map(d => d.Likes).sort(d3.ascending);
        const min = d3.min(values); 
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.50);
        const q3 = d3.quantile(values, 0.75);
        const max = d3.max(values);
        return { min, q1, median, q3, max};
    };

    // Run the function for each platform in the data to get the metrics needed to draw boxplot
    const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.Platform);

    // Draw box for each group
    quantilesByGroups.forEach((quantiles, Platform) => {
        const x = xScale(Platform) + margin.left;
        const boxWidth = xScale.bandwidth();  // Box width for each platform group

        // Draw vertical lines (min and max)
        svg.append('line')
            .attr('x1', x)
            .attr('y1', yScale(quantiles.min))
            .attr('x2', x)
            .attr('y2', yScale(quantiles.max))
            .attr('stroke', 'black')

        // Draw the box
        svg.append('rect')
            .attr('x', x - boxWidth / 2)
            .attr('y', yScale(quantiles.q3))
            .attr('width', boxWidth)
            .attr('height', yScale(quantiles.q1) - yScale(quantiles.q3))
            .attr("stroke", "black")
            .style("fill", "#eeecff");

        // Draw the median line
        svg.append('line')
            .attr('x1', x - boxWidth / 2)
            .attr('y1', yScale(quantiles.median))
            .attr('x2', x + boxWidth / 2)
            .attr('y2', yScale(quantiles.median))
            .attr('stroke', 'black');
    });
});


// Prepare your data and load the data again. 
// This data should contains three columns, platform, post type and average number of likes. 
const socialMediaAvg = d3.csv("socialMediaAvg.csv");

socialMediaAvg.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
      d.AvgLikes = +d.AvgLikes;
    });

    // Define the dimensions and margins for the SVG
    let width = 700, height = 400;

    let margin = {
      top: 50,
      bottom: 50,
      left: 50,
      right: 150
    }

    // Create the SVG container
    let svg = d3.select('#barplot')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
    
    // Define four scales
    // Scale x0 is for the platform, which divide the whole scale into 4 parts
    const platforms = [...new Set(data.map(d => d.Platform))]; // unique platforms

    const x0 = d3.scaleBand()
        .domain(platforms)
        .rangeRound([0, width - margin.left - margin.right])
        .paddingInner(0.2)

    // Scale x1 is for the post type, which divide each bandwidth of the previous x0 scale into three part for each post type
    const postTypes = [...new Set(data.map(d => d.PostType))]; // unique post types

    const x1 = d3.scaleBand()
        .domain(postTypes)
        .rangeRound([0, x0.bandwidth()]) // Range is the width of each platform band
        .padding(0.1)

    // Recommend to add more spaces for the y scale for the legend
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AvgLikes)])
        .range([height - margin.bottom, margin.top])

    // Also need a color scale for the post type
    const color = d3.scaleOrdinal()
        .domain(postTypes)
        .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);    
         
    // Add scales x0 and y     
    let yaxis = svg.append('g')
        .call(d3.axisLeft().scale(yScale))
        .attr('transform', `translate(${margin.left},0)`)

    let xaxis = svg.append('g')
        .call(d3.axisBottom().scale(x0))
        .attr('transform', `translate(${margin.left},${height - margin.bottom})`);    


    // Add x-axis label
        svg.append('text')
        .attr('x', (width - margin.right) / 2)
        .attr('y', height - 15)
        .text('Platform')

    // Add y-axis label
    svg.append('text')
        .attr('x', 0 - (height + margin.top + margin.bottom) / 2)
        .attr('y', 20)
        .text('Average Likes')
        .attr('transform', 'rotate(-90)')

  // Group container for bars
    const barGroups = svg.selectAll('.bar-group')
        .data(platforms)
        .enter()
        .append("g")
        .attr('class', 'bar-group')
        .attr("transform", d => `translate(${x0(d)},0)`);

  // Draw bars
    barGroups.selectAll("rect")
        .data(function(d) {
            return data.filter(item => item.Platform === d);  // Filter data for each platform
        })
        .enter()
        .append("rect")
        .attr("x", d => x1(d.PostType) + margin.left)  // Position by post type within each platform group
        .attr("y", d => yScale(d.AvgLikes))
        .attr("width", x1.bandwidth())  // Set the width for each post type
        .attr("height", d => height - margin.bottom - yScale(d.AvgLikes))  // Set the height based on average likes
        .attr("fill", d => color(d.PostType));  // Color by post type

    // Add the legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 150}, ${margin.top})`);

    const types = [...new Set(data.map(d => d.PostType))];
 
    types.forEach((type, i) => {
        legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", color(type));
    // Already have the text information for the legend. 
    // Now add a small square/rect bar next to the text with different color.
      legend.append("text")
          .attr("x", 20)
          .attr("y", i * 20 + 12)
          .text(type)
          .attr("alignment-baseline", "middle");
  });

});

// Prepare you data and load the data again. 
// This data should contains two columns, date (3/1-3/7) and average number of likes. 
const socialMediaTime = d3.csv("socialMediaTime.csv");

socialMediaTime.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
      d.AvgLikes = +d.AvgLikes;
    });

    // Define the dimensions and margins for the SVG
    let width = 600, height = 400;

    let margin = {
      top: 50,
      bottom: 80,
      left: 50,
      right: 50
    }

    // Create the SVG container
    let svg = d3.select('#lineplot')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', '#eeecff')

    // Set up scales for x and y axes  
    let yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AvgLikes)])
        .range([height - margin.bottom, margin.top])

    let xScale = d3.scaleBand()
        .domain(data.map(d=>d.Date))
        .range([margin.left, width - margin.right])    
        .padding(0.5)  
                  
    // Draw the axis, you can rotate the text in the x-axis here 
    let yaxis = svg.append('g')
        .call(d3.axisLeft().scale(yScale))
        .attr('transform', `translate(${margin.left},0)`)

    let xaxis = svg.append('g')
        .call(d3.axisBottom().scale(xScale))
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .selectAll("text") // rotate x ticks
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-25)" );

    // Add x-axis label
    svg.append('text')
        .attr('x', (width - margin.right) / 2)
        .attr('y', height - 5)
        .text('Date')

    // Add y-axis label
    svg.append('text')
        .attr('x', 0 - (height + margin.top + margin.bottom) / 2)
        .attr('y', 20)
        .text('Average # of Likes')
        .attr('transform', 'rotate(-90)')

    // Draw the line and path. Remember to use curveNatural. 
    let line = d3.line()
        .x(d => xScale(d.Date) + xScale.bandwidth() / 2)
        .y(d => yScale(d.AvgLikes))
        .curve(d3.curveNatural);

    let path = svg.append('path')
        .datum(data)
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .attr('d', line)
        .attr('fill', 'none');
});
