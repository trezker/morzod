"use strict";

var Mapgen = Mapgen || {};

var Dictionary = function() {
    this.keys = [];
    this.values = [];
}

Dictionary.prototype.set = function (key, value) {
	var index = this.keys.indexOf(key);
	if(index == -1) {
		this.keys.push(key);
		this.values.push(value);
	}
	else {
		this.values[index] = value;
	}
}

Dictionary.prototype.get = function (key) {
	return this.values[this.keys.indexOf(key)];
}

Mapgen.Map = function () {
	this.size = 2048;
	this.seed = 0;
	this.numpoints = 10;
	this.reset();

	// Generate the initial random set of points
	this.stages = [
		[
			"Place points...",
			function(map) {
				map.reset();
				map.points = generateRelaxed(map.numpoints, map.size, map.seed);
			},
			render_graph
		],
		[
			"Build graph...",
			function(map) {
				buildGraph(map);
				improveCorners(map);
			},
			function(map) {}
		]
	];
	console.log("const");
};

Mapgen.Map.prototype.reset = function () {
	this.stage = 0;
	this.points = [];
	this.edges = [];
	this.centers = [];
	this.corners = [];
};

Mapgen.Map.prototype.run_stage = function () {
	this.stages[this.stage][1](this);
	this.stage++;
	if(this.stage === this.stages.length) {
		return false;
	}
	return true;
};

Mapgen.Map.prototype.render = function (globj) {
	this.stages[this.stage-1][2](this, globj);
};

var render_graph = function(map, globj) {
	var gl = globj.gl;

	//Prepare data for rendering
    var points = [];
	for(var p in map.points) {
		points.push(map.points[p].x);
		points.push(map.points[p].y);
		points.push(0);
	}
	var voronoi = new Voronoi();
	var diagram = voronoi.compute(map.points, {xl: 0, xr: map.size, yt: 0, yb: map.size});
	var edges = [];
	for(var e in diagram.edges) {
		var ed = diagram.edges[e];
		edges.push(ed.va.x);
		edges.push(ed.va.y);
		edges.push(0);
		edges.push(ed.vb.x);
		edges.push(ed.vb.y);
		edges.push(0);
	}

	//Initialize shaders
	var vertCode = 'attribute vec3 aVertexPosition;'+
		'uniform mat4 uMVMatrix;'+
		'uniform mat4 uPMatrix;'+
		'void main(void) {'+
		'	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);'+
		'	gl_PointSize = 2.0;'+
		'}';
	var fragCode = 'void main(void) {' +
			'gl_FragColor = vec4(0, 0, 0, 1);' +
		'}';
	globj.shaderProgram = createShaderProgram(gl, vertCode, fragCode);
	gl.useProgram(globj.shaderProgram);

	//Setup view and clear it
	gl.clearColor(0.9, 0.9, 0.9, 1);
	gl.enable(gl.DEPTH_TEST);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

	//Set up perspective
	mat4.ortho(globj.pMatrix, 0, map.size, map.size, 0, 0.0, 10);

	//Set up transformation
	mat4.identity(globj.mvMatrix);
	
	//Set projection and transformation
    var pMatrixUniform = gl.getUniformLocation(globj.shaderProgram, "uPMatrix");
    var mvMatrixUniform = gl.getUniformLocation(globj.shaderProgram, "uMVMatrix");
	gl.uniformMatrix4fv(pMatrixUniform, false, globj.pMatrix);
	gl.uniformMatrix4fv(mvMatrixUniform, false, globj.mvMatrix);

	//Setup buffer and draw points
	var vertex_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
	var vertexPositionAttribute = gl.getAttribLocation(globj.shaderProgram, "aVertexPosition");
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPositionAttribute);
	gl.drawArrays(gl.POINTS, 0, map.points.length);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	//Setup buffer and draw edges
	var edge_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, edge_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(edges), gl.STATIC_DRAW);
	var vertexPositionAttribute = gl.getAttribLocation(globj.shaderProgram, "aVertexPosition");
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPositionAttribute);
	gl.drawArrays(gl.LINES, 0, diagram.edges.length * 2);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

