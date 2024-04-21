var GL;

class MyObject {
  object_vertex = [];
  OBJECT_VERTEX = GL.createBuffer();

  object_faces = [];
  OBJECT_FACES = GL.createBuffer();

  shader_vertex_source;
  shader_fragment_source;

  child = [];

  compile_shader = function (source, type, typeString) {
    var shader = GL.createShader(type);
    GL.shaderSource(shader, source);
    GL.compileShader(shader);
    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
      alert(
        "ERROR IN" + typeString + " SHADER: " + GL.getShaderInfoLog(shader)
      );
      return false;
    }
    return shader;
  };

  shader_vertex;
  shader_fragment;
  SHADER_PROGRAM;
  _Pmatrix;
  _Vmatrix;
  _Mmatrix;
  _color;
  _position;

  MOVEMATRIX; // WORLD SPACE

  constructor(object_vertex, object_faces, shader_fragment_source, shader_vertex_source) {
    this.object_vertex = object_vertex;
    this.object_faces = object_faces;
    this.shader_fragment_source = shader_fragment_source;
    this.shader_vertex_source = shader_vertex_source;


    this.shader_vertex = this.compile_shader(
      this.shader_vertex_source,
      GL.VERTEX_SHADER,
      "VERTEX"
    );

    this.shader_fragment = this.compile_shader(
      this.shader_fragment_source,
      GL.FRAGMENT_SHADER,
      "FRAGMENT"
    );

    this.SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(this.SHADER_PROGRAM, this.shader_vertex);
    GL.attachShader(this.SHADER_PROGRAM, this.shader_fragment);

    GL.linkProgram(this.SHADER_PROGRAM);

    this._Pmatrix = GL.getUniformLocation(this.SHADER_PROGRAM, "Pmatrix");
    this._Vmatrix = GL.getUniformLocation(this.SHADER_PROGRAM, "Vmatrix");
    this._Mmatrix = GL.getUniformLocation(this.SHADER_PROGRAM, "Mmatrix");

    this._color = GL.getAttribLocation(this.SHADER_PROGRAM, "color");
    this._position = GL.getAttribLocation(this.SHADER_PROGRAM, "position");

    GL.enableVertexAttribArray(this._color);
    GL.enableVertexAttribArray(this._position);

    GL.useProgram(this.SHADER_PROGRAM);

    this.initializeBuffer();
  }

  initializeBuffer() {
    GL.bindBuffer(GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
    GL.bufferData(
      GL.ARRAY_BUFFER,
      new Float32Array(this.object_vertex),
      GL.STATIC_DRAW
    );
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
    GL.bufferData(
      GL.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(this.object_faces),
      GL.STATIC_DRAW
    );
  }

  setuniformmatrix4(PROJMATRIX, VIEWMATRIX) {
    GL.useProgram(this.SHADER_PROGRAM);
    GL.uniformMatrix4fv(this._Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(this._Vmatrix, false, VIEWMATRIX);
    GL.uniformMatrix4fv(this._Mmatrix, false, this.MOVEMATRIX);
  }

  draw() {
    GL.useProgram(this.SHADER_PROGRAM); // harus gini biar yang object sebelum e tau pake shader yang mana (soale komputer cuma bisa megang 1 SHADER PROGRAM)
    GL.bindBuffer(GL.ARRAY_BUFFER, this.OBJECT_VERTEX);

    GL.vertexAttribPointer(this._position, 3, GL.FLOAT, false, 4 * (3 + 3), 0);
    GL.vertexAttribPointer(this._color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4  );

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
    GL.drawElements(GL.TRIANGLES, this.object_faces.length, GL.UNSIGNED_SHORT, 0);

    if (this.child.length > 0) {
      for (let i = 0; i < this.child.length; i++) {
      
        this.child[i].draw();
      }
    }  
  }

  setRotateMove(PHI, THETA, r) {
    LIBS.rotateZ(this.MOVEMATRIX, r);
    LIBS.rotateY(this.MOVEMATRIX, THETA);
    LIBS.rotateX(this.MOVEMATRIX, PHI);
  }

  setTranslateMove(x,y,z) {
    LIBS.translateZ(this.MOVEMATRIX, z);
    LIBS.translateY(this.MOVEMATRIX, y);
    LIBS.translateX(this.MOVEMATRIX, x);
  }

  setIdentityMove() {
    LIBS.set_I4(this.MOVEMATRIX);
  }

  addChild(child) {
    this.child.push(child);
  }
}

function generateSphereFull(x, y, z, radius, segments) {
  var vertices = [];
  var colors = [];

  var sphereColors = [];

  for (var i = 0; i < 5; i++) {
    sphereColors.push([Math.random(), Math.random(), Math.random()])
  }

  console.log(segments);
  for (var i = 0; i <= segments; i++) {
    var v = Math.PI * (-0.5 + i / segments);
    var sinV = Math.sin(v);
    var cosV = Math.cos(v);

    for (var j = 0; j <= segments; j++) {
      var u = 2 * Math.PI * (j / segments);
      var sinU = Math.sin(u);
      var cosU = Math.cos(u);

      var xCoord = cosU * cosV;
      var yCoord = sinU * cosV;
      var zCoord = sinV;

      var vertexX = x + radius * xCoord;
      var vertexY = y + radius * yCoord;
      var vertexZ = z + radius * zCoord;

      vertices.push(vertexX, vertexY, vertexZ);

      var colorIndex = j % sphereColors.length;
      colors = colors.concat(sphereColors[colorIndex]);
    }
  }
  

  var faces = [];
  for (var i = 0; i < segments; i++) {
    for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      faces.push(index, nextIndex, index + 1);
      faces.push(nextIndex, nextIndex + 1, index + 1);
    }
  }

  return { vertices: vertices, colors: colors, faces: faces };
}

function generateSphere(x, y, z, radius, segments) {
  var vertices = [];
  // var colors = [];

  var sphereColors = [];

  for (var i = 0; i < 5; i++) {
    sphereColors.push([Math.random(), Math.random(), Math.random()])
  }

  // console.log(segments);
  for (var i = 0; i <= segments; i++) {
    var v = Math.PI * (-0.5 + i / segments);
    var sinV = Math.sin(v);
    var cosV = Math.cos(v);

    for (var j = 0; j <= segments; j++) {
      var u = 2 * Math.PI * (j / segments);
      var sinU = Math.sin(u);
      var cosU = Math.cos(u);

      var xCoord = cosU * cosV;
      var yCoord = sinU * cosV;
      var zCoord = sinV;

      if (j > 60 && j < 90) {
        // var vertexX = 0.5;
        // var vertexY = 0.5;
        // var vertexZ = z + radius + (7/5.3)/2* zCoord;
      } else {
        var vertexX = x + radius + 0.75 * xCoord;
        var vertexY = y + radius + 1 * yCoord;
        var vertexZ = z + radius + (7/5.3)/2 * zCoord;
      }

      // var colorIndex = j % sphereColors.length;
      vertices.push(vertexX, vertexY, vertexZ, 221/255, 112/255, 24/255);
    }
  }
  

  var faces = [];
  for (var i = 0; i < segments; i++) {
    for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      faces.push(index, nextIndex, index + 1);
      faces.push(nextIndex, nextIndex + 1, index + 1);
    }
  }

  console.log(segments)
  return { vertices: vertices, faces: faces };
}

