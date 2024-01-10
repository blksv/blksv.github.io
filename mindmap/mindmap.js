import "./cola.min.js";
import "./d3.js";
import {parse} from "./parser.js";

let map = null;
let line = null;

let state = {
    editing: false,
    activeTab: 'mindmap'
};

function setClass(elem, classname, cond) {
    elem.classList[cond ? 'add' : 'remove'](classname);
};

export
function setState(s) {
    state = {...state, ...s};
    setClass(mindmapInputLabel, "active", state.activeTab == 'mindmap');
    setClass(donateTabLabel, "active", state.activeTab == 'donate');
    setClass(mindmapTab, "hidden", state.activeTab != 'mindmap');
    setClass(donateTab, "hidden", state.activeTab != 'donate');
}

let zoom = d3.zoom()
    .scaleExtent([0.1, 1])
    //.translateExtent([[0, 0], [Infinity, Infinity]])
    .on("zoom", (e) => {d3.select(dia).attr("transform", e.transform)});
d3.select(mindmap).call(zoom);

export
function resetZoom() {
	d3.select(mindmap)
		.transition()
		.call(zoom.scaleTo, 1);
}

export
function center() {
    let rect = mindmap.getBoundingClientRect();
	d3.select(mindmap)
		.transition()
		.call(zoom.translateTo, 0.5 * rect.width, 0.5 * rect.height);
}

function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0, //parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
            }
        }
    });
}

export
function updateMindmap() {
    setState(state);
    const res = parse(mindmapInput.value);

    // const svg = d3.select("#mindmap")
    //     .attr("width", rect.width)
    //     .attr("height", rect.height);

    const svg = d3.select(dia);
    svg.selectAll("*").remove();
    svg.append('svg:defs').append('svg:marker')
            .attr('id','end-arrow')
            .attr('viewBox','0 -5 10 10')
            .attr('refX',8)
            .attr('markerWidth',6)
            .attr('markerHeight',6)
            .attr('orient','auto')
            .append('svg:path')
                .attr('d','M0,-5L10,0L0,5L2,0')
                .attr('stroke-width','0px')
                .attr('fill','#000');


    const link = svg.selectAll(".link")
        .data(res.links)
        .enter()
        .filter(d => d.kind != "dummy")
        .append("path")
        .attr("class", "link")
        .classed("far-link", d => d.kind == "far")
        .classed("sibling-link", d => d.kind == "sibling");

    const pad = 3;
    const margin = 3;

    const node = svg.selectAll(".node")
        .data(res.items)
        .enter()
        .append("svg")
        .call(s => {
            s.append("rect")
             .attr("class", "node")
             .attr("rx", 5)
             .attr("ry", 5)
             .attr("data-pos", function (d) { return d.cursorPos; })
             .append("title")
                .text(function (d) { return d.content; });

            s.append("text")
             .attr("x", margin)
             .attr("y", margin)
             .attr("class", "label")
             .text(function (d) { return d.name; })
             .call(wrap, 200);
        })
        .each(function (d) {
            var b = this.getBBox();
            var extra = 2*margin + 2 * pad;
            d.width = b.width + extra;
            d.height = b.height + extra;

            d3.select(this).select("rect")
                .attr("width", b.width + 2*pad)
                .attr("height", b.height + 2*pad);
            d3.select(this).select("text")
                .attr("width", b.width)
                .attr("height", b.height);
        });

    svg.selectAll(".node").on("click", function (e) {
        console.log(e)
        mindmapInput.focus();
        mindmapInput.setSelectionRange(e.target.getAttribute("data-pos"),e.target.getAttribute("data-pos"));
     })


    res.constraints.forEach(c => {
        if (c.axis == "x")
            c.gap += res.items[c.left].width/2 + res.items[c.right].width/2;
        if (c.axis == "y")
            c.gap += res.items[c.left].height/2 + res.items[c.right].height/2;
    });

    let rect = mindmap.getBoundingClientRect();
    const engine = cola.d3adaptor(d3)
        .size([rect.width, rect.height])
        //.linkDistance(50)
        //.flowLayout('x', 150)
        .symmetricDiffLinkLengths(25, 0.9)
        //.linkDistance(d => d.kind == "sibling" ? 15 :  d.kind == "child" ? 50 : 100)
        //.jaccardLinkLengths(30)
        .avoidOverlaps(true)
        .nodes(res.items)
        .links(res.links)
        .constraints(res.constraints);


    const lineFunction = d3.line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; });

    function draw() {
        // link.attr("x1", function (d) { return d.source.x; })
        //     .attr("y1", function (d) { return d.source.y; })
        //     .attr("x2", function (d) { return d.target.x; })
        //     .attr("y2", function (d) { return d.target.y; });

        // label
        //     .attr("x", function (d) { return d.x; })
        //     .attr("y", function (d) {
        //         var h = this.getBBox().height;
        //         return d.y + h/4;
        //     });

        node
            .each(function (d) { d.innerBounds = d.bounds.inflate(0); })
            //.attr("width", function (d) { return d.innerBounds.width(); })
            //.attr("height", function (d) { return d.innerBounds.height(); })
            .attr("width", function (d) { return d.width; })
            .attr("height", function (d) { return d.height; })
            .attr("x", function (d) { return d.x - d.width / 2 + pad; })
            .attr("y", function (d) { return d.y - d.height / 2 + pad; });


        // group.attr("x", function (d) { return d.bounds.x; })
        //      .attr("y", function (d) { return d.bounds.y; })
        //     .attr("width", function (d) { return d.bounds.width(); })
        //     .attr("height", function (d) { return d.bounds.height(); });


    }


    engine
        .on("tick", function () {
        })
        .on("end", function () {
            draw();

            engine.prepareEdgeRouting();
            console.log(res.items);
            link
                .attr("d", function (d) {
                    if (d && d.kind != "sibling")
                        try {
                            return lineFunction(engine.routeEdge(d, margin));
                        } catch (e) {
                            return null;
                        }
                })
        })
        .start(150,50,50,50);

    //while (!engine.tick()) {};
    //draw();


  //jsonOutput.innerHTML = JSON.stringify(res, null, 4);
};