var createShaderProgram = function(gl, vertCode, fragCode) {
	var vertShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertShader, vertCode);
	gl.compileShader(vertShader);
	if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
		console.log(gl.getShaderInfoLog(vertShader));
		return null;
	}
	
	var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragShader, fragCode);
	gl.compileShader(fragShader);
	if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
		console.log(gl.getShaderInfoLog(fragShader));
		return null;
	}

	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertShader); 
	gl.attachShader(shaderProgram, fragShader);
	gl.linkProgram(shaderProgram);
	return shaderProgram;
}

// Generate points at random locations
var generateRandom = function (numPoints, size, seed) {
	var padding = 16;
	var mapRandom = new MersenneTwister(seed);
	var points = [];
	for (var i = 0; i < numPoints; i++) {
		var p = new Mapgen.Point(mapRandom.range(padding, size-padding), 
			mapRandom.range(padding, size-padding));
		points.push(p);
	}
	return points;
};

var NUM_LLOYD_RELAXATIONS = 2;
var generateRelaxed = function (numPoints, size, seed) {
	// Lloyd Relaxation: move each point to the centroid of the
	// generated Voronoi polygon, then generate Voronoi again.
	// If it's run for too many iterations,
	// it will turn into a grid, but convergence is very slow, and we only
	// run it a few times.
	
	var points = generateRandom(numPoints, size, seed);
	var voronoi = new Voronoi();
	for (var i = 0; i < NUM_LLOYD_RELAXATIONS; i++) {
		var diagram = voronoi.compute(points, {xl: 0, xr: size, yt: 0, yb: size});
		points = [];
		for(var c in diagram.cells) {
			var region = diagram.cells[c];
			if(region.halfedges.length == 0)
				continue;
			var p = new Mapgen.Point(0, 0);
			for(var q in region.halfedges) {
				p.addPoint(region.halfedges[q].getStartpoint());
			}
			p.divide(region.halfedges.length);
			points.push(p);
		}
		voronoi.recycle(diagram);
	}
	return points;
}