function generateSphere2(x, y, z, radius, segments) {
  var vertices = [];
  // var colors = [];

  var sphereColors = [];

  for (var i = 0; i < 5; i++) {
    sphereColors.push([Math.random(), Math.random(), Math.random()])
  }

  // console.log(segments);
  for (var i = 0; i <= segments; i++) {
    var v = Math.PI * (-0.5 + i / segments);
    var sinV = Math.sin(v);
    var cosV = Math.cos(v);

    for (var j = 0; j <= segments; j++) {
      var u = 2 * Math.PI * (j / segments);
      var sinU = Math.sin(u);
      var cosU = Math.cos(u);

      var xCoord = cosU * cosV;
      var yCoord = sinU * cosV;
      var zCoord = sinV;

      if (j > 41 && j <= 100) {
        var vertexX = 0.5;
        var vertexY = 0.5;
        var vertexZ = z + radius + (7/5.3)/2 * zCoord * 0.75;
      } else {
        var vertexX = x + radius + 0.75 * xCoord * 1.2;
        var vertexY = y + radius + 1 * yCoord;
        var vertexZ = z + radius + (7/5.3)/2 * zCoord * 0.75;
      }

      var colorIndex = j % sphereColors.length;
      vertices.push(vertexX, vertexY, vertexZ, 221/255, 112/255, 24/255);
    }
  }
  

  var faces = [];
  for (var i = 0; i < segments; i++) {
    for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      faces.push(index, nextIndex, index + 1);
      faces.push(nextIndex, nextIndex + 1, index + 1);
    }
  }

  console.log(segments)
  return { vertices: vertices, faces: faces };
}

function normalizeScreen(x, y, width, height) {
  var nx = (2 * x) / width - 1;
  var ny = (-2 * y) / height + 1;

  return [nx, ny];
}

function generateBSpline(controlPoint, m, degree) {
  var curves = [];
  var knotVector = [];

  var n = controlPoint.length / 2;

  // Calculate the knot values based on the degree and number of control points
  for (var i = 0; i < n + degree + 1; i++) {
    if (i < degree + 1) {
      knotVector.push(0);
    } else if (i >= n) {
      knotVector.push(n - degree);
    } else {
      knotVector.push(i - degree);
    }
  }

  var basisFunc = function (i, j, t) {
    if (j == 0) {
      if (knotVector[i] <= t && t < knotVector[i + 1]) {
        return 1;
      } else {
        return 0;
      }
    }

    var den1 = knotVector[i + j] - knotVector[i];
    var den2 = knotVector[i + j + 1] - knotVector[i + 1];

    var term1 = 0;
    var term2 = 0;

    if (den1 != 0 && !isNaN(den1)) {
      term1 = ((t - knotVector[i]) / den1) * basisFunc(i, j - 1, t);
    }

    if (den2 != 0 && !isNaN(den2)) {
      term2 = ((knotVector[i + j + 1] - t) / den2) * basisFunc(i + 1, j - 1, t);
    }

    return term1 + term2;
  };

  for (var t = 0; t < m; t++) {
    var x = 0;
    var y = 0;

    var u =
      (t / m) * (knotVector[controlPoint.length / 2] - knotVector[degree]) +
      knotVector[degree];

    //C(t)
    for (var key = 0; key < n; key++) {
      var C = basisFunc(key, degree, u);
      console.log(C);
      x += controlPoint[key * 2] * C;
      y += controlPoint[key * 2 + 1] * C;
      console.log(t + " " + degree + " " + x + " " + y + " " + C);
    }
    curves.push(x);
    curves.push(y);
  }
  console.log(curves);
  return curves;
}

