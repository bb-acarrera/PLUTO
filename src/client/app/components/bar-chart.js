import Ember from 'ember';
import D3 from 'd3';


export default Ember.Component.extend({
    tagName: 'svg',
    attributeBindings: 'width height'.w(),
      draw: function(){
          let data = this.get('data');
          let stack = D3.stack()
              .keys(["failed", "passed"])
              .order(D3.stackOrderNone)
              .offset(D3.stackOffsetNone);

          let stackData = stack(data);


          let margin = {top: 20, right: 20, bottom: 50, left: 40};
          let width = this.get('width') - margin.left - margin.right;
          let height = this.get('height') - margin.top - margin.bottom;

          let svg = D3.select(this.get('element'));
          let g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          let ymax = D3.max(stackData, function(y) { return D3.max(y, function(d) { return d[1]; }); });


          var x = D3.scaleBand()
              .domain(data.map((val)=>{return val.date;}))
              .rangeRound([0, width])
              .padding(0.08);

          var y = D3.scaleLinear()
              .domain([0, ymax])
              .range([height, 0]);

          var color = D3.scaleOrdinal()
              .domain(D3.range(2))
              .range(["firebrick", "forestgreen"]);

          var series = g.selectAll(".series")
              .data(stackData)
              .enter().append("g")
              .attr("fill", function(d, i) { return color(i); });


          var rect = series.selectAll("rect")
              .data(function(d) { return d; })
              .enter().append("rect")
              .attr("x", function(d) { return x(d.data.date); })
              .attr("y", function (d) {return y(d[1]);})
              .attr("width", x.bandwidth())
              .attr("height", 0);

          rect.transition()
              .delay(function(d, i) { return i * 10; })
              .attr("y", function(d) { return y(d[1]); })
              .attr("height", function(d) { return y(d[0]) - y(d[1]); });

          rect.append("title")
              .html(function(d){
                  return "For " + (d.data.buckets?(d.data.start + " to " + d.data.end ): d.data.date) + "<br> " + (d.data.passed>0?"Successes: " + d.data.passed + " ": "") + (d.data.failed>0? "Failures: " + d.data.failed: "");
              });

          g.append("g")
              .attr("class", "axis axis--x")
              .attr("transform", "translate(0," + height + ")")
              .call(D3.axisBottom(x)
                  .tickSize(0)
                  .tickPadding(6));

          g.append("g")
              .attr("class", "axis axis--y")
              .call(D3.axisLeft(y));

          y.domain([0, ymax]);

          // rect.transition()
          //     .duration(500)
          //     .delay(function(d, i) { return i * 10; })
          //     .attr("y", function(d) { return y(d[1]); })
          //     .attr("height", function(d) { return y(d[0]) - y(d[1]); })
          //     .transition();

      }.on('didInsertElement'),

      redraw: function(){
          var svg = D3.select(this.get('element'));
          svg.selectAll('*').remove();
          this.draw();
      }.observes('data.@each.frequency')
});
