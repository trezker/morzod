"use strict";

var Mapgen = Mapgen || {};

Mapgen.Point = function(x, y) {
	this.x = x;
	this.y = y;
};

Mapgen.Corner = function() {
	this.index = 0;

	this.point = new Mapgen.Point(0, 0);  // location
	this.ocean = false;  // ocean
	this.water = false;  // lake or ocean
	this.coast = false;  // touches ocean and land polygons
	this.border = false;  // at the edge of the map
	this.elevation = 0;  // 0.0-1.0
	this.moisture = 0;  // 0.0-1.0

	this.touches = []; //Centers
	this.protrudes = []; //Edges
	this.adjacent = []; //Corners

	this.river = 0;  // 0 if no river, or volume of water in river
	this.downslope = null;  // pointer to adjacent corner most downhill
	this.watershed = null;  // pointer to coastal corner, or null
	this.watershed_size = 0;
};

Mapgen.Center = function() {
	this.index = 0;

	this.point = new Mapgen.Point(0, 0);  // location
	this.water = false;  // lake or ocean
	this.ocean = false;  // ocean
	this.coast = false;  // land polygon touching an ocean
	this.border = false;  // at the edge of the map
	this.biome = "";  // biome type (see article)
	this.elevation = 0;  // 0.0-1.0
	this.moisture = 0;  // 0.0-1.0

	this.neighbors = []; //Centers
	this.borders = []; //Edges
	this.corners = []; //Corners
};

Mapgen.Edge = function() {
	this.index = 0;
	// Delaunay edge, centers
	this.d0 = null;
	this.d1 = null;
	// Voronoi edge, corners
	this.v0 = null;
	this.v1 = null;
	// halfway between v0,v1
	this.midpoint = new Mapgen.Point(0, 0);
	// volume of water, or 0
	this.river = 0;
};

Mapgen.Map = function () {
	this.size = 2048;
	this.seed = 0;
	this.numpoints = 1000;
	this.reset();

	// Generate the initial random set of points
	this.stages = [
		[
			"Place points...",
			function(map) {
				map.reset();
				map.points = generateRelaxed(map.numpoints, map.size, map.seed);
			},
			function(map, globj) {
				console.log(map.points);
				var gl = globj.gl;

			    var points = [];
		    	for(var p in map.points) {
		    		points.push((map.points[p].x/2048-0.5)*2);
		    		points.push((map.points[p].y/2048-0.5)*2);
		    		points.push(0);
		    	}
		    	console.log(points);
				// Create an empty buffer object to store the vertex buffer
				var vertex_buffer = gl.createBuffer();
				//Bind appropriate array buffer to it
				gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
				// Pass the vertex data to the buffer
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
				// Unbind the buffer
				gl.bindBuffer(gl.ARRAY_BUFFER, null);

				var vertCode = 'attribute vec3 coordinates;' +
					'void main(void) {' +
						'gl_Position = vec4(coordinates, 1.0);' +
						'gl_PointSize = 2.0;'+
					'}';
				// Create a vertex shader object
				var vertShader = gl.createShader(gl.VERTEX_SHADER);
				// Attach vertex shader source code
				gl.shaderSource(vertShader, vertCode);
				// Compile the vertex shader
				gl.compileShader(vertShader);				   
				var fragCode = 'void main(void) {' +
						'gl_FragColor = vec4(0, 0, 0, 1);' +
					'}';
				// Create fragment shader object
				var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
				// Attach fragment shader source code
				gl.shaderSource(fragShader, fragCode);
				// Compile the fragmentt shader
				gl.compileShader(fragShader);

				// Create a shader program object to store
				// the combined shader program
				var shaderProgram = gl.createProgram();
				// Attach a vertex shader
				gl.attachShader(shaderProgram, vertShader); 
				// Attach a fragment shader
				gl.attachShader(shaderProgram, fragShader);
				// Link both programs
				gl.linkProgram(shaderProgram);
				// Use the combined shader program object
				gl.useProgram(shaderProgram);

				/*======== Associating shaders to buffer objects ========*/
				// Bind vertex buffer object
				gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
				// Get the attribute location
				var coord = gl.getAttribLocation(shaderProgram, "coordinates");
				// Point an attribute to the currently bound VBO
				gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
				// Enable the attribute
				gl.enableVertexAttribArray(coord);

				/*============= Drawing the primitive ===============*/
				// Clear the canvas
				gl.clearColor(0.9, 0.9, 0.9, 1);
				// Enable the depth test
				gl.enable(gl.DEPTH_TEST);
				// Clear the color buffer bit
				gl.clear(gl.COLOR_BUFFER_BIT);
				// Set the view port
				gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
				// Draw the triangle
				gl.drawArrays(gl.POINTS, 0, map.points.length);
			}
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

var NUM_LLOYD_RELAXATIONS = 1;
var generateRelaxed = function (numPoints, size, seed) {
	// Lloyd Relaxation: move each point to the centroid of the
	// generated Voronoi polygon, then generate Voronoi again.
	// If it's run for too many iterations,
	// it will turn into a grid, but convergence is very slow, and we only
	// run it a few times.
	var points = generateRandom(numPoints, size, seed);
	for (var i = 0; i < NUM_LLOYD_RELAXATIONS; i++) {
		//var voronoi = new Voronoi(points, null, new Rectangle(0, 0, size, size));
		for(var p in points) {

			/*
			region = voronoi.region(p);
			p.x = 0.0;
			p.y = 0.0;
			for each (q in region) {
				p.x += q.x;
				p.y += q.y;
			}
            p.x /= region.length;
            p.y /= region.length;
            region.splice(0, region.length);
            */
		}
		//voronoi.dispose();
	}
	return points;
}
/*
var map = new Mapgen.Map();

while(map.run_stage()) {
	console.log("render here");
}
console.log("render here");
*/