function main() {
  var CANVAS = document.getElementById("mycanvas");

  CANVAS.width = window.innerWidth;
  CANVAS.height = window.innerHeight;

  var AMORTIZATION = 0.95;
  var THETA = 0,
    PHI = 0;
  var drag = false;
  var x_prev, y_prev;
  var dX = 0,
    dY = 0;

  // var keyDown = function (e) {
  //   switch (e.key) {
  //     case "a":
  //       rotationY -= 0.01;
  //       drag = true;
  //       break;

  //     case "d":
  //       rotationY += 0.01;
  //       drag = true;
  //       break;

  //     case "w":
  //       rotationX -= 0.01;
  //       drag = true;
  //       break;

  //     case "s":
  //       rotationX += 0.01;
  //       drag = true;
  //       break;
  //   }
  // };

  var keyUp = function (e) {
    drag = false;
  };

  var mouseDown = function (e) {
    drag = true;
    (x_prev = e.pageX), (y_prev = e.pageY);
    e.preventDefault();
    return false;
  };

  var mouseUp = function (e) {
    drag = false;
  };

  var mouseMove = function (e) {
    if (!drag) return false;
    (dX = ((e.pageX - x_prev) * Math.PI) / CANVAS.width),
      (dY = ((e.pageY - y_prev) * Math.PI) / CANVAS.height);
    THETA += dX;
    PHI += dY;
    (x_prev = e.pageX), (y_prev = e.pageY);
    e.preventDefault();
  };

  // window.addEventListener("keydown", keyDown);
  // window.addEventListener("keyup", keyUp);

  CANVAS.addEventListener("mousedown", mouseDown, false);
  CANVAS.addEventListener("mouseup", mouseUp, false);
  CANVAS.addEventListener("mouseout", mouseUp, false);
  CANVAS.addEventListener("mousemove", mouseMove, false);

  try {
    GL = CANVAS.getContext("webgl", { antialias: false });
  } catch (error) {
    alert("WebGL context cannot be initialized");
    return false;
  }
  //shader
  var shader_vertex_source = `
  attribute vec3 position;
  attribute vec3 color;

  uniform mat4 Pmatrix;
  uniform mat4 Vmatrix;
  uniform mat4 Mmatrix;

  varying vec3 vColor;
  void main(void){
      gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);
      gl_PointSize = 20.0;
      vColor = color;
  }

  `;

  var shader_fragment_source = `
  precision mediump float;

  varying vec3 vColor;
  void main(void){
      gl_FragColor = vec4(vColor,1.0);
  }
  `;

  function generateCylinderHorizon(z1, z2, radius, radius2) {
    var cylinderVertex = [];
    cylinderVertex.push(0);
    cylinderVertex.push(0);
    cylinderVertex.push(0);
    cylinderVertex.push(221/255);
    cylinderVertex.push(112/255);
    cylinderVertex.push(24/255);
  
  for (var i = 0; i <= 720; i++) {
    if (i <= 360) {
      var x =
        (radius * Math.cos(degrees_to_radians(i))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians(i))) / CANVAS.height;
      cylinderVertex.push(z1);
      cylinderVertex.push(x);
      cylinderVertex.push(y);
      cylinderVertex.push(221/255);
      cylinderVertex.push(112/255);
      cylinderVertex.push(24/255);
    }
    if (i == 360) {
      cylinderVertex.push(1);
      cylinderVertex.push(0);
      cylinderVertex.push(0);
      cylinderVertex.push(221/255);
      cylinderVertex.push(112/255);
      cylinderVertex.push(24/255);
    }
    if (i >= 360) {
      var x =
        (radius * Math.cos(degrees_to_radians(i % 360))) /
        CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians(i % 360))) /
        CANVAS.height;
      cylinderVertex.push(z2);
      cylinderVertex.push(x);
      cylinderVertex.push(y);
      cylinderVertex.push(221/255);
      cylinderVertex.push(112/255);
      cylinderVertex.push(24/255);
    }
    if (i == 720) {
      var x =
        (radius * Math.cos(degrees_to_radians(360))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians(360))) /
        CANVAS.height;
      cylinderVertex.push(z2);
      cylinderVertex.push(x);
      cylinderVertex.push(y);
      cylinderVertex.push(221/255);
      cylinderVertex.push(112/255);
      cylinderVertex.push(24/255);
    }
  }
  
  var cylinder_faces = []
  
    for (var i = 0; i < cylinderVertex.length / 6 - 1; i++) {
      if (i <= 360) {
        cylinder_faces.push(0);
        cylinder_faces.push(i);
        cylinder_faces.push(i + 1);
      }
      if (i > 362) {
        cylinder_faces.push(362);
        cylinder_faces.push(i);
        cylinder_faces.push(i + 1);
      }
    }
  
    var bottom_circle_index = 0;
    var top_circle_index = 363;
  
    for (var i = 0; i <= 360; i++) {
      cylinder_faces.push(bottom_circle_index);
      cylinder_faces.push(bottom_circle_index + 1);
      cylinder_faces.push(top_circle_index);
      cylinder_faces.push(top_circle_index);
      cylinder_faces.push(top_circle_index + 1);
      cylinder_faces.push(bottom_circle_index + 1);
      bottom_circle_index++;
      top_circle_index++;
    }

    return { vertices: cylinderVertex, faces: cylinder_faces };
  }

  function generateCylinderHorizonRotate(z1, z2, radius, radius2, array_color) {
    var cylinderVertex = [];
    cylinderVertex.push(0);
    cylinderVertex.push(0);
    cylinderVertex.push(0);
    cylinderVertex.push(array_color[0]);
    cylinderVertex.push(array_color[1]);
    cylinderVertex.push(array_color[2]);
  
  for (var i = 0; i <= 720; i++) {
    if (i <= 360) {
      var x =
        (radius * Math.cos(degrees_to_radians(i))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians(i))) / CANVAS.height;
      cylinderVertex.push(x);
      cylinderVertex.push(y);
      cylinderVertex.push(z1);
      cylinderVertex.push(array_color[0]);
      cylinderVertex.push(array_color[1]);
      cylinderVertex.push(array_color[2]);
    }
    if (i == 360) {
      cylinderVertex.push(0);
      cylinderVertex.push(0);
      cylinderVertex.push(z2);
      cylinderVertex.push(array_color[0]);
      cylinderVertex.push(array_color[1]);
      cylinderVertex.push(array_color[2]);
    }
    if (i >= 360) {
      var x =
        (radius * Math.cos(degrees_to_radians(i % 360))) /
        CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians(i % 360))) /
        CANVAS.height;
        cylinderVertex.push(x);
      cylinderVertex.push(y);
      cylinderVertex.push(z2);
      cylinderVertex.push(array_color[0]);
      cylinderVertex.push(array_color[1]);
      cylinderVertex.push(array_color[2]);
    }
    if (i == 720) {
      var x =
        (radius * Math.cos(degrees_to_radians(360))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians(360))) /
        CANVAS.height;
        cylinderVertex.push(x);
      cylinderVertex.push(y);
      cylinderVertex.push(z2);
      cylinderVertex.push(array_color[0]);
      cylinderVertex.push(array_color[1]);
      cylinderVertex.push(array_color[2]);
    }
  }
  
  var cylinder_faces = []
  
    for (var i = 0; i < cylinderVertex.length / 6 - 1; i++) {
      if (i <= 360) {
        cylinder_faces.push(0);
        cylinder_faces.push(i);
        cylinder_faces.push(i + 1);
      }
      if (i > 362) {
        cylinder_faces.push(362);
        cylinder_faces.push(i);
        cylinder_faces.push(i + 1);
      }
    }
  
    var bottom_circle_index = 0;
    var top_circle_index = 363;
  
    for (var i = 0; i <= 360; i++) {
      cylinder_faces.push(bottom_circle_index);
      cylinder_faces.push(bottom_circle_index + 1);
      cylinder_faces.push(top_circle_index);
      cylinder_faces.push(top_circle_index);
      cylinder_faces.push(top_circle_index + 1);
      cylinder_faces.push(bottom_circle_index + 1);
      bottom_circle_index++;
      top_circle_index++;
    }

    return { vertices: cylinderVertex, faces: cylinder_faces };
  }

  function generateCylinderVerti(z1, z2, radius, radius2) {
    var cylinderVertex = []
  cylinderVertex.push(0);
  cylinderVertex.push(0);
  cylinderVertex.push(0);
  cylinderVertex.push(221/255);
  cylinderVertex.push(112/255);
  cylinderVertex.push(24/255);

  for (var i = 0; i <= 720; i++) {
    if (i <= 360) {
      var x =
        (radius * Math.cos(degrees_to_radians(i))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians(i))) / CANVAS.height;
      cylinderVertex.push(x);
      cylinderVertex.push(z1);
      cylinderVertex.push(y);
      cylinderVertex.push(221/255);
      cylinderVertex.push(112/255);
      cylinderVertex.push(24/255);
    }
    if (i == 360) {
      cylinderVertex.push(0);
      cylinderVertex.push(1);
      cylinderVertex.push(0);
      cylinderVertex.push(221/255);
      cylinderVertex.push(112/255);
      cylinderVertex.push(24/255);
    }
    if (i >= 360) {
      var x =
        (radius * Math.cos(degrees_to_radians(i % 360))) /
        CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians(i % 360))) /
        CANVAS.height;
      cylinderVertex.push(x);
      cylinderVertex.push(z2);
      cylinderVertex.push(y);
      cylinderVertex.push(221/255);
      cylinderVertex.push(112/255);
      cylinderVertex.push(24/255);
    }
    if (i == 720) {
      var x =
        (radius * Math.cos(degrees_to_radians(360))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians(360))) /
        CANVAS.height;
        cylinderVertex.push(x);
      cylinderVertex.push(1);
      cylinderVertex.push(y);
      cylinderVertex.push(221/255);
      cylinderVertex.push(112/255);
      cylinderVertex.push(24/255);
    }
  }

  var cylinder_faces = []

    for (var i = 0; i < cylinderVertex.length / 6 - 1; i++) {
      if (i <= 360) {
        cylinder_faces.push(0);
        cylinder_faces.push(i);
        cylinder_faces.push(i + 1);
      }
      if (i > 362) {
        cylinder_faces.push(362);
        cylinder_faces.push(i);
        cylinder_faces.push(i + 1);
      }
    }

    var bottom_circle_index = 0;
    var top_circle_index = 363;

    for (var i = 0; i <= 360; i++) {
      cylinder_faces.push(bottom_circle_index);
      cylinder_faces.push(bottom_circle_index + 1);
      cylinder_faces.push(top_circle_index);
      cylinder_faces.push(top_circle_index);
      cylinder_faces.push(top_circle_index + 1);
      cylinder_faces.push(bottom_circle_index + 1);
      bottom_circle_index++;
      top_circle_index++;
    }

    return { vertices: cylinderVertex, faces: cylinder_faces };
  }

  // C3P0

