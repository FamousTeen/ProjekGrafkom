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

  var drag = false;
  var x_prev, y_prev;
  var dX = 0,
    dY = 0;
  var THETA = 0,
    PHI = 0;
  var AMORTIZATION = 0.1;
  var rotationX = 0;
  var rotationY = 0;

  var keyDown = function (e) {
    switch (e.key) {
      case "a":
        rotationY -= 0.01;
        drag = true;
        break;

      case "d":
        rotationY += 0.01;
        drag = true;
        break;

      case "w":
        rotationX -= 0.01;
        drag = true;
        break;

      case "s":
        rotationX += 0.01;
        drag = true;
        break;
    }
  };

  var keyUp = function (e) {
    drag = false;
  };

  var mouseDown = function (e) {
    drag = true;
    x_prev = e.pageX;
    y_prev = e.pageY;
    e.preventDefault(); // buat batesi default action mouse
    return false;
  };

  var mouseUp = function (e) {
    drag = false;
  };

  var mouseMove = function (e) {
    if (!drag) {
      // jika drag == false
      return false;
    }

    // var dX = e.pageX - x_prev;
    // var dY = e.pageY - y_prev;
    // THETA += dX * 2 * Math.PI / CANVAS.width;
    // PHI += dY * 2 * Math.PI / CANVAS.height;
    dX = ((e.pageX - x_prev) * 2 * Math.PI) / CANVAS.width;
    dY = ((e.pageY - y_prev) * 2 * Math.PI) / CANVAS.height;
    THETA += dX;
    PHI += dY;
    x_prev = e.pageX;
    y_prev = e.pageY;
    e.preventDefault();
  };

  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);

  CANVAS.addEventListener("mousedown", mouseDown, false);
  CANVAS.addEventListener("mouseup", mouseUp);
  CANVAS.addEventListener("mouseout", mouseUp, false); // luar dari canvas
  CANVAS.addEventListener("mousemove", mouseMove, false); // pas mouse e gerak

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
  -0.5, 0, 0.03125, 221/255, 112/255, 24/255,
  0.5, 0, 0.03125, 221/255, 112/255, 24/255,
  0.5, 1.5, 0.03125, 221/255, 112/255, 24/255,
  -0.5, 1.5, 0.03125, 221/255, 112/255, 24/255,
  // kanan permukaan balok
  0.5, 0, -0.5, 221/255, 112/255, 24/255,
  0.5, 1.5, -0.5, 221/255, 112/255, 24/255,
  0.5, 1.5, 0.03125, 221/255, 112/255, 24/255,
  0.5, 0, 0.03125, 221/255, 112/255, 24/255,
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

// pinggang
var waistVertex = [];

function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi / 180);
}

waistVertex.push(0);
waistVertex.push(0);
waistVertex.push(0);
waistVertex.push(221/255);
waistVertex.push(112/255);
waistVertex.push(24/255);

for (var i = 0; i <= 720; i++) {
  if (i <= 360) {
    var x =
      ((CANVAS.width / 2) * Math.cos(degrees_to_radians(i))) / CANVAS.width;
    var y =
      ((CANVAS.height / 2) * Math.sin(degrees_to_radians(i))) / CANVAS.height;
    waistVertex.push(0);
    waistVertex.push(x);
    waistVertex.push(y);
    waistVertex.push(221/255);
    waistVertex.push(112/255);
    waistVertex.push(24/255);
  }
  if (i == 360) {
    waistVertex.push(1);
    waistVertex.push(0);
    waistVertex.push(0);
    waistVertex.push(221/255);
    waistVertex.push(112/255);
    waistVertex.push(24/255);
  }
  if (i >= 360) {
    var x =
      ((CANVAS.width / 2) * Math.cos(degrees_to_radians(i % 360))) /
      CANVAS.width;
    var y =
      ((CANVAS.height / 2) * Math.sin(degrees_to_radians(i % 360))) /
      CANVAS.height;
    waistVertex.push(2.3);
    waistVertex.push(x);
    waistVertex.push(y);
    waistVertex.push(221/255);
    waistVertex.push(112/255);
    waistVertex.push(24/255);
  }
  if (i == 720) {
    var x =
      ((CANVAS.width / 2) * Math.cos(degrees_to_radians(360))) / CANVAS.width;
    var y =
      ((CANVAS.height / 2) * Math.sin(degrees_to_radians(360))) /
      CANVAS.height;
    waistVertex.push(1);
    waistVertex.push(x);
    waistVertex.push(y);
    waistVertex.push(221/255);
    waistVertex.push(112/255);
    waistVertex.push(24/255);
  }
}

