"use strict";

function load_mapgenerator() {
	ajax_html('/html/mapgenerator.html', function(data) {
		$(".flex-container").append(data);

		var globj = {
			x: 0,
			mvMatrix: mat4.create(),
			pMatrix: mat4.create(),
			drawScene: drawScene
		};
		var canvas = $("#glcanvas")[0];
		initGL(canvas, globj);
		initShaders(globj);
		initBuffers(globj);

		$.getScript("/js/mapgenerator/map.js")
		.done(function( script, textStatus ) {
			var map = new Mapgen.Map();

			while(map.run_stage()) {
				console.log("render here");
				map.render(globj);
			}
			console.log("render here");
			map.render(globj);
		});

//		var simInterval = setInterval(runsimulation, 10, globj);
	});
}

function runsimulation(globj) {
	globj.x += 0.1;
	globj.drawScene(globj);
}

function initGL(canvas, globj) {
	try {
		globj.gl = canvas.getContext("experimental-webgl");
		globj.gl.viewportWidth = canvas.width;
		globj.gl.viewportHeight = canvas.height;
	} catch(e) {
	}
	if (!globj.gl) {
		alert("Could not initialise WebGL, sorry :-( ");
	}
}

function initBuffers(globj) {
	var gl = globj.gl;
    globj.triangleVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, globj.triangleVertexPositionBuffer);
	var vertices = [
		 0.0,  10.0,  0.0,
		-10.0, -10.0,  0.0,
		 10.0, -10.0,  0.0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	globj.triangleVertexPositionBuffer.itemSize = 3;
	globj.triangleVertexPositionBuffer.numItems = 3;
	
	globj.squareVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, globj.squareVertexPositionBuffer);
	vertices = [
		 10.0,  10.0,  0.0,
		-10.0,  10.0,  0.0,
		 10.0, -10.0,  0.0,
		-10.0, -10.0,  0.0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	globj.squareVertexPositionBuffer.itemSize = 3;
	globj.squareVertexPositionBuffer.numItems = 4;
}

function setMatrixUniforms(globj) {
	var gl = globj.gl;
	gl.uniformMatrix4fv(globj.shaderProgram.pMatrixUniform, false, globj.pMatrix);
	gl.uniformMatrix4fv(globj.shaderProgram.mvMatrixUniform, false, globj.mvMatrix);
}

function drawScene(globj) {
	var gl = globj.gl;
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //mat4.perspective(globj.pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
    mat4.ortho(globj.pMatrix, 0, 512, 512, 0, 0.0, 10);
    mat4.identity(globj.mvMatrix);
    mat4.translate(globj.mvMatrix, globj.mvMatrix, [globj.x, globj.x, 0.0]);
    mat4.translate(globj.mvMatrix, globj.mvMatrix, [-15, 0.0, 0.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, globj.triangleVertexPositionBuffer);
    gl.vertexAttribPointer(globj.shaderProgram.vertexPositionAttribute, globj.triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms(globj);
    gl.drawArrays(gl.TRIANGLES, 0, globj.triangleVertexPositionBuffer.numItems);
    mat4.translate(globj.mvMatrix, globj.mvMatrix, [30, 0.0, 0.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, globj.squareVertexPositionBuffer);
    gl.vertexAttribPointer(globj.shaderProgram.vertexPositionAttribute, globj.squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms(globj);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, globj.squareVertexPositionBuffer.numItems);
    
}

function initShaders(globj) {
	var gl = globj.gl;
	if($("#shader-fs").length === 0) {
		var shader1 = `
			<script id="shader-fs" type="x-shader/x-fragment">
				void main(void) {
				}
			</script>`;
		var shader2 = `
			<script id="shader-vs" type="x-shader/x-vertex">
				attribute vec3 aVertexPosition;

				uniform mat4 uMVMatrix;
				uniform mat4 uPMatrix;

				void main(void) {
					gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
				}
			</script>`;

		$("head").append(shader1);
		$("head").append(shader2);
	}
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    globj.shaderProgram = gl.createProgram();
    gl.attachShader(globj.shaderProgram, vertexShader);
    gl.attachShader(globj.shaderProgram, fragmentShader);
    gl.linkProgram(globj.shaderProgram);

    if (!gl.getProgramParameter(globj.shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }

    gl.useProgram(globj.shaderProgram);
    
	globj.shaderProgram.vertexPositionAttribute = gl.getAttribLocation(globj.shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(globj.shaderProgram.vertexPositionAttribute);
    globj.shaderProgram.pMatrixUniform = gl.getUniformLocation(globj.shaderProgram, "uPMatrix");
    globj.shaderProgram.mvMatrixUniform = gl.getUniformLocation(globj.shaderProgram, "uMVMatrix");
}

function getShader(gl, id) {
      var shaderScript = document.getElementById(id);
      if (!shaderScript) {
          return null;
      }

      var str = "";
      var k = shaderScript.firstChild;
      while (k) {
          if (k.nodeType == 3)
              str += k.textContent;
          k = k.nextSibling;
      }

      var shader;
      if (shaderScript.type == "x-shader/x-fragment") {
          shader = gl.createShader(gl.FRAGMENT_SHADER);
      } else if (shaderScript.type == "x-shader/x-vertex") {
          shader = gl.createShader(gl.VERTEX_SHADER);
      } else {
          return null;
      }

      gl.shaderSource(shader, str);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          alert(gl.getShaderInfoLog(shader));
          return null;
      }

      return shader;
}