// Leg  
var legVertex = [
  // telapak kaki
  // depan permukaan kubus
  -0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
  0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
  0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  -0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  // kiri permukaan kubus
  -0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
  -0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
  -0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  -0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
    // kanan permukaan kanan
    0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
    0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
    0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
    0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
    // bawah permukaan kubus
    -0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
    -0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
    0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
    0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
    // atas permukaan kubus
  -0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
  -0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  0.5, 0.25, -0.5, 221/255, 112/255, 24/255,

  // kaki
  // belakang permukaan balok (diperpanjang)
  -0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
  0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
  0.5, 1.5, -0.5, 221/255, 112/255, 24/255,
  -0.5, 1.5, -0.5, 221/255, 112/255, 24/255,
  // depan permukaan balok
  -0.5, -0.5, 0.03125, 221/255, 112/255, 24/255,
  0.5, -0.5, 0.03125, 221/255, 112/255, 24/255,
  0.5, 1.5, 0.03125, 221/255, 112/255, 24/255,
  -0.5, 1.5, 0.03125, 221/255, 112/255, 24/255,
  // kanan permukaan balok
  0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
  0.5, 1.5, -0.5, 221/255, 112/255, 24/255,
  0.5, 1.5, 0.03125, 221/255, 112/255, 24/255,
  0.5, -0.5, 0.03125, 221/255, 112/255, 24/255,
  // kiri permukaan balok
  -0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
  -0.5, 1.5, -0.5, 221/255, 112/255, 24/255,
  -0.5, 1.5, 0.03125, 221/255, 112/255, 24/255,
  -0.5, -0.5, 0.03125, 221/255, 112/255, 24/255
];

var triangle_faces = [
  0, 1, 2,
  0, 2, 3,

  4, 5, 6,
  4, 6, 7,

  8, 9, 10,
  8, 10, 11,

  12, 13, 14,
  12, 14, 15,

  16, 17, 18,
  16, 18, 19,

  20, 21, 22,
  20, 22, 23,

  24, 25, 26,
  24, 26, 27,

  28, 29, 30,
  28, 30, 31,

  32, 33, 34,
  32, 34, 35
];

// var arm_Vertex = [
//   // telapak kaki
//   // depan permukaan kubus
//   // -0.5, -0.5, 0.5, 221/255, 112/255, 29/255,
//   // 0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
//   // 0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
//   // -0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
//   // // kiri permukaan kubus
//   // -0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
//   // -0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
//   // -0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
//   // -0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
//   //   // kanan permukaan kanan
//   //   0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
//   //   0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
//   //   0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
//   //   0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
//   //   // bawah permukaan kubus
//   //   -0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
//   //   -0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
//   //   0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
//   //   0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
//   //   // atas permukaan kubus
//   // -0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
//   // -0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
//   // 0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
//   // 0.5, 0.25, -0.5, 221/255, 112/255, 24/255,

//   // kaki
//   // belakang permukaan balok (diperpanjang)
//   -0.5, -0.5, -0.5, 0/255, 0/255, 0/255,
//   0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
//   0.5, 1.5, -0.5, 221/255, 112/255, 24/255,
//   -0.5, 1.5, -0.5, 221/255, 112/255, 24/255,
//   // depan permukaan balok
//   -0.5, -0.5, 0.03125, 221/255, 112/255, 24/255,
//   0.5, -0.5, 0.03125, 221/255, 112/255, 24/255,
//   0.5, 1.5, 0.03125, 221/255, 112/255, 24/255,
//   -0.5, 1.5, 0.03125, 221/255, 112/255, 24/255,
//   // kanan permukaan balok
//   0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
//   0.5, 1.5, -0.5, 221/255, 112/255, 24/255,
//   0.5, 1.5, 0.03125, 221/255, 112/255, 24/255,
//   0.5, -0.5, 0.03125, 221/255, 112/255, 24/255,
//   // kiri permukaan balok
//   -0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
//   -0.5, 1.5, -0.5, 221/255, 112/255, 24/255,
//   -0.5, 1.5, 0.03125, 221/255, 112/255, 24/255,
//   -0.5, -0.5, 0.03125, 221/255, 112/255, 24/255
// ];

// var arm_Vertex = [
  // telapak kaki
  // depan permukaan kubus
  // -0.5, -0.5, 0.5, 221/255, 112/255, 29/255,
  // 0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
  // 0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  // -0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  // // kiri permukaan kubus
  // -0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
  // -0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
  // -0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  // -0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
  //   // kanan permukaan kanan
  //   0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
  //   0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
  //   0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  //   0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
  //   // bawah permukaan kubus
  //   -0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
  //   -0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
  //   0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
  //   0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
  //   // atas permukaan kubus
  // -0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
  // -0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  // 0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  // 0.5, 0.25, -0.5, 221/255, 112/255, 24/255,

 