// Build graph data structure in 'edges', 'centers', 'corners',
// based on information in the Voronoi results: point.neighbors
// will be a list of neighboring points of the same type (corner
// or center); point.edges will be a list of edges that include
// that point. Each edge connects to four points: the Voronoi edge
// edge.{v0,v1} and its dual Delaunay triangle edge edge.{d0,d1}.
// For boundary polygons, the Delaunay edge will have one null
// point, and the Voronoi edge may be null.
var buildGraph = function(map) {
	var voronoi = new Voronoi();
	var diagram = voronoi.compute(map.points, {xl: 0, xr: map.size, yt: 0, yb: map.size});
	var centerLookup = new Dictionary();
	var points = map.points;

	// Build Center objects for each of the points, and a lookup map
	// to find those Center objects again as we build the graph
	for (var n in points) {
		var point = points[n];
		var p = new Mapgen.Center();
		p.index = map.centers.length;
		p.point = point;
		p.neighbors = []; //Centers
		p.borders = []; //Edges
		p.corners = []; //Corners
		map.centers.push(p);
		centerLookup.set(point, p);
		console.log("4");
	}
      
	// The Voronoi library generates multiple Point objects for
	// corners, and we need to canonicalize to one Corner object.
	// To make lookup fast, we keep an array of Points, bucketed by
	// x value, and then we only have to look at other Points in
	// nearby buckets. When we fail to find one, we'll create a new
	// Corner object.
	var _cornerMap = [];
	var makeCorner = function (point) {
		if (point == null) {
			return null;
		}

		for (var bucket = Math.floor(point.x)-1; bucket <= Math.floor(point.x)+1; bucket++) {
			for(var i in _cornerMap[bucket]) {
				var q = _cornerMap[bucket][i];
				var dx = point.x - q.point.x;
				var dy = point.y - q.point.y;
				if (dx*dx + dy*dy < 1e-6) {
					return q;
				}
			}
		}
		bucket = Math.floor(point.x);
		if (!_cornerMap[bucket]) {
			_cornerMap[bucket] = [];	
		}
		var q = new Mapgen.Corner();
		q.index = map.corners.length;
		map.corners.push(q);
		q.point = point;
		q.border = (point.x == 0 || point.x == map.size || point.y == 0 || point.y == map.size);
		q.touches = []; //Centers
		q.protrudes = []; //Edges
		q.adjacent = []; //Corners
		_cornerMap[bucket].push(q);
		return q;
	}
	
	// Helper functions for the following for loop; ideally these
	// would be inlined
	var addToCornerList = function (v, x) {
		if (x != null && v.indexOf(x) < 0) {
			v.push(x);
		}
	}

	var addToCenterList = function (v, x) {
		if (x != null && v.indexOf(x) < 0) {
			v.push(x);
		}
	}
          
	for(var n in diagram.edges) {
		var libedge = diagram.edges[n];
		//delaunayLine
		var dedge = {
			p0: (libedge.lSite == null)? null : new Mapgen.Point(libedge.lSite.x, libedge.lSite.y), 
			p1: (libedge.rSite == null)? null : new Mapgen.Point(libedge.rSite.x, libedge.rSite.y)
		}
		//voronoiEdge
		var vedge = {
			p0: new Mapgen.Point(libedge.va.x, libedge.va.y), 
			p1: new Mapgen.Point(libedge.vb.x, libedge.vb.y)
		}

		// Fill the graph data. Make an Edge object corresponding to
		// the edge from the voronoi library.
		var edge = new Mapgen.Edge();
		edge.index = map.edges.length;
		edge.river = 0;
		map.edges.push(edge);
		edge.midpoint = vedge.p0.interpolate(vedge.p1, 0.5);

		// Edges point to corners. Edges point to centers. 
		edge.v0 = makeCorner(vedge.p0);
		edge.v1 = makeCorner(vedge.p1);
		edge.d0 = centerLookup.get(dedge.p0);
		edge.d1 = centerLookup.get(dedge.p1);

		// Centers point to edges. Corners point to edges.
		if (edge.d0 != null) {
			edge.d0.borders.push(edge);
		}
		if (edge.d1 != null) {
			edge.d1.borders.push(edge);
		}
		if (edge.v0 != null) {
			edge.v0.protrudes.push(edge);
		}
		if (edge.v1 != null) {
			edge.v1.protrudes.push(edge);
		}

		// Centers point to centers.
		if (edge.d0 != null && edge.d1 != null) {
			addToCenterList(edge.d0.neighbors, edge.d1);
			addToCenterList(edge.d1.neighbors, edge.d0);
		}

		// Corners point to corners
		if (edge.v0 != null && edge.v1 != null) {
			addToCornerList(edge.v0.adjacent, edge.v1);
			addToCornerList(edge.v1.adjacent, edge.v0);
		}

		// Centers point to corners
		if (edge.d0 != null) {
			addToCornerList(edge.d0.corners, edge.v0);
			addToCornerList(edge.d0.corners, edge.v1);
		}
		if (edge.d1 != null) {
			addToCornerList(edge.d1.corners, edge.v0);
			addToCornerList(edge.d1.corners, edge.v1);
		}

		// Corners point to centers
		if (edge.v0 != null) {
			addToCenterList(edge.v0.touches, edge.d0);
			addToCenterList(edge.v0.touches, edge.d1);
		}
		if (edge.v1 != null) {
			addToCenterList(edge.v1.touches, edge.d0);
			addToCenterList(edge.v1.touches, edge.d1);
		}
	}
}