var waist_faces = []

  for (var i = 0; i < waistVertex.length / 6 - 1; i++) {
    if (i <= 360) {
      waist_faces.push(0);
      waist_faces.push(i);
      waist_faces.push(i + 1);
    }
    if (i > 362) {
      waist_faces.push(362);
      waist_faces.push(i);
      waist_faces.push(i + 1);
    }
  }

  var bottom_circle_index = 0;
  var top_circle_index = 363;

  for (var i = 0; i <= 360; i++) {
    waist_faces.push(bottom_circle_index);
    waist_faces.push(bottom_circle_index + 1);
    waist_faces.push(top_circle_index);
    waist_faces.push(top_circle_index);
    waist_faces.push(top_circle_index + 1);
    waist_faces.push(bottom_circle_index + 1);
    bottom_circle_index++;
    top_circle_index++;
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

  // neck
  var neckVertex = []
  neckVertex.push(0);
  neckVertex.push(0);
  neckVertex.push(0);
  neckVertex.push(221/255);
  neckVertex.push(112/255);
  neckVertex.push(24/255);

  for (var i = 0; i <= 720; i++) {
    if (i <= 360) {
      var x =
        ((CANVAS.width / 2) * Math.cos(degrees_to_radians(i))) / CANVAS.width;
      var y =
        ((CANVAS.height / 2) * Math.sin(degrees_to_radians(i))) / CANVAS.height;
        neckVertex.push(x);
      neckVertex.push(0);
      neckVertex.push(y);
      neckVertex.push(221/255);
      neckVertex.push(112/255);
      neckVertex.push(24/255);
    }
    if (i == 360) {
      neckVertex.push(0);
      neckVertex.push(1);
      neckVertex.push(0);
      neckVertex.push(221/255);
      neckVertex.push(112/255);
      neckVertex.push(24/255);
    }
    if (i >= 360) {
      var x =
        ((CANVAS.width / 2) * Math.cos(degrees_to_radians(i % 360))) /
        CANVAS.width;
      var y =
        ((CANVAS.height / 2) * Math.sin(degrees_to_radians(i % 360))) /
        CANVAS.height;
        neckVertex.push(x);
      neckVertex.push(2.3);
      neckVertex.push(y);
      neckVertex.push(221/255);
      neckVertex.push(112/255);
      neckVertex.push(24/255);
    }
    if (i == 720) {
      var x =
        ((CANVAS.width / 2) * Math.cos(degrees_to_radians(360))) / CANVAS.width;
      var y =
        ((CANVAS.height / 2) * Math.sin(degrees_to_radians(360))) /
        CANVAS.height;
        neckVertex.push(x);
      neckVertex.push(1);
      neckVertex.push(y);
      neckVertex.push(221/255);
      neckVertex.push(112/255);
      neckVertex.push(24/255);
    }
  }

  var neck_faces = []

    for (var i = 0; i < neckVertex.length / 6 - 1; i++) {
      if (i <= 360) {
        neck_faces.push(0);
        neck_faces.push(i);
        neck_faces.push(i + 1);
      }
      if (i > 362) {
        neck_faces.push(362);
        neck_faces.push(i);
        neck_faces.push(i + 1);
      }
    }

    var bottom_circle_index = 0;
    var top_circle_index = 363;

    for (var i = 0; i <= 360; i++) {
      neck_faces.push(bottom_circle_index);
      neck_faces.push(bottom_circle_index + 1);
      neck_faces.push(top_circle_index);
      neck_faces.push(top_circle_index);
      neck_faces.push(top_circle_index + 1);
      neck_faces.push(bottom_circle_index + 1);
      bottom_circle_index++;
      top_circle_index++;
    }

    var bodyVertex2 = []
  bodyVertex2.push(0);
  bodyVertex2.push(0);
  bodyVertex2.push(0);
  bodyVertex2.push(221/255);
  bodyVertex2.push(112/255);
  bodyVertex2.push(24/255);

  for (var i = 0; i <= 720; i++) {
    if (i <= 360) {
      var x =
        ((CANVAS.width) * Math.cos(degrees_to_radians(i))) / CANVAS.width;
      var y =
        ((CANVAS.height) * Math.sin(degrees_to_radians(i))) / CANVAS.height;
        bodyVertex2.push(x);
      bodyVertex2.push(0);
      bodyVertex2.push(y);
      bodyVertex2.push(221/255);
      bodyVertex2.push(112/255);
      bodyVertex2.push(24/255);
    }
    if (i == 360) {
      bodyVertex2.push(0);
      bodyVertex2.push(1);
      bodyVertex2.push(0);
      bodyVertex2.push(221/255);
      bodyVertex2.push(112/255);
      bodyVertex2.push(24/255);
    }
    if (i >= 360) {
      var x =
        ((CANVAS.width) * Math.cos(degrees_to_radians(i % 360))) /
        CANVAS.width;
      var y =
        ((CANVAS.height) * Math.sin(degrees_to_radians(i % 360))) /
        CANVAS.height;
        bodyVertex2.push(x);
      bodyVertex2.push(2.3);
      bodyVertex2.push(y);
      bodyVertex2.push(221/255);
      bodyVertex2.push(112/255);
      bodyVertex2.push(24/255);
    }
    if (i == 720) {
      var x =
        ((CANVAS.width) * Math.cos(degrees_to_radians(360))) / CANVAS.width;
      var y =
        ((CANVAS.height) * Math.sin(degrees_to_radians(360))) /
        CANVAS.height;
        bodyVertex2.push(x);
      bodyVertex2.push(1);
      bodyVertex2.push(y);
      bodyVertex2.push(221/255);
      bodyVertex2.push(112/255);
      bodyVertex2.push(24/255);
    }
  }

  var body_faces2 = []

    for (var i = 0; i < bodyVertex2.length / 6 - 1; i++) {
      if (i <= 360) {
        body_faces2.push(0);
        body_faces2.push(i);
        body_faces2.push(i + 1);
      }
      if (i > 362) {
        body_faces2.push(362);
        body_faces2.push(i);
        body_faces2.push(i + 1);
      }
    }

    var bottom_circle_index = 0;
    var top_circle_index = 363;

    for (var i = 0; i <= 360; i++) {
      body_faces2.push(bottom_circle_index);
      body_faces2.push(bottom_circle_index + 1);
      body_faces2.push(top_circle_index);
      body_faces2.push(top_circle_index);
      body_faces2.push(top_circle_index + 1);
      body_faces2.push(bottom_circle_index + 1);
      bottom_circle_index++;
      top_circle_index++;
    }

  var head_array = generateSphere(0, 0, -0.25, 0.5, 100);
  var head_array2 = generateSphere(0, 0, -0.25, 0.5, 100);

  var head = new MyObject(head_array.vertices, head_array.faces, shader_fragment_source, shader_vertex_source);
  var head2 = new MyObject(head_array2.vertices, head_array2.faces, shader_fragment_source, shader_vertex_source);
  
  var wraist = new MyObject(waistVertex, waist_faces, shader_fragment_source, shader_vertex_source);

  var leg = new MyObject(legVertex, triangle_faces, shader_fragment_source, shader_vertex_source);
  var leg2 = new MyObject(legVertex, triangle_faces, shader_fragment_source, shader_vertex_source);

  var body = new MyObject(bodyVertex, body_faces, shader_fragment_source, shader_vertex_source);
  
  var neck = new MyObject(neckVertex, neck_faces, shader_fragment_source, shader_vertex_source);

  var body2 = new MyObject(bodyVertex2, body_faces2, shader_fragment_source, shader_vertex_source);


  leg.addChild(leg2);

  var PROJMATRIX = LIBS.get_projection(
    40,
    CANVAS.width / CANVAS.height,
    1,
    100
  );
  var VIEWMATRIX = LIBS.get_I4();

  wraist.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(wraist.MOVEMATRIX, wraist.MOVEMATRIX, [-1.15, 0.0, 0.0]);
  
  leg.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(leg.MOVEMATRIX, leg.MOVEMATRIX, [-0.65, -1, 0.0]);
  
  LIBS.translateZ(VIEWMATRIX, -20);
  
  leg.child[0].MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(leg.child[0].MOVEMATRIX, leg.child[0].MOVEMATRIX, [0.65, -1, 0.0]);

  body.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(body.MOVEMATRIX, body.MOVEMATRIX, [0.05, 0.95, 0.0]);

  neck.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(neck.MOVEMATRIX, neck.MOVEMATRIX, [0, 1.5, 0.0]);

  head.MOVEMATRIX = glMatrix.mat4.create();
  head2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(head.MOVEMATRIX, head.MOVEMATRIX, [-0.5, 3.25,0]);

  body2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(body2.MOVEMATRIX, body2.MOVEMATRIX, [-0.5, 5.25,0]);

  //Drawing
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
        dX *= AMORTIZATION;
        dY *= AMORTIZATION;
        THETA += dX;
        PHI += dY;
      }
      // LIBS.rotateX(MOVEMATRIX, dt*0.0004);
      // LIBS.rotateY(MOVEMATRIX, dt*0.0004);
      // LIBS.rotateZ(MOVEMATRIX, dt*0.0004);
      // console.log(dt);
      // time_prev = time;
      glMatrix.mat4.rotateY(VIEWMATRIX, VIEWMATRIX, THETA*0.1);
      glMatrix.mat4.rotateX(VIEWMATRIX, VIEWMATRIX, PHI*0.1);
    }

    wraist.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    leg.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    leg.child[0].setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    body.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    neck.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    head.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    head2.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    body2.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    // wraist.draw();

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
    leg.MOVEMATRIX = glMatrix.mat4.create();
    leg.child[0].MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(leg.MOVEMATRIX, leg.MOVEMATRIX, [-0.65, -1, 0.0]);
    glMatrix.mat4.translate(leg.child[0].MOVEMATRIX, leg.child[0].MOVEMATRIX, [0.65, -1, 0.0]);
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
    leg.draw();
    body.draw();
    neck.draw();
    head.draw();
    body2.draw();
    
    GL.flush();
    window.requestAnimationFrame(animate);
  };

  animate();
}
window.addEventListener("load", main);