function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi / 180);
}

  // body
  var bodyVertex = [
    // tubuh bawah
    // depan permukaan kubus
    -1.2, -0.5, 0.5, 221/255, 112/255, 24/255,
    1.1, -0.5, 0.5, 221/255, 112/255, 24/255,
    1.1, 0.0625, 0.5, 221/255, 112/255, 24/255,
    -1.2, 0.0625, 0.5, 221/255, 112/255, 24/255,
    // kiri permukaan kubus
    -1.175, -0.5, -0.5, 221/255, 112/255, 24/255,
    -1.175, 0.0625, -0.5, 221/255, 112/255, 24/255,
    -1.175, 0.0625, 0.5, 221/255, 112/255, 24/255,
    -1.175, -0.5, 0.5, 221/255, 112/255, 24/255,
      // kanan permukaan kubus
      1.075, -0.5, -0.5, 221/255, 112/255, 24/255,
      1.075, 0.0625, -0.5, 221/255, 112/255, 24/255,
      1.075, 0.0625, 0.5, 221/255, 112/255, 24/255,
      1.075, -0.5, 0.5, 221/255, 112/255, 24/255,
      // bawah permukaan kubus
      -1.2, -0.5, -0.5, 221/255, 112/255, 24/255,
      -1.2, -0.5, 0.5, 221/255, 112/255, 24/255,
      1.1, -0.5, 0.5, 221/255, 112/255, 24/255,
      1.1, -0.5, -0.5, 221/255, 112/255, 24/255,
      // atas permukaan kubus
    -1.2, 0.0625, -0.5, 221/255, 112/255, 24/255,
    -1.2, 0.0625, 0.5, 221/255, 112/255, 24/255,
    1.1, 0.0625, 0.5, 221/255, 112/255, 24/255,
    1.1, 0.0625, -0.5, 221/255, 112/255, 24/255,
    // belakang permukaan kubus
    -1.2, -0.5, -0.5, 221/255, 112/255, 24/255,
    1.1, -0.5, -0.5, 221/255, 112/255, 24/255,
    1.1, 0.0625, -0.5, 221/255, 112/255, 24/255,
    -1.2, 0.0625, -0.5, 221/255, 112/255, 24/255,

    // tubuh atas
    // depan permukaan kubus
    -1.2, 0, 0.5, 221/255, 112/255, 24/255,
    1.1, 0, 0.5, 221/255, 112/255, 24/255,
    0.9, 2, 0.5, 221/255, 112/255, 24/255,
    -1, 2, 0.5, 221/255, 112/255, 24/255,
    // kiri permukaan kubus
    -1.175, 0, -0.5, 221/255, 112/255, 24/255,
    -1, 2, -0.5, 221/255, 112/255, 24/255,
    -1, 2, 0.5, 221/255, 112/255, 24/255,
    -1.175, 0, 0.5, 221/255, 112/255, 24/255,
      // kanan permukaan kubus
      1.075, 0, -0.5, 221/255, 112/255, 24/255,
      0.9, 2, -0.5, 221/255, 112/255, 24/255,
      0.9, 2, 0.5, 221/255, 112/255, 24/255,
      1.075, 0, 0.5, 221/255, 112/255, 24/255,
      // bawah permukaan kubus
      -1.175, 0, -0.5, 221/255, 112/255, 24/255,
      -1.175, 0, 0.5, 221/255, 112/255, 24/255,
      1.075, 0, 0.5, 221/255, 112/255, 24/255,
      1.075, 0, -0.5, 221/255, 112/255, 24/255,
      // atas permukaan kubus
    -1, 2, -0.5, 221/255, 112/255, 24/255,
    -1, 2, 0.5, 221/255, 112/255, 24/255,
    0.9, 2, 0.5, 221/255, 112/255, 24/255,
    0.9, 2, -0.5, 221/255, 112/255, 24/255,
    // belakang permukaan kubus
    -1.2, 0, -0.5, 221/255, 112/255, 24/255,
    1.1, 0, -0.5, 221/255, 112/255, 24/255,
    0.9, 1, -0.5, 221/255, 112/255, 24/255,
    -1, 1, -0.5, 221/255, 112/255, 24/255
  ];

  var body_faces = [
    // tubuh bagian bawah
    0, 1, 2,
    0, 2, 3,
  
    4, 5, 6,
    4, 6, 7,
  
    8, 9, 10,
    8, 10, 11,
  
    12, 13, 14,
    12, 14, 15,
  
    16, 17, 18,
    16, 18, 19,
  
    20, 21, 22,
    20, 22, 23,
  
    20+4, 21+4, 22+4,
    20+4, 22+4, 23+4,

    20+8, 21+8, 22+8,
    20+8, 22+8, 23+8,

    20+12, 21+12, 22+12,
    20+12, 22+12, 23+12,

    20+16, 21+16, 22+16,
    20+16, 22+16, 23+16,

    20+20, 21+20, 22+20,
    20+20, 22+20, 23+20,

    20+24, 21+24, 22+24,
    20+24, 22+24, 23+24
  ];


  //Vertex , face robot r2d2

  

  var arm_Vertex = [
    // telapak kaki
    // depan permukaan kubus
    // -0.5, -0.5, 0.5, 221/255, 112/255, 29/255,
    // 0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
    // 0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
    // -0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
    // // kiri permukaan kubus
    // -0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
    // -0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
    // -0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
    // -0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
    //   // kanan permukaan kanan
    //   0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
    //   0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
    //   0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
    //   0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
    //   // bawah permukaan kubus
    //   -0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
    //   -0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
    //   0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
    //   0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
    //   // atas permukaan kubus
    // -0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
    // -0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
    // 0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
    // 0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
  
    // kaki
  // belakang permukaan balok (diperpanjang)
  -0.5, -1, -0.5, 0/255, 0/255, 0/255,
  -0.5, -1, 0.5, 221/255, 112/255, 24/255,
  -0.5, 1.5, 0.5, 221/255, 112/255, 24/255,
  -0.5, 1.5, -0.5, 221/255, 112/255, 24/255,
  // depan permukaan balok
  0.03125, -1, -0.5, 221/255, 112/255, 24/255,
  0.03125, -1, 0.5, 221/255, 112/255, 24/255,
  0.03125, 1.5, 0.5, 221/255, 112/255, 24/255,
  0.03125, 1.5, -0.5, 221/255, 112/255, 24/255,
  // kanan permukaan balok
  -0.5, -1, 0.5, 221/255, 112/255, 24/255,
  -0.5, 1.5, 0.5, 221/255, 112/255, 24/255,
  0.03125, 1.5, 0.5, 221/255, 112/255, 24/255,
  0.03125, -1, 0.5, 221/255, 112/255, 24/255,
  // kiri permukaan balok
  -0.5, -1, -0.5, 221/255, 112/255, 24/255,
  -0.5, 1.5, -0.5, 221/255, 112/255, 24/255,
  0.03125, 1.5, -0.5, 221/255, 112/255, 24/255,
  0.03125, -1, -0.5, 221/255, 112/255, 24/255
  ];


var arm_faces = [
  0, 1, 2,
  0, 2, 3,

  4, 5, 6,
  4, 6, 7,

  8, 9, 10,
  8, 10, 11,

  12, 13, 14,
  12, 14, 15,

  16, 17, 18,
  16, 18, 19,

  20, 21, 22,
  20, 22, 23,

  24, 25, 26,
  24, 26, 27,

  28, 29, 30,
  28, 30, 31,

  32, 33, 34,
  32, 34, 35
];

var arm2_Vertex = [
  // telapak kaki
  // depan permukaan kubus
  // -0.5, -0.5, 0.5, 221/255, 112/255, 29/255,
  // 0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
  // 0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  // -0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  // // kiri permukaan kubus
  // -0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
  // -0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
  // -0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  // -0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
  //   // kanan permukaan kanan
  //   0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
  //   0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
  //   0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  //   0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
    // // bawah permukaan kubus
    // -0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
    // -0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
    // 0.5, -0.5, 0.5, 221/255, 112/255, 24/255,
    // 0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
    // // atas permukaan kubus
  // -0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
  // -0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  // 0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  // 0.5, 0.25, -0.5, 221/255, 112/255, 24/255,

  // kaki
  // belakang permukaan balok (diperpanjang)
  -0.5, -1, -0.5, 0/255, 0/255, 0/255,
  -0.5, -1, 0.5, 221/255, 112/255, 24/255,
  -0.5, 1.5, 0.5, 221/255, 112/255, 24/255,
  -0.5, 1.5, -0.5, 221/255, 112/255, 24/255,
  // depan permukaan balok
  0.03125, -1, -0.5, 221/255, 112/255, 24/255,
  0.03125, -1, 0.5, 221/255, 112/255, 24/255,
  0.03125, 1.5, 0.5, 221/255, 112/255, 24/255,
  0.03125, 1.5, -0.5, 221/255, 112/255, 24/255,
  // kanan permukaan balok
  -0.5, -1, 0.5, 221/255, 112/255, 24/255,
  -0.5, 1.5, 0.5, 221/255, 112/255, 24/255,
  0.03125, 1.5, 0.5, 221/255, 112/255, 24/255,
  0.03125, -1, 0.5, 221/255, 112/255, 24/255,
  // kiri permukaan balok
  -0.5, -1, -0.5, 221/255, 112/255, 24/255,
  -0.5, 1.5, -0.5, 221/255, 112/255, 24/255,
  0.03125, 1.5, -0.5, 221/255, 112/255, 24/255,
  0.03125, -1, -0.5, 221/255, 112/255, 24/255
  ];


var arm2_faces = [
0, 1, 2,
0, 2, 3,

4, 5, 6,
4, 6, 7,

8, 9, 10,
8, 10, 11,

12, 13, 14,
12, 14, 15,

16, 17, 18,
16, 18, 19,

20, 21, 22,
20, 22, 23,

24, 25, 26,
24, 26, 27,

28, 29, 30,
28, 30, 31,

32, 33, 34,
32, 34, 35
];

