"use strict";

var Mapgen = Mapgen || {};

Mapgen.Point = function(x, y) {
	this.x = x;
	this.y = y;
};

Mapgen.Point.prototype.addPoint = function (p) {
	this.x += p.x;
	this.y += p.y;
};

Mapgen.Point.prototype.divide = function (s) {
	this.x /= s;
	this.y /= s;
};

Mapgen.Point.prototype.interpolate = function (p, f) {
	var x = this.x + (p.x - this.x) * f;
	var y = this.y + (p.y - this.y) * f;
	return new Mapgen.Point(x, y);
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
	console.log("c1");
	this.index = 0;

	this.point = new Mapgen.Point(0, 0);  // location
	console.log("c2");
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
	console.log("c3");
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
