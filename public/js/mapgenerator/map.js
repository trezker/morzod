"use strict";

var Mapgen = Mapgen || {};

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
				var gl = globj.gl;

				//Prepare data for rendering
			    var points = [];
		    	for(var p in map.points) {
		    		points.push(map.points[p].x);
		    		points.push(map.points[p].y);
		    		points.push(0);
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

				//Setup buffer and draw
				var vertex_buffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
				var vertexPositionAttribute = gl.getAttribLocation(globj.shaderProgram, "aVertexPosition");
				gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
			    gl.enableVertexAttribArray(vertexPositionAttribute);
				gl.drawArrays(gl.POINTS, 0, map.points.length);
				gl.bindBuffer(gl.ARRAY_BUFFER, null);
			}
		]
	];
	console.log("const");
};

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

var NUM_LLOYD_RELAXATIONS = 2;
var generateRelaxed = function (numPoints, size, seed) {
	// Lloyd Relaxation: move each point to the centroid of the
	// generated Voronoi polygon, then generate Voronoi again.
	// If it's run for too many iterations,
	// it will turn into a grid, but convergence is very slow, and we only
	// run it a few times.
	
	var points = generateRandom(numPoints, size, seed);
	console.log("vor start");
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
	console.log("vor end");
	return points;
}