var foot_vertex = [
  // tubuh bawah
  // depan permukaan kubus
  -1.2, -0.5, 0.5, 221/255, 112/255, 24/255,
  1.1, -0.5, 0.5, 221/255, 112/255, 24/255,
  1.1, 0.0002, 0.5, 221/255, 112/255, 24/255,
  -1.2, 0.0002, 0.5, 221/255, 112/255, 24/255,
  // kiri permukaan kubus
  -1.175, -0.5, -0.5, 221/255, 112/255, 24/255,
  -1.175, 0.0002, -0.5, 221/255, 112/255, 24/255,
  -1.175, 0.0002, 0.5, 221/255, 112/255, 24/255,
  -1.175, -0.5, 0.5, 221/255, 112/255, 24/255,
    // kanan permukaan kubus
    1.075, -0.5, -0.5, 221/255, 112/255, 24/255,
    1.075, 0.0002, -0.5, 221/255, 112/255, 24/255,
    1.075, 0.0002, 0.5, 221/255, 112/255, 24/255,
    1.075, -0.5, 0.5, 221/255, 112/255, 24/255,
    // bawah permukaan kubus
    -1.2, -0.5, -0.5, 221/255, 112/255, 24/255,
    -1.2, -0.5, 0.5, 221/255, 112/255, 24/255,
    1.1, -0.5, 0.5, 221/255, 112/255, 24/255,
    1.1, -0.5, -0.5, 221/255, 112/255, 24/255,
    // atas permukaan kubus
  -1.2, 0.0002, -0.5, 221/255, 112/255, 24/255,
  -1.2, 0.0002, 0.5, 221/255, 112/255, 24/255,
  1.1, 0.0002, 0.5, 221/255, 112/255, 24/255,
  1.1, 0.0002, -0.5, 221/255, 112/255, 24/255,
  // belakang permukaan kubus
  -1.2, -0.5, -0.5, 221/255, 112/255, 24/255,
  1.1, -0.5, -0.5, 221/255, 112/255, 24/255,
  1.1, 0.0002, -0.5, 221/255, 112/255, 24/255,
  -1.2, 0.0002, -0.5, 221/255, 112/255, 24/255,

  // tubuh atas
  // depan permukaan kubus
  1.08, 0.0002, 0.5, 221/255, 112/255, 24/255,
  -1.175, 0.0002, 0.5, 221/255, 112/255, 24/255,
  -1, 0.5, 0.5, 221/255, 112/255, 24/255,
  0.9, 0.5, 0.5, 221/255, 112/255, 24/255,
  // kiri permukaan kubus
  -1.175, 0.0002, -0.5, 221/255, 112/255, 24/255,
  -1, 0.5, -0.5, 221/255, 112/255, 24/255,
  -1, 0.5, 0.5, 221/255, 112/255, 24/255,
  -1.175, 0.0002, 0.5, 221/255, 112/255, 24/255,
    // kanan permukaan kubus
    1.08, 0.0002, -0.5, 221/255, 112/255, 24/255,
    0.9, 0.5, -0.5, 221/255, 112/255, 24/255,
    0.9, 0.5, 0.5, 221/255, 112/255, 24/255,
    1.08, 0.0002, 0.5, 221/255, 112/255, 24/255,
    // bawah permukaan kubus
    -1.175, 0, -0.5, 221/255, 112/255, 24/255,
    -1.175, 0, 0.5, 221/255, 112/255, 24/255,
    1.075, 0, 0.5, 221/255, 112/255, 24/255,
    1.075, 0, -0.5, 221/255, 112/255, 24/255,
    // atas permukaan kubus
  -1, 0.5, -0.5, 221/255, 112/255, 24/255,
  -1, 0.5, 0.5, 221/255, 112/255, 24/255,
  0.9, 0.5, 0.5, 221/255, 112/255, 24/255,
  0.9, 0.5, -0.5, 221/255, 112/255, 24/255,
  // belakang permukaan kubus
  1.08, 0.0002, -0.5, 221/255, 112/255, 24/255,
  -1.175, 0.0002, -0.5, 221/255, 112/255, 24/255,
  -1, 0.5, -0.5, 221/255, 112/255, 24/255,
  0.9, 0.5, -0.5, 221/255, 112/255, 24/255,
];

var foot_faces = [
  // tubuh bagian bawah
  0, 1, 2,
  0, 2, 3,

  4, 5, 6,
  4, 6, 7,

  8, 9, 10,
  8, 10, 11,

  12, 13, 14,
  12, 14, 15,

  16, 17, 18,
  16, 18, 19,

  20, 21, 22,
  20, 22, 23,

  20+4, 21+4, 22+4,
  20+4, 22+4, 23+4,

  20+8, 21+8, 22+8,
  20+8, 22+8, 23+8,

  20+12, 21+12, 22+12,
  20+12, 22+12, 23+12,

  20+16, 21+16, 22+16,
  20+16, 22+16, 23+16,

  20+20, 21+20, 22+20,
  20+20, 22+20, 23+20,

  20+24, 21+24, 22+24,
  20+24, 22+24, 23+24
];


  var head_array = generateSphere(0, 0, -0.25, 0.5, 100);
  var shoulder_array = generateSphere2(0, 0, -0.25, 0.5, 100);

  var neck_array = generateCylinderVerti(0, 2.3, (CANVAS.width / 2), (CANVAS.height / 2));
  var neck_deco_array = generateCylinderHorizon(0, 1.3, (CANVAS.width / 7), (CANVAS.height / 7));

  var wraist_array = generateCylinderHorizon(0, 2.3, (CANVAS.width / 2), (CANVAS.height / 2));
  var hand_array = generateCylinderVerti(0, 1.3, (CANVAS.width / 3), (CANVAS.height / 3));
  var arm_array = generateCylinderHorizonRotate(0, 0.6, (CANVAS.width / 2.35), (CANVAS.height / 2.35), [221/255, 112/255, 24/255])
  var inner_arm_array = generateCylinderHorizonRotate(0, 0.61, (CANVAS.width / 3.05), (CANVAS.height / 3.05), [128/255, 128/255, 128/255])

  //robot r2d2 array

  var body_robot_array = generateCylinderVerti(0, 4, (CANVAS.width), (CANVAS.height), [128/255, 128/255, 128/255])
  var head_robot_array = generateSphereFull(0 , 0, -0.25, 1, 100)
  var top_robot_head = generateCylinderVerti(0, 1, (CANVAS.width/3), (CANVAS.height/3), [128/255, 128/255, 128/255])
  var robot_arm_extension = generateCylinderHorizon(0, 1, (CANVAS.width / 3), (CANVAS.height / 3), [221/255, 112/255, 24/255])
  var robot_arm_extension2 = generateCylinderHorizon(0, 1, (CANVAS.width / 3), (CANVAS.height / 3), [221/255, 112/255, 24/255])
  var robot_arm_upper = generateCylinderHorizon(0, 1, (CANVAS.width / 1.5), (CANVAS.height / 1.5), [221/255, 112/255, 24/255])
  var robot_arm_upper2 = generateCylinderHorizon(0, 1, (CANVAS.width / 1.5), (CANVAS.height / 1.5), [221/255, 112/255, 24/255])



  
  var head = new MyObject(head_array.vertices, head_array.faces, shader_fragment_source, shader_vertex_source);
    
  var wraist = new MyObject(wraist_array.vertices, wraist_array.faces, shader_fragment_source, shader_vertex_source);

  var rightLeg = new MyObject(legVertex, triangle_faces, shader_fragment_source, shader_vertex_source);
  
  var leftLeg = new MyObject(legVertex, triangle_faces, shader_fragment_source, shader_vertex_source);

  var body = new MyObject(bodyVertex, body_faces, shader_fragment_source, shader_vertex_source);
  
  var neck = new MyObject(neck_array.vertices, neck_array.faces, shader_fragment_source, shader_vertex_source);

  var rightHand = new MyObject(hand_array.vertices,hand_array.faces, shader_fragment_source, shader_vertex_source);

  var rightShoulder = new MyObject(shoulder_array.vertices, shoulder_array.faces, shader_fragment_source, shader_vertex_source);

  var leftHand = new MyObject(hand_array.vertices,hand_array.faces, shader_fragment_source, shader_vertex_source);

  var leftShoulder = new MyObject(shoulder_array.vertices, shoulder_array.faces, shader_fragment_source, shader_vertex_source);

  var rightArm = new MyObject(arm_array.vertices,arm_array.faces, shader_fragment_source, shader_vertex_source)

  var leftArm = new MyObject(arm_array.vertices,arm_array.faces, shader_fragment_source, shader_vertex_source);

  var innerRightArm = new MyObject(inner_arm_array.vertices,inner_arm_array.faces, shader_fragment_source, shader_vertex_source);
  
  var innerLeftArm = new MyObject(inner_arm_array.vertices,inner_arm_array.faces, shader_fragment_source, shader_vertex_source);

  var neckDeco = new MyObject(neck_deco_array.vertices,neck_deco_array.faces, shader_fragment_source, shader_vertex_source);

  //Robot r2d2

  var robotBody = new MyObject(body_robot_array.vertices , neck_deco_array.faces , shader_fragment_source ,shader_vertex_source);

  var robotHead = new MyObject(head_robot_array.vertices , head_robot_array.faces, shader_fragment_source , shader_vertex_source);

  var topRobot = new MyObject(top_robot_head.vertices , top_robot_head.faces, shader_fragment_source , shader_vertex_source);

  var armExtension = new MyObject(robot_arm_extension.vertices , robot_arm_extension.faces , shader_fragment_source , shader_vertex_source);

  var armExtension2 = new MyObject(robot_arm_extension2.vertices , robot_arm_extension2.faces , shader_fragment_source , shader_vertex_source);

  var armUpper = new MyObject(robot_arm_upper.vertices , robot_arm_upper.faces , shader_fragment_source , shader_vertex_source);

  var armUpper2 = new MyObject(robot_arm_upper2.vertices , robot_arm_upper2.faces , shader_fragment_source , shader_vertex_source);

  var armRobot = new MyObject(arm_Vertex , arm_faces , shader_fragment_source , shader_vertex_source);

  var armRobot2 = new MyObject(arm2_Vertex , arm2_faces , shader_fragment_source , shader_vertex_source);
  
  var footRobot = new MyObject(foot_vertex , foot_faces , shader_fragment_source , shader_vertex_source);



  wraist.addChild(rightLeg);
  wraist.addChild(leftLeg);
  rightHand.addChild(rightShoulder);
  leftHand.addChild(leftShoulder);
  rightArm.addChild(innerRightArm);
  leftArm.addChild(innerLeftArm);
  neck.addChild(neckDeco);

  var PROJMATRIX = LIBS.get_projection(
    40,
    CANVAS.width / CANVAS.height,
    1,
    100
  );
  var VIEWMATRIX = LIBS.get_I4();

  wraist.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(wraist.MOVEMATRIX, wraist.MOVEMATRIX, [-1.15, 0.0, 0.0]);
  
  rightLeg.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(rightLeg.MOVEMATRIX, rightLeg.MOVEMATRIX, [-0.65, -1, 0.0]);
  
  LIBS.translateZ(VIEWMATRIX, -20);
  
  leftLeg.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(leftLeg.MOVEMATRIX, leftLeg.MOVEMATRIX, [0.65, -1, 0.0]);

  body.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(body.MOVEMATRIX, body.MOVEMATRIX, [0.05, 0.95, 0.0]);

  neck.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(neck.MOVEMATRIX, neck.MOVEMATRIX, [0, 1.5, 0.0]);

  head.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(head.MOVEMATRIX, head.MOVEMATRIX, [-0.5, 3.5,-0.25]);

  rightHand.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(rightHand.MOVEMATRIX, rightHand.MOVEMATRIX, [-1.53, 1,0]);
  glMatrix.mat4.rotateZ(rightHand.MOVEMATRIX, rightHand.MOVEMATRIX, degrees_to_radians(-8));

  rightShoulder.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(rightShoulder.MOVEMATRIX, rightShoulder.MOVEMATRIX, [-1.42, 1.3,-0.25]);

  leftHand.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(leftHand.MOVEMATRIX, leftHand.MOVEMATRIX, [1.53, 1,0]);
  glMatrix.mat4.rotateY(leftHand.MOVEMATRIX, leftHand.MOVEMATRIX, degrees_to_radians(180));
  glMatrix.mat4.rotateZ(leftHand.MOVEMATRIX, leftHand.MOVEMATRIX, degrees_to_radians(-8));

  leftShoulder.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(leftShoulder.MOVEMATRIX, leftShoulder.MOVEMATRIX, [1.42, 1.3,0.25]);
  glMatrix.mat4.rotateY(leftShoulder.MOVEMATRIX, leftShoulder.MOVEMATRIX, degrees_to_radians(180));

  rightArm.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(rightArm.MOVEMATRIX, rightArm.MOVEMATRIX, [-1.55, 0.75,-0.3]);

  leftArm.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(leftArm.MOVEMATRIX, leftArm.MOVEMATRIX, [1.55, 0.75,-0.3]);

  innerRightArm.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(innerRightArm.MOVEMATRIX, innerRightArm.MOVEMATRIX, [-1.55, 0.645,-0.305]);

  innerLeftArm.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(innerLeftArm.MOVEMATRIX, innerLeftArm.MOVEMATRIX, [1.55, 0.645,-0.305]);

  neckDeco.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(neckDeco.MOVEMATRIX, neckDeco.MOVEMATRIX, [-0.65, 3.4, 0.0]);

  //robo r2d2

  robotBody.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(robotBody.MOVEMATRIX, robotBody.MOVEMATRIX, [6, 0.0, 0.0]);

  robotHead.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(robotHead.MOVEMATRIX, robotHead.MOVEMATRIX, [6, 4, 0.27])

  topRobot.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(topRobot.MOVEMATRIX, topRobot.MOVEMATRIX, [6, 4.2, 0])

  armExtension.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(armExtension.MOVEMATRIX, armExtension.MOVEMATRIX,[6.2 , 3 , 0])

  armExtension2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(armExtension2.MOVEMATRIX, armExtension2.MOVEMATRIX,[4.8 , 3 , 0])

  armUpper.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(armUpper.MOVEMATRIX, armUpper.MOVEMATRIX,[3.9 , 3 , 0])

  armUpper2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(armUpper2.MOVEMATRIX, armUpper2.MOVEMATRIX,[7.1 , 3 , 0])

  armRobot.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(armRobot.MOVEMATRIX, armRobot.MOVEMATRIX,[7.9, 1 ,0])

  armRobot2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(armRobot2.MOVEMATRIX, armRobot2.MOVEMATRIX,[4.7, 1 ,0])

  footRobot.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(footRobot.MOVEMATRIX, footRobot.MOVEMATRIX,[10, 1 ,0])



  




  
  // Drawing
  GL.clearColor(0.0, 0.0, 0.0, 0.0);

  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);

  GL.clearDepth(1.0);
  var time_prev = 0;

  var animate = function (time) {
    var dt = time - time_prev;
    if (time > 0) {
      // mencegah kalau time = null
      var dt = time - time_prev;
      if (!drag) {
        (dX *= AMORTIZATION), (dY *= AMORTIZATION);
        (THETA += dX), (PHI += dY);
      }
      // LIBS.rotateX(MOVEMATRIX, dt*0.0004);
      // LIBS.rotateY(MOVEMATRIX, dt*0.0004);
      // LIBS.rotateZ(MOVEMATRIX, dt*0.0004);
      // console.log(dt);
      // time_prev = time;
      glMatrix.mat4.rotateY(VIEWMATRIX, VIEWMATRIX, THETA*0.1);
      // glMatrix.mat4.rotateX(VIEWMATRIX, VIEWMATRIX, PHI*0.1);
      // glMatrix.mat4.rotateY(shoulder.MOVEMATRIX, shoulder.MOVEMATRIX, THETA*0.1);
      // glMatrix.mat4.rotateX(shoulder.MOVEMATRIX, shoulder.MOVEMATRIX, -PHI*0.1);
      // glMatrix.mat4.rotateY(hand.MOVEMATRIX, hand.MOVEMATRIX, THETA*0.1);
      // glMatrix.mat4.rotateX(hand.MOVEMATRIX, hand.MOVEMATRIX, PHI*0.1);
    }

    wraist.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    rightLeg.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    leftLeg.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    body.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    neck.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    head.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    rightHand.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    rightShoulder.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    leftHand.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    leftShoulder.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    rightArm.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    leftArm.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    innerRightArm.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    innerLeftArm.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    neckDeco.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);

    //robo r2d2
    robotBody.setuniformmatrix4(PROJMATRIX,VIEWMATRIX);
    robotHead.setuniformmatrix4(PROJMATRIX,VIEWMATRIX);
    topRobot.setuniformmatrix4(PROJMATRIX,VIEWMATRIX);
    armExtension.setuniformmatrix4(PROJMATRIX,VIEWMATRIX);
    armExtension2.setuniformmatrix4(PROJMATRIX,VIEWMATRIX);
    armUpper.setuniformmatrix4(PROJMATRIX,VIEWMATRIX);
    armUpper2.setuniformmatrix4(PROJMATRIX,VIEWMATRIX);
    armRobot.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    armRobot2.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    footRobot.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);



    // wraist.setIdentityMove();
    // temps = LIBS.get_I4();

    // LIBS.translateX(temps, 1);
    // wraist.MOVEMATRIX = LIBS.mul(wraist.MOVEMATRIX, temps);

    // temps = LIBS.get_I4();
    // LIBS.rotateY(temps, THETA);
    // wraist.MOVEMATRIX = LIBS.mul(wraist.MOVEMATRIX, temps);

    // temps = LIBS.get_I4();
    // LIBS.translateX(temps, -1);
    // // LIBS.rotateX(temps, THETA);
    // wraist.MOVEMATRIX = LIBS.mul(wraist.MOVEMATRIX, temps)
    // wraist.setTranslateMove(PHI, THETA, 0);
    // leg.draw();

    // wraist.child[0].setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    // console.log(LIBS.degToRad(time*0.05))

    // console.log(LIBS.degToRad(dt*0.05));
    // WEBGL MATRIX
    // THETA = LIBS.degToRad(dt*0.05)
    // leg.MOVEMATRIX = glMatrix.mat4.create();
    // leg.child[0].MOVEMATRIX = glMatrix.mat4.create();
    // glMatrix.mat4.translate(leg.MOVEMATRIX, leg.MOVEMATRIX, [-0.65, -1, 0.0]);
    // glMatrix.mat4.translate(leg.child[0].MOVEMATRIX, leg.child[0].MOVEMATRIX, [0.65, -1, 0.0]);
    // console.log((LIBS.degToRad(dt*0.05)))

    // if (THETA % 2 < 0.5) {
    //   THETA -= (LIBS.degToRad(dt*0.05))
    //   // out itu buta nyimpen hasil perhitungane
    //   glMatrix.mat4.translate(leg.MOVEMATRIX, leg.MOVEMATRIX, [1.0, 0.0, 0.0]);
    //   glMatrix.mat4.translate(leg.child[0].MOVEMATRIX, leg.child[0].MOVEMATRIX, [1.0, 0.0, 0.0]);

    //   glMatrix.mat4.rotateX(leg.MOVEMATRIX, leg.MOVEMATRIX, THETA);
    //   glMatrix.mat4.rotateX(leg.child[0].MOVEMATRIX, leg.child[0].MOVEMATRIX, THETA);

    //   glMatrix.mat4.translate(leg.MOVEMATRIX, leg.MOVEMATRIX, [-1.0, 0.0, 0.0]);
    //   glMatrix.mat4.translate(leg.child[0].MOVEMATRIX, leg.child[0].MOVEMATRIX, [-1.0, 0.0, 0.0]);
    //   // console.log("lol")
    //   // wraist.draw();
    // } 
    // else {
    //   THETA += (LIBS.degToRad(dt*0.05))
    //   // out itu buta nyimpen hasil perhitungane
    //   glMatrix.mat4.translate(leg.MOVEMATRIX, leg.MOVEMATRIX, [1.0, 0.0, 0.0]);
    //   glMatrix.mat4.translate(leg.child[0].MOVEMATRIX, leg.child[0].MOVEMATRIX, [1.0, 0.0, 0.0]);

    //   glMatrix.mat4.rotateX(leg.MOVEMATRIX, leg.MOVEMATRIX, THETA);
    //   glMatrix.mat4.rotateX(leg.child[0].MOVEMATRIX, leg.child[0].MOVEMATRIX, THETA);

    //   glMatrix.mat4.translate(leg.MOVEMATRIX, leg.MOVEMATRIX, [-1.0, 0.0, 0.0]);
    //   glMatrix.mat4.translate(leg.child[0].MOVEMATRIX, leg.child[0].MOVEMATRIX, [-1.0, 0.0, 0.0]);
    // }
    wraist.draw();
    body.draw();
    neck.draw();
    head.draw();
    rightHand.draw();
    leftHand.draw();
    rightArm.draw();
    leftArm.draw();
    neckDeco.draw();

    //robo r2d2
    robotBody.draw();
    robotHead.draw();
    topRobot.draw();
    armExtension.draw();
    armExtension2.draw();
    armUpper.draw();
    armUpper2.draw();
    armRobot.draw();
    armRobot2.draw();
    footRobot.draw();

    
    GL.flush();
    window.requestAnimationFrame(animate);
  };

  animate();
}
window.addEventListener("load", main);
