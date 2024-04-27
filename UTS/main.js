var GL;

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
      // console.log(C);
      x += controlPoint[key * 2] * C;
      y += controlPoint[key * 2 + 1] * C;
      // console.log(t + " " + degree + " " + x + " " + y + " " + C);
    }
    curves.push(x);
    curves.push(y);
    curves.push(0.03125);
  }
  // console.log(curves);
  return curves;
}

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
  uniform_color;

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
    this.uniform_color = GL.getUniformLocation(this.SHADER_PROGRAM, "outColor");

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

  drawSpline() {
      GL.useProgram(this.SHADER_PROGRAM);
      
      var bspline = generateBSpline(this.object_vertex, 100, 2);

      GL.vertexAttribPointer(this._position, 3, GL.FLOAT, false, 4 * (3 + 3), 0);
      
      var bspline_vbo = GL.createBuffer();
      GL.bindBuffer(GL.ARRAY_BUFFER, bspline_vbo);
      GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(bspline), GL.STATIC_DRAW);

      GL.uniform3f(this.uniform_color, 1, 1, 1);

      GL.bindBuffer(GL.ARRAY_BUFFER, bspline_vbo);
      GL.drawArrays(GL.LINE_STRIP, 0, bspline.length / 3);
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

//Mace Windu
function generateMulut_Lego (x, y, radius, segments){
  var segments = 50;
  var radius = 0.6; // Radius silinder
  var height = 0.05; // Tinggi silinder
  
  var vertices = [];
  var faces = [];
  
  // Warna oranye
  var Color = [0, 0, 0];
  
  // Membuat sisi silinder
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      for (var j = 0; j <= segments; j++) {
          var u = j / segments;
          var x = radius * cosTheta;
          var y = height * u - height / 2; // Menggunakan u untuk ketinggian silinder
          var z = radius * sinTheta;
  
          vertices.push(x, y, z);
          vertices.push(...Color); // Menambahkan warna
      }
  }
  
  // Menambahkan wajah untuk sisi silinder
  for (var i = 0; i < segments; i++) {
      for (var j = 0; j < segments; j++) {
          var index = i * (segments + 1) + j;
          var nextIndex = index + segments + 1;
  
          faces.push(index, nextIndex, index + 1);
          faces.push(nextIndex, nextIndex + 1, index + 1);
      }
  }
  
  // Menambahkan tutup atas
  for (var i = 0; i < segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = height / 2; // Ketinggian atas silinder
      var z = radius * sinTheta;
  
      vertices.push(x, y, z,);
      vertices.push(...Color); // Menambahkan warna
  }
  
  var topCenterIndex = vertices.length / 6 - 1;
  
    // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(topCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  // Menambahkan tutup bawah
  for (var i = 0; i < segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = -height / 2; // Ketinggian bawah silinder
      var z = radius * sinTheta;
  
      vertices.push(x, y, z);
      vertices.push(...Color); // Menambahkan warna
  }
  
  var bottomCenterIndex = vertices.length / 6 - 1;
  
    // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(bottomCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  return { vertices: vertices, faces: faces };
}

function generateMata2_Lego(x, y , radius, segments) {
  var segments = 50;
  var radius = 0.10; // Radius silinder
  var height = 0.5; // Tinggi silinder
  
  var vertices = [];
  var faces = [];

  var Color = [0,0,0];
  
  
  // Membuat sisi silinder
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      for (var j = 0; j <= segments; j++) {
          var z = (height * j) / segments - height / 2;
          var x = radius * cosTheta;
          var y = radius * sinTheta;
  
          vertices.push(x, y, z);
          vertices.push(...Color);
      }
  }
  
  // Menambahkan wajah untuk sisi silinder
  for (var i = 0; i < segments; i++) {
      for (var j = 0; j < segments; j++) {
          var index = i * (segments + 1) + j;
          var nextIndex = index + segments + 1;
  
          faces.push(index, nextIndex, index + 1);
          faces.push(nextIndex, nextIndex + 1, index + 1);
      }
  }
  
  // Menambahkan tutup atas
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = radius * sinTheta;
      var z = height / 2;
  
      vertices.push(x, y, z);
      vertices.push(...Color);
  }
  
  var topCenterIndex = vertices.length / 6 - 1;
  
  // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(topCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  // Menambahkan tutup bawah
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = radius * sinTheta;
      var z = -height / 2;
  
      vertices.push(x, y, z);
      vertices.push(...Color);
  }
  
  var bottomCenterIndex = vertices.length / 6 - 1;
  
  // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(bottomCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  return { vertices: vertices, faces: faces };
}

function generateMata_Lego(x, y , radius, segments) {
  var segments = 50;
  var radius = 0.10; // Radius silinder
  var height = 0.5; // Tinggi silinder
  
  var vertices = [];
  var faces = [];

  var Color = [0,0,0];
  
  
  // Membuat sisi silinder
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      for (var j = 0; j <= segments; j++) {
          var z = (height * j) / segments - height / 2;
          var x = radius * cosTheta;
          var y = radius * sinTheta;
  
          vertices.push(x, y, z);
          vertices.push(...Color);
      }
  }
  
  // Menambahkan wajah untuk sisi silinder
  for (var i = 0; i < segments; i++) {
      for (var j = 0; j < segments; j++) {
          var index = i * (segments + 1) + j;
          var nextIndex = index + segments + 1;
  
          faces.push(index, nextIndex, index + 1);
          faces.push(nextIndex, nextIndex + 1, index + 1);
      }
  }
  
  // Menambahkan tutup atas
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = radius * sinTheta;
      var z = height / 2;
  
      vertices.push(x, y, z);
      vertices.push(...Color);
  }
  
  var topCenterIndex = vertices.length / 6 - 1;
  
  // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(topCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  // Menambahkan tutup bawah
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = radius * sinTheta;
      var z = -height / 2;
  
      vertices.push(x, y, z);
      vertices.push(...Color);
  }
  
  var bottomCenterIndex = vertices.length / 6 - 1;
  
  // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(bottomCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  return { vertices: vertices, faces: faces };
}

function generateSayap_Lego(y, height) {
  var vertices = [];
var faces = [];

var baseWidth = 3.0; // Panjang basis 
var topWidth = 0.96; // Panjang atas 
var height = 4.0; // Tinggi

// Definisi vertices untuk trapesium
var vertexPositions = [
  [baseWidth / 2, 0, 0],      
  [-baseWidth / 2, 0, 0],     
  [topWidth / 1, height, 0],  
  [-topWidth / 1, height, 0]  
];

// Memiringkan secara vertikal
var angle = -75 * Math.PI / 180; // Konversi derajat ke radian, dan arah rotasi dibalik
var cosAngle = Math.cos(angle);
var sinAngle = Math.sin(angle);

// Mengaplikasikan rotasi pada setiap titik trapesium
for (var i = 0; i < vertexPositions.length; i++) {
  var vertex = vertexPositions[i];
  var y = vertex[1];
  var z = vertex[2];
  vertex[1] = z * cosAngle - y * sinAngle;
  vertex[2] = z * sinAngle + y * cosAngle;
}

// Definisi wajah
var faceIndices = [
  [0, 1, 2], 
  [1, 3, 2]  
];

// Membuat vertices dan wajah
for (var i = 0; i < faceIndices.length; i++) {
  var face = faceIndices[i];
  for (var j = 0; j < face.length; j++) {
    var vertex = vertexPositions[face[j]];
    vertices.push(...vertex); // Menambahkan vertex
    vertices.push(139 / 255, 69 / 255, 19 / 255); //warna
  }
  // Membuat wajah
  var offset = i * 3;
  faces.push(offset, offset + 1, offset + 2);
}

return { vertices: vertices, faces: faces };

}

function generateLightSaber6_Lego (x, y, radius, segments){ // pegangan lightsaber
  var segments = 50;
  var radius = 0.30; // Radius silinder
  var height = 1.0; // Tinggi silinder
  
  var vertices = [];
  var faces = [];

  var Color = [169 / 255, 169 / 255, 169 / 255];
  
  // Membuat sisi silinder dan menambahkan warna
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      for (var j = 0; j <= segments; j++) {
          var z = (height * j) / segments - height / 2;
          var x = radius * cosTheta;
          var y = radius * sinTheta;
  
          vertices.push(x, y, z);
          vertices.push(...Color); // Menambahkan warna
          
          // Jangan menambahkan warna lagi di sini
      }
  }
  
  // Menambahkan wajah untuk sisi silinder
  for (var i = 0; i < segments; i++) {
      for (var j = 0; j < segments; j++) {
          var index = (i * (segments + 1) + j) * 2; // Mengkoreksi indeks untuk warna
          var nextIndex = index + segments + 1;
  
          faces.push(index, nextIndex, index + 1);
          faces.push(nextIndex, nextIndex + 1, index + 1);
      }
  }
  
  // Menambahkan tutup atas
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = radius * sinTheta;
      var z = height / 2;
  
      vertices.push(x, y, z);
      vertices.push(...Color); // Menambahkan warna
  }
  
  var topCenterIndex = vertices.length / 6 - 1; // Mengkoreksi indeks untuk warna
  
    // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(topCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  // Menambahkan tutup bawah
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = radius * sinTheta;
      var z = -height / 2;
  
      vertices.push(x, y, z);
      vertices.push(...Color); // Menambahkan warna
  }
  
  var bottomCenterIndex = vertices.length / 6 - 1; // Mengkoreksi indeks untuk warna
  
  // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(bottomCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}

  
  return { vertices: vertices, faces: faces };
}

function generateLightSaber5_Lego (x, y, radius, segments){ //pegangan lightsaber
  var segments = 50;
  var radius = 0.30; // Radius silinder
  var height = 0.4; // Tinggi silinder
  
  var vertices = [];
  var faces = [];

  var Color = [169 / 255, 169 / 255, 169 / 255];
  
  
  // Membuat sisi silinder
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      for (var j = 0; j <= segments; j++) {
          var z = (height * j) / segments - height / 2;
          var x = radius * cosTheta;
          var y = radius * sinTheta;
  
          vertices.push(x, y, z);
          vertices.push(...Color);
      }
  }
  
  // Menambahkan wajah untuk sisi silinder
  for (var i = 0; i < segments; i++) {
      for (var j = 0; j < segments; j++) {
          var index = i * (segments + 1) + j;
          var nextIndex = index + segments + 1;
  
          faces.push(index, nextIndex, index + 1);
          faces.push(nextIndex, nextIndex + 1, index + 1);
      }
  }
  
  // Menambahkan tutup atas
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = radius * sinTheta;
      var z = height / 2;
  
      vertices.push(x, y, z);
      vertices.push(...Color);
  }
  
  var topCenterIndex = vertices.length / 6 - 1;
  
  // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(topCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  // Menambahkan tutup bawah
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = radius * sinTheta;
      var z = -height / 2;
  
      vertices.push(x, y, z);
      vertices.push(...Color);
  }
  
  var bottomCenterIndex = vertices.length / 6 - 1;
  
  // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(bottomCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  return { vertices: vertices, faces: faces };
}

function generateLightSaber4_Lego (x, y, radius, segments){ //pegangan lightsaber
  var segments = 50;
  var radius = 0.20; // Radius silinder
  var height = 0.2; // Tinggi silinder
  
  var vertices = [];
  var faces = [];

  var Color = [169 / 255, 169 / 255, 169 / 255];
  
  
  // Membuat sisi silinder
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      for (var j = 0; j <= segments; j++) {
          var z = (height * j) / segments - height / 2;
          var x = radius * cosTheta;
          var y = radius * sinTheta;
  
          vertices.push(x, y, z);
          vertices.push(...Color);
      }
  }
  
  // Menambahkan wajah untuk sisi silinder
  for (var i = 0; i < segments; i++) {
      for (var j = 0; j < segments; j++) {
          var index = i * (segments + 1) + j;
          var nextIndex = index + segments + 1;
  
          faces.push(index, nextIndex, index + 1);
          faces.push(nextIndex, nextIndex + 1, index + 1);
      }
  }
  
  // Menambahkan tutup atas
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = radius * sinTheta;
      var z = height / 2;
  
      vertices.push(x, y, z);
      vertices.push(...Color);
  }
  
  var topCenterIndex = vertices.length / 6 - 1;
  
  // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(topCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  // Menambahkan tutup bawah
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = radius * sinTheta;
      var z = -height / 2;
  
      vertices.push(x, y, z);
      vertices.push(...Color);
  }
  
  var bottomCenterIndex = vertices.length / 6 - 1;
  
  // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(bottomCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  return { vertices: vertices, faces: faces };
}

function generateLightSaber3_Lego (x, y, radius, segments){ //pegangan lightsaber
  var segments = 50;
  var radius = 0.40; // Radius silinder
  var height = 0.3; // Tinggi silinder
  
  var vertices = [];
  var faces = [];

  var Color = [169 / 255, 169 / 255, 169 / 255];
  
  
  // Membuat sisi silinder
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      for (var j = 0; j <= segments; j++) {
          var z = (height * j) / segments - height / 2;
          var x = radius * cosTheta;
          var y = radius * sinTheta;
  
          vertices.push(x, y, z);
          vertices.push(...Color);
      }
  }
  
  // Menambahkan wajah untuk sisi silinder
  for (var i = 0; i < segments; i++) {
      for (var j = 0; j < segments; j++) {
          var index = i * (segments + 1) + j;
          var nextIndex = index + segments + 1;
  
          faces.push(index, nextIndex, index + 1);
          faces.push(nextIndex, nextIndex + 1, index + 1);
      }
  }
  
  // Menambahkan tutup atas
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = radius * sinTheta;
      var z = height / 2;
  
      vertices.push(x, y, z);
      vertices.push(...Color);
  }
  
  var topCenterIndex = vertices.length / 6 - 1;
  
  // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(topCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  // Menambahkan tutup bawah
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = radius * sinTheta;
      var z = -height / 2;
  
      vertices.push(x, y, z);
      vertices.push(...Color);
  }
  
  var bottomCenterIndex = vertices.length / 6 - 1;
  
  // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(bottomCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  return { vertices: vertices, faces: faces };
}

function generateLightSaber2_Lego (x, y, radius, segments){ //pegangan lightsaber
  var segments = 50;
  var radius = 0.40; // Radius silinder
  var height = 0.3; // Tinggi silinder
  
  var vertices = [];
  var faces = [];

  var Color = [169 / 255, 169 / 255, 169 / 255];
  
  
  // Membuat sisi silinder
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      for (var j = 0; j <= segments; j++) {
          var z = (height * j) / segments - height / 2;
          var x = radius * cosTheta;
          var y = radius * sinTheta;
  
          vertices.push(x, y, z);
          vertices.push(...Color);
      }
  }
  
  // Menambahkan wajah untuk sisi silinder
  for (var i = 0; i < segments; i++) {
      for (var j = 0; j < segments; j++) {
          var index = i * (segments + 1) + j;
          var nextIndex = index + segments + 1;
  
          faces.push(index, nextIndex, index + 1);
          faces.push(nextIndex, nextIndex + 1, index + 1);
      }
  }
  
  // Menambahkan tutup atas
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = radius * sinTheta;
      var z = height / 2;
  
      vertices.push(x, y, z);
      vertices.push(...Color);
  }
  
  var topCenterIndex = vertices.length / 6 - 1;
  
  // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(topCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  // Menambahkan tutup bawah
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = radius * sinTheta;
      var z = -height / 2;
  
      vertices.push(x, y, z);
      vertices.push(...Color);
  }
  
  var bottomCenterIndex = vertices.length / 6 - 1;
  
  // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(bottomCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  return { vertices: vertices, faces: faces };
}  

function generateLightSaber1_Lego(x, y, radius, segments) { // laser LightSaber
  var segments = 50;
  var radius = 0.15; // Radius silinder
  var height = 5.0; // Tinggi silinder
  
  var vertices = [];
  var faces = [];

  var Color = [
      (128 + 0) / 255,
      (0 + 0) / 255,
      (128 + 255) / 255
  ];
  
  // Membuat sisi silinder dan menambahkan warna
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      for (var j = 0; j <= segments; j++) {
          var z = (height * j) / segments - height / 2;
          var x = radius * cosTheta;
          var y = radius * sinTheta;
  
          vertices.push(x, y, z);
          vertices.push(...Color); // Menambahkan warna
          
          // Jangan menambahkan warna lagi di sini
      }
  }
  
  // Menambahkan wajah untuk sisi silinder
  for (var i = 0; i < segments; i++) {
      for (var j = 0; j < segments; j++) {
          var index = (i * (segments + 1) + j) * 2; // Mengkoreksi indeks untuk warna
          var nextIndex = index + segments + 1;
  
          faces.push(index, nextIndex, index + 1);
          faces.push(nextIndex, nextIndex + 1, index + 1);
      }
  }
  
  // Menambahkan tutup atas
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = radius * sinTheta;
      var z = height / 2;
  
      vertices.push(x, y, z);
      vertices.push(...Color); // Menambahkan warna
  }
  
  var topCenterIndex = vertices.length / 6 - 1; // Mengkoreksi indeks untuk warna
  
    // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(topCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  // Menambahkan tutup bawah
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = radius * sinTheta;
      var z = -height / 2;
  
      vertices.push(x, y, z);
      vertices.push(...Color); // Menambahkan warna
  }
  
  var bottomCenterIndex = vertices.length / 6 - 1; // Mengkoreksi indeks untuk warna
  
  // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(bottomCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}

  
  return { vertices: vertices, faces: faces };
}


function generateCylinderKecil_Lego(x, y, radius, segments){ // di atas kepala lego
  var segments = 50;
  var radius = 0.5; // Radius silinder
  var height = 0.5; // Tinggi silinder
  
  var vertices = [];
  var faces = [];
  
  // Warna oranye
  var Color = [139 / 255, 69 / 255, 19 / 255]; // Nilai RGB dalam rentang 0-1
  
  // Membuat sisi silinder
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      for (var j = 0; j <= segments; j++) {
          var u = j / segments;
          var x = radius * cosTheta;
          var y = height * u - height / 2; // Menggunakan u untuk ketinggian silinder
          var z = radius * sinTheta;
  
          vertices.push(x, y, z);
          vertices.push(...Color); // Menambahkan warna
      }
  }
  
  // Menambahkan wajah untuk sisi silinder
  for (var i = 0; i < segments; i++) {
      for (var j = 0; j < segments; j++) {
          var index = i * (segments + 1) + j;
          var nextIndex = index + segments + 1;
  
          faces.push(index, nextIndex, index + 1);
          faces.push(nextIndex, nextIndex + 1, index + 1);
      }
  }
  
  // Menambahkan tutup atas
  for (var i = 0; i < segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = height / 2; // Ketinggian atas silinder
      var z = radius * sinTheta;
  
      vertices.push(x, y, z,);
      vertices.push(...Color); // Menambahkan warna
  }
  
  var topCenterIndex = vertices.length / 6 - 1;
  
    // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(topCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  // Menambahkan tutup bawah
  for (var i = 0; i < segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = -height / 2; // Ketinggian bawah silinder
      var z = radius * sinTheta;
  
      vertices.push(x, y, z);
      vertices.push(...Color); // Menambahkan warna
  }
  
  var bottomCenterIndex = vertices.length / 6 - 1;
  
    // Menambahkan wajah untuk sisi silinder
for (var i = 0; i < segments; i++) {
  for (var j = 0; j < segments; j++) {
      var index = i * (segments + 1) + j;
      var nextIndex = index + segments + 1;

      // Membuat wajah pertama
      faces.push(index, nextIndex, index + 1);
      // Membuat wajah kedua
      faces.push(bottomCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
  }
}
  
  return { vertices: vertices, faces: faces };
  
}

function generateCylinder_Lego(x, y, z, radius, segments) { // kepala lego
  var segments = 50;
  var radius = 0.8; // Radius silinder
  var height = 1.0; // Tinggi silinder
  
  var vertices = [];
  var faces = [];
  
  // Warna oranye
  var Color = [139 / 255, 69 / 255, 19 / 255]; // Nilai RGB dalam rentang 0-1
  
  // Membuat sisi silinder
  for (var i = 0; i <= segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      for (var j = 0; j <= segments; j++) {
          var u = j / segments;
          var x = radius * cosTheta;
          var y = height * u - height / 2; // Menggunakan u untuk ketinggian silinder
          var z = radius * sinTheta;
  
          vertices.push(x, y, z);
          vertices.push(...Color);
      }
  }
  
  // Menambahkan wajah untuk sisi silinder
  for (var i = 0; i < segments; i++) {
      for (var j = 0; j < segments; j++) {
          var index = i * (segments + 1) + j;
          var nextIndex = index + segments + 1;
  
          faces.push(index, nextIndex, index + 1);
          faces.push(nextIndex, nextIndex + 1, index + 1);
      }
  }
  
  // Menambahkan tutup atas
  for (var i = 0; i < segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = height / 2; // Ketinggian atas silinder
      var z = radius * sinTheta;
  
      vertices.push(x, y, z);
      vertices.push(...Color);
  }
  
  var topCenterIndex = vertices.length / 6 - 1;
  
  for (var i = 0; i < segments; i++) {
    for (var j = 0; j < segments; j++) {
        var index = i * (segments + 1) + j;
        var nextIndex = index + segments + 1;
  
        // Membuat wajah pertama
        faces.push(index, nextIndex, index + 1);
        // Membuat wajah kedua
        faces.push(topCenterIndex-20,nextIndex, nextIndex + 1, index + 1);
    }
  }
  
  // Menambahkan tutup bawah
  for (var i = 0; i < segments; i++) {
      var theta = (2 * Math.PI * i) / segments;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
  
      var x = radius * cosTheta;
      var y = -height / 2; // Ketinggian bawah silinder
      var z = radius * sinTheta;
  
      vertices.push(x, y, z);
      vertices.push(...Color);
  }
  
  var bottomCenterIndex = vertices.length / 6 - 1;
  
  for (var i = 0; i < segments; i++) {
    for (var j = 0; j < segments; j++) {
        var index = i * (segments + 1) + j;
        var nextIndex = index + segments + 1;
  
        // Membuat wajah pertama
        faces.push(index, nextIndex, index + 1);
        // Membuat wajah kedua
        faces.push(bottomCenterIndex-40,nextIndex, nextIndex + 1, index + 1);
    }
  }
  
  return { vertices: vertices, faces: faces };
  
  // var faces = [];
  // for (var i = 0; i < segments; i++) {
  //   for (var j = 0; j < segments; j++) {
  //     var index = i * (segments + 1) + j;
  //     var nextIndex = index + segments + 1;

  //     faces.push(index, nextIndex, index + 1);
  //     faces.push(nextIndex, nextIndex + 1, index + 1);
  //   }
  // }

  // console.log(segments)
  // return { vertices: vertices, faces: faces };
}

function generateSphere2_Lego(x, y, z, radius, segments) {
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
      vertices.push(vertexX, vertexY, vertexZ, 210/255, 180/255, 140/255);
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

//--------------------------------------------------------------------------------------------------


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

function main() {
  var CANVAS = document.getElementById("mycanvas");

  CANVAS.width = window.innerWidth;
  CANVAS.height = window.innerHeight;
  var THETA = 0,
    PHI = 0;
  var drag = false;
  var x_prev, y_prev;
  var dX = 0,
    dY = 0;

  
// test
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

  var AMORTIZATION = 0.95;
  var THETA = 0,
    PHI = 0;
  var drag = false;
  var x_prev, y_prev;
  var dX = 0,
    dY = 0;

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

  CANVAS.addEventListener("mousedown", mouseDown, false);
  CANVAS.addEventListener("mouseup", mouseUp, false);
  CANVAS.addEventListener("mouseout", mouseUp, false);
  CANVAS.addEventListener("mousemove", mouseMove, false);

  // window.addEventListener("keydown", keyDown);
  // window.addEventListener("keyup", keyUp);

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

  var shader_fragment_source2 = `
        precision mediump float;
        uniform vec3 outColor;
        void main(void){
            gl_FragColor = vec4(outColor,1.);
        }
  `;

  // Mace Windu

  function generateCylinderHorizon_Lego(z1, z2, radius, radius2) { // kaki lutut
    var cylinderVertex = [];
    cylinderVertex.push(0);
    cylinderVertex.push(0);
    cylinderVertex.push(0);
    cylinderVertex.push(210/255);
    cylinderVertex.push(180/255);
    cylinderVertex.push(140/255);
  
  for (var i = 0; i <= 720; i++) {
    if (i <= 360) {
      var x =
        (radius * Math.cos(degrees_to_radians_Lego(i))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians_Lego(i))) / CANVAS.height;
      cylinderVertex.push(z1);
      cylinderVertex.push(x);
      cylinderVertex.push(y);
      cylinderVertex.push(210/255);
      cylinderVertex.push(180/255);
      cylinderVertex.push(140/255);
    }
    if (i == 360) {
      cylinderVertex.push(1);
      cylinderVertex.push(0);
      cylinderVertex.push(0);
      cylinderVertex.push(210/255);
      cylinderVertex.push(180/255);
      cylinderVertex.push(140/255);
    }
    if (i >= 360) {
      var x =
        (radius * Math.cos(degrees_to_radians_Lego(i % 360))) /
        CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians_Lego(i % 360))) /
        CANVAS.height;
      cylinderVertex.push(z2);
      cylinderVertex.push(x);
      cylinderVertex.push(y);
      cylinderVertex.push(210/255);
      cylinderVertex.push(180/255);
      cylinderVertex.push(140/255);
    }
    if (i == 720) {
      var x =
        (radius * Math.cos(degrees_to_radians_Lego(360))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians_Lego(360))) /
        CANVAS.height;
      cylinderVertex.push(z2);
      cylinderVertex.push(x);
      cylinderVertex.push(y);
      cylinderVertex.push(210/255);
      cylinderVertex.push(180/255);
      cylinderVertex.push(140/255);;
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

  function generateCylinderHorizonRotate_Lego(z1, z2, radius, radius2, array_color) { // buat tangan
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
        (radius * Math.cos(degrees_to_radians_Lego(i))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians_Lego(i))) / CANVAS.height;
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
        (radius * Math.cos(degrees_to_radians_Lego(i % 360))) /
        CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians_Lego(i % 360))) /
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
        (radius * Math.cos(degrees_to_radians_Lego(360))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians_Lego(360))) /
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

  function generateCylinderVerti_Lego(z1, z2, radius, radius2) { // buat leher dan lengan
    var cylinderVertex = []
  cylinderVertex.push(0);
  cylinderVertex.push(0);
  cylinderVertex.push(0);
  cylinderVertex.push(210/255);
  cylinderVertex.push(180/255);
  cylinderVertex.push(140/255);

  for (var i = 0; i <= 720; i++) {
    if (i <= 360) {
      var x =
        (radius * Math.cos(degrees_to_radians_Lego(i))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians_Lego(i))) / CANVAS.height;
      cylinderVertex.push(x);
      cylinderVertex.push(z1);
      cylinderVertex.push(y);
      cylinderVertex.push(210/255);
      cylinderVertex.push(180/255);
      cylinderVertex.push(140/255);
    }
    if (i == 360) {
      cylinderVertex.push(0);
      cylinderVertex.push(1);
      cylinderVertex.push(0);
      cylinderVertex.push(210/255);
      cylinderVertex.push(180/255);
      cylinderVertex.push(140/255);
    }
    if (i >= 360) {
      var x =
        (radius * Math.cos(degrees_to_radians_Lego(i % 360))) /
        CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians_Lego(i % 360))) /
        CANVAS.height;
      cylinderVertex.push(x);
      cylinderVertex.push(z2);
      cylinderVertex.push(y);
      cylinderVertex.push(210/255);
      cylinderVertex.push(180/255);
      cylinderVertex.push(140/255);
    }
    if (i == 720) {
      var x =
        (radius * Math.cos(degrees_to_radians_Lego(360))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians_Lego(360))) /
        CANVAS.height;
        cylinderVertex.push(x);
      cylinderVertex.push(1);
      cylinderVertex.push(y);
      cylinderVertex.push(210/255);
      cylinderVertex.push(180/255);
      cylinderVertex.push(140/255);
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

// Leg  
var legVertex_Lego = [
  // telapak kaki
  // depan permukaan kubus
  -0.5, -0.5, 0.5, 210/255, 180/255, 140/255, // Warna kaki depan permukaan kubus
  0.5, -0.5, 0.5, 210/255, 180/255, 140/255, // Warna kaki depan permukaan kubus
  0.5, 0.25, 0.5, 210/255, 180/255, 140/255, // Warna kaki depan permukaan kubus
  -0.5, 0.25, 0.5, 210/255, 180/255, 140/255, // Warna kaki depan permukaan kubus
  // kiri permukaan kubus
  -0.5, -0.5, -0.5, 210/255, 180/255, 140/255, // Warna kaki kiri permukaan kubus
  -0.5, 0.25, -0.5, 210/255, 180/255, 140/255, // Warna kaki kiri permukaan kubus
  -0.5, 0.25, 0.5, 210/255, 180/255, 140/255, // Warna kaki kiri permukaan kubus
  -0.5, -0.5, 0.5, 210/255, 180/255, 140/255, // Warna kaki kiri permukaan kubus
  // kanan permukaan kanan
  0.5, -0.5, -0.5, 210/255, 180/255, 140/255, // Warna kaki kanan permukaan kanan
  0.5, 0.25, -0.5, 210/255, 180/255, 140/255, // Warna kaki kanan permukaan kanan
  0.5, 0.25, 0.5, 210/255, 180/255, 140/255, // Warna kaki kanan permukaan kanan
  0.5, -0.5, 0.5, 210/255, 180/255, 140/255, // Warna kaki kanan permukaan kanan
  // bawah permukaan kubus
  -0.5, -0.5, -0.5, 210/255, 180/255, 140/255, // Warna kaki bawah permukaan kubus
  -0.5, -0.5, 0.5, 210/255, 180/255, 140/255, // Warna kaki bawah permukaan kubus
  0.5, -0.5, 0.5, 210/255, 180/255, 140/255, // Warna kaki bawah permukaan kubus
  0.5, -0.5, -0.5, 210/255, 180/255, 140/255, // Warna kaki bawah permukaan kubus
  // atas permukaan kubus
  -0.5, 0.25, -0.5, 210/255, 180/255, 140/255, // Warna kaki atas permukaan kubus
  -0.5, 0.25, 0.5, 210/255, 180/255, 140/255, // Warna kaki atas permukaan kubus
  0.5, 0.25, 0.5, 210/255, 180/255, 140/255, // Warna kaki atas permukaan kubus
  0.5, 0.25, -0.5, 210/255, 180/255, 140/255, // Warna kaki atas permukaan kubus

  // kaki
  // belakang permukaan balok (diperpanjang)
  -0.5, -0.5, -0.5, 210/255, 180/255, 140/255, // Warna kaki belakang permukaan balok (diperpanjang)
  0.5, -0.5, -0.5, 210/255, 180/255, 140/255, // Warna kaki belakang permukaan balok (diperpanjang)
  0.5, 1.5, -0.5, 210/255, 180/255, 140/255, // Warna kaki belakang permukaan balok (diperpanjang)
  -0.5, 1.5, -0.5, 210/255, 180/255, 140/255, // Warna kaki belakang permukaan balok (diperpanjang)
  // depan permukaan balok
  -0.5, 0, 0.03125, 210/255, 180/255, 140/255, // Warna kaki depan permukaan balok
  0.5, 0, 0.03125, 210/255, 180/255, 140/255, // Warna kaki depan permukaan balok
  0.5, 1.5, 0.03125, 210/255, 180/255, 140/255, // Warna kaki depan permukaan balok
  -0.5, 1.5, 0.03125, 210/255, 180/255, 140/255, // Warna kaki depan permukaan balok
  // kanan permukaan balok
  0.5, 0, -0.5, 210/255, 180/255, 140/255, // Warna kaki kanan permukaan balok
  0.5, 1.5, -0.5, 210/255, 180/255, 140/255, // Warna kaki kanan permukaan balok
  0.5, 1.5, 0.03125, 210/255, 180/255, 140/255, // Warna kaki kanan permukaan balok
  0.5, 0, 0.03125, 210/255, 180/255, 140/255, // Warna kaki kanan permukaan balok
  // kiri permukaan balok
  -0.5, -0.5, -0.5, 210/255, 180/255, 140/255, // Warna kaki kiri permukaan balok
  -0.5, 1.5, -0.5, 210/255, 180/255, 140/255, // Warna kaki kiri permukaan balok
  -0.5, 1.5, 0.03125, 210/255, 180/255, 140/255, // Warna kaki kiri permukaan balok
  -0.5, -0.5, 0.03125, 210/255, 180/255, 140/255 // Warna kaki kiri permukaan balok
];


var triangle_faces_Lego = [
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

function degrees_to_radians_Lego(degrees) {
  var pi = Math.PI;
  return degrees * (pi / 180);
}

  // body
var bodyVertex_Lego = [
  // tubuh bawah
  // depan permukaan kubus
  -1.2, -0.5, 0.5, 210/255, 180/255, 140/255,
  1.1, -0.5, 0.5, 210/255, 180/255, 140/255, 
  1.1, 0.0625, 0.5, 210/255, 180/255, 140/255, 
  -1.2, 0.0625, 0.5, 210/255, 180/255, 140/255, 
  // kiri permukaan kubus
  -1.175, -0.5, -0.5, 210/255, 180/255, 140/255, 
  -1.175, 0.0625, -0.5, 210/255, 180/255, 140/255, 
  -1.175, 0.0625, 0.5, 210/255, 180/255, 140/255, 
  -1.175, -0.5, 0.5, 210/255, 180/255, 140/255, 
  // kanan permukaan kubus
  1.075, -0.5, -0.5, 210/255, 180/255, 140/255, 
  1.075, 0.0625, -0.5, 210/255, 180/255, 140/255, 
  1.075, 0.0625, 0.5, 210/255, 180/255, 140/255, 
  1.075, -0.5, 0.5, 210/255, 180/255, 140/255, 
  // bawah permukaan kubus
  -1.2, -0.5, -0.5, 210/255, 180/255, 140/255, 
  -1.2, -0.5, 0.5, 210/255, 180/255, 140/255, 
  1.1, -0.5, 0.5, 210/255, 180/255, 140/255, 
  1.1, -0.5, -0.5, 210/255, 180/255, 140/255, 
  // atas permukaan kubus
  -1.2, 0.0625, -0.5, 210/255, 180/255, 140/255, 
  -1.2, 0.0625, 0.5, 210/255, 180/255, 140/255, 
  1.1, 0.0625, 0.5, 210/255, 180/255, 140/255, 
  1.1, 0.0625, -0.5, 210/255, 180/255, 140/255, 
  // belakang permukaan kubus
  -1.2, -0.5, -0.5, 210/255, 180/255, 140/255, 
  1.1, -0.5, -0.5, 210/255, 180/255, 140/255, 
  1.1, 0.0625, -0.5, 210/255, 180/255, 140/255,
  -1.2, 0.0625, -0.5, 210/255, 180/255, 140/255,

  // tubuh atas
  // depan permukaan kubus
  -1.2, 0, 0.5, 210/255, 180/255, 140/255,
  1.1, 0, 0.5, 210/255, 180/255, 140/255,
  0.9, 2, 0.5, 210/255, 180/255, 140/255,
  -1, 2, 0.5, 210/255, 180/255, 140/255,
  // kiri permukaan kubus
  -1.175, 0, -0.5, 210/255, 180/255, 140/255,
  -1, 2, -0.5, 210/255, 180/255, 140/255, 
  -1, 2, 0.5, 210/255, 180/255, 140/255, 
  -1.175, 0, 0.5, 210/255, 180/255, 140/255,
  // kanan permukaan kubus
  1.075, 0, -0.5, 210/255, 180/255, 140/255,
  0.9, 2, -0.5, 210/255, 180/255, 140/255,
  0.9, 2, 0.5, 210/255, 180/255, 140/255,
  1.075, 0, 0.5, 210/255, 180/255, 140/255,
  // bawah permukaan kubus
  -1.175, 0, -0.5, 210/255, 180/255, 140/255, 
  -1.175, 0, 0.5, 210/255, 180/255, 140/255, 
  1.075, 0, 0.5, 210/255, 180/255, 140/255, 
  1.075, 0, -0.5, 210/255, 180/255, 140/255, 
  // atas permukaan kubus
  -1, 2, -0.5, 210/255, 180/255, 140/255, 
  -1, 2, 0.5, 210/255, 180/255, 140/255, 
  0.9, 2, 0.5, 210/255, 180/255, 140/255, 
  0.9, 2, -0.5, 210/255, 180/255, 140/255, 
  // belakang permukaan kubus
  -1.2, 0, -0.5, 210/255, 180/255, 140/255, 
  1.1, 0, -0.5, 210/255, 180/255, 140/255, 
  0.9, 1, -0.5, 210/255, 180/255, 140/255, 
  -1, 1, -0.5, 210/255, 180/255, 140/255 
];


  var body_faces_Lego = [
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


  //----------------------------------------------------------------------------------

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
      cylinderVertex.push(array_color[1]);
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

  function generateCylinderVerti(z1, z2, radius, radius2, array_color) {
    var cylinderVertex = []
  cylinderVertex.push(0);
  cylinderVertex.push(0);
  cylinderVertex.push(0);
  cylinderVertex.push(array_color[0]);
      cylinderVertex.push(array_color[1]);
      cylinderVertex.push(array_color[2]);
  // cylinderVertex.push(221/255);
  // cylinderVertex.push(112/255);
  // cylinderVertex.push(24/255);

  for (var i = 0; i <= 720; i++) {
    if (i <= 360) {
      var x =
        (radius * Math.cos(degrees_to_radians(i))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(degrees_to_radians(i))) / CANVAS.height;
      cylinderVertex.push(x);
      cylinderVertex.push(z1);
      cylinderVertex.push(y);
      cylinderVertex.push(array_color[0]);
      cylinderVertex.push(array_color[1]);
      cylinderVertex.push(array_color[2]);
    }
    if (i == 360) {
      cylinderVertex.push(0);
      cylinderVertex.push(1);
      cylinderVertex.push(0);
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
      cylinderVertex.push(z2);
      cylinderVertex.push(y);
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
      cylinderVertex.push(1);
      cylinderVertex.push(y);
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

var leg_faces = [
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
    0.9, 2, -0.5, 221/255, 112/255, 24/255,
    -1, 2, -0.5, 221/255, 112/255, 24/255
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

    var mouthVertex = [
    // telapak kaki
    // depan permukaan kubus
    -0.25/1.5, -0.25/3, 0.5, 201/255, 92/255, 4/255,
    0.25/1.5, -0.25/3, 0.5, 201/255, 92/255, 4/255,
    0.25/1.5, 0.25/3, 0.5, 201/255, 92/255, 4/255,
    -0.25/1.5, 0.25/3, 0.5, 201/255, 92/255, 4/255,
    // kiri permukaan kubus
    -0.25/1.5, -0.25/3, -0.25, 201/255, 92/255, 4/255,
    -0.25/1.5, 0.25/3, -0.25, 201/255, 92/255, 4/255,
    -0.25/1.5, 0.25/3, 0.5, 201/255, 92/255, 4/255,
    -0.25/1.5, -0.25/3, 0.5, 201/255, 92/255, 4/255,
      // kanan permukaan kanan
      0.25/1.5, -0.25/3, -0.25, 201/255, 92/255, 4/255,
      0.25/1.5, 0.25/3, -0.25, 201/255, 92/255, 4/255,
      0.25/1.5, 0.25/3, 0.5, 201/255, 92/255, 4/255,
      0.25/1.5, -0.25/3, 0.5, 201/255, 92/255, 4/255,
      // bawah permukaan kubus
      -0.25/1.5, -0.25/3, -0.25, 201/255, 92/255, 4/255,
      -0.25/1.5, -0.25/3, 0.5, 201/255, 92/255, 4/255,
      0.25/1.5, -0.25/3, 0.5, 201/255, 92/255, 4/255,
      0.25/1.5, -0.25/3, -0.25, 201/255, 92/255, 4/255,
      // atas permukaan kubus
      -0.25/1.5, 0.25/3, -0.25, 201/255, 92/255, 4/255,
      -0.25/1.5, 0.25/3, 0.5, 201/255, 92/255, 4/255,
      0.25/1.5, 0.25/3, 0.5, 201/255, 92/255, 4/255,
      0.25/1.5, 0.25/3, -0.25, 201/255, 92/255, 4/255,
  
    // kaki
    // belakang permukaan balok (diperpanjang)
    -0.25/1.5, -0.25/3, -0.25, 201/255, 92/255, 4/255,
    0.25/1.5, -0.25/3, -0.25, 201/255, 92/255, 4/255,
    0.25/1.5, 0.25/3, -0.25, 201/255, 92/255, 4/255,
    -0.25/1.5, 0.25/3, -0.25, 201/255, 92/255, 4/255
  ];

    var mouth_faces = [
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
      20, 22, 23];


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
  -0.5, -0.5, -0.5, 0/255, 0/255, 0/255,
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
  -0.5, -0.5, -0.5, 0/255, 0/255, 0/255,
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

// var foot_vertex = [
//   // tubuh bawah
//   // depan permukaan kubus
//   -1.2, -0.5, 0.5, 221/255, 112/255, 24/255,
//   1.1, -0.5, 0.5, 221/255, 112/255, 24/255,
//   1.1, 0.0002, 0.5, 221/255, 112/255, 24/255,
//   -1.2, 0.0002, 0.5, 221/255, 112/255, 24/255,
//   // kiri permukaan kubus
//   -1.175, -0.5, -0.5, 221/255, 112/255, 24/255,
//   -1.175, 0.0002, -0.5, 221/255, 112/255, 24/255,
//   -1.175, 0.0002, 0.5, 221/255, 112/255, 24/255,
//   -1.175, -0.5, 0.5, 221/255, 112/255, 24/255,
//     // kanan permukaan kubus
//     1.075, -0.5, -0.5, 221/255, 112/255, 24/255,
//     1.075, 0.0002, -0.5, 221/255, 112/255, 24/255,
//     1.075, 0.0002, 0.5, 221/255, 112/255, 24/255,
//     1.075, -0.5, 0.5, 221/255, 112/255, 24/255,
//     // bawah permukaan kubus
//     -1.2, -0.5, -0.5, 221/255, 112/255, 24/255,
//     -1.2, -0.5, 0.5, 221/255, 112/255, 24/255,
//     1.1, -0.5, 0.5, 221/255, 112/255, 24/255,
//     1.1, -0.5, -0.5, 221/255, 112/255, 24/255,
//     // atas permukaan kubus
//   -1.2, 0.0002, -0.5, 221/255, 112/255, 24/255,
//   -1.2, 0.0002, 0.5, 221/255, 112/255, 24/255,
//   1.1, 0.0002, 0.5, 221/255, 112/255, 24/255,
//   1.1, 0.0002, -0.5, 221/255, 112/255, 24/255,
//   // belakang permukaan kubus
//   -1.2, -0.5, -0.5, 221/255, 112/255, 24/255,
//   1.1, -0.5, -0.5, 221/255, 112/255, 24/255,
//   1.1, 0.0002, -0.5, 221/255, 112/255, 24/255,
//   -1.2, 0.0002, -0.5, 221/255, 112/255, 24/255,

//   // tubuh atas
//   // depan permukaan kubus
//   1.08, 0.0002, 0.5, 221/255, 112/255, 24/255,
//   -1.175, 0.0002, 0.5, 221/255, 112/255, 24/255,
//   -0.35, 1, 0.25, 221/255, 112/255, 24/255,
//   0.35, 1, 0.25, 221/255, 112/255, 24/255,
//   // kiri permukaan kubus
//   -1.175, 0.0002, -0.5, 221/255, 112/255, 24/255,
//   -0.35, 1, -0.5, 221/255, 112/255, 24/255,
//   -0.35, 1, 0.25, 221/255, 112/255, 24/255,
//   -1.175, 0.0002, 0.5, 221/255, 112/255, 24/255,
//     // kanan permukaan kubus
//     1.08, 0.0002, -0.5, 221/255, 112/255, 24/255,
//     0.35, 1, -0.5, 221/255, 112/255, 24/255,
//     0.35, 1, 0.25, 221/255, 112/255, 24/255,
//     1.08, 0.0002, 0.5, 221/255, 112/255, 24/255,
//     // bawah permukaan kubus
//     -1.175, 0, -0.5, 221/255, 112/255, 24/255,
//     -1.175, 0, 0.5, 221/255, 112/255, 24/255,
//     1.075, 0, 0.5, 221/255, 112/255, 24/255,
//     1.075, 0, -0.5, 221/255, 112/255, 24/255,
//     // atas permukaan kubus
//   -0.35, 1, -0.5, 221/255, 112/255, 24/255,
//   -0.35, 1, 0.25, 221/255, 112/255, 24/255,
//   0.35, 1, 0.25, 221/255, 112/255, 24/255,
//   0.35, 1, -0.5, 221/255, 112/255, 24/255,
//   // belakang permukaan kubus
//   1.08, 0.0002, -0.5, 221/255, 112/255, 24/255,
//   -1.175, 0.0002, -0.5, 221/255, 112/255, 24/255,
//   -0.35, 1, -0.5, 221/255, 112/255, 24/255,
//   0.35, 1, -0.5, 221/255, 112/255, 24/255,
// ];

// var foot_faces = [
//   // tubuh bagian bawah
//   0, 1, 2,
//   0, 2, 3,

//   4, 5, 6,
//   4, 6, 7,

//   8, 9, 10,
//   8, 10, 11,

//   12, 13, 14,
//   12, 14, 15,

//   16, 17, 18,
//   16, 18, 19,

//   20, 21, 22,
//   20, 22, 23,

//   20+4, 21+4, 22+4,
//   20+4, 22+4, 23+4,

//   20+8, 21+8, 22+8,
//   20+8, 22+8, 23+8,

//   20+12, 21+12, 22+12,
//   20+12, 22+12, 23+12,

//   20+16, 21+16, 22+16,
//   20+16, 22+16, 23+16,

//   20+20, 21+20, 22+20,
//   20+20, 22+20, 23+20,

//   20+24, 21+24, 22+24,
//   20+24, 22+24, 23+24
// ];


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
  -0.35, 1, 0.25, 221/255, 112/255, 24/255,
  0.35, 1, 0.25, 221/255, 112/255, 24/255,
  // kiri permukaan kubus
  -1.175, 0.0002, -0.5, 221/255, 112/255, 24/255,
  -0.35, 1, -0.5, 221/255, 112/255, 24/255,
  -0.35, 1, 0.25, 221/255, 112/255, 24/255,
  -1.175, 0.0002, 0.5, 221/255, 112/255, 24/255,
    // kanan permukaan kubus
    1.08, 0.0002, -0.5, 221/255, 112/255, 24/255,
    0.35, 1, -0.5, 221/255, 112/255, 24/255,
    0.35, 1, 0.25, 221/255, 112/255, 24/255,
    1.08, 0.0002, 0.5, 221/255, 112/255, 24/255,
    // bawah permukaan kubus
    -1.175, 0, -0.5, 221/255, 112/255, 24/255,
    -1.175, 0, 0.5, 221/255, 112/255, 24/255,
    1.075, 0, 0.5, 221/255, 112/255, 24/255,
    1.075, 0, -0.5, 221/255, 112/255, 24/255,
    // atas permukaan kubus
  -0.35, 1, -0.5, 221/255, 112/255, 24/255,
  -0.35, 1, 0.25, 221/255, 112/255, 24/255,
  0.35, 1, 0.25, 221/255, 112/255, 24/255,
  0.35, 1, -0.5, 221/255, 112/255, 24/255,
  // belakang permukaan kubus
  1.08, 0.0002, -0.5, 221/255, 112/255, 24/255,
  -1.175, 0.0002, -0.5, 221/255, 112/255, 24/255,
  -0.35, 1, -0.5, 221/255, 112/255, 24/255,
  0.35, 1, -0.5, 221/255, 112/255, 24/255,
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

var triangle_robot_vertex = [
  // telapak kaki
  // bawah permukaan kubus
  -0.5, -0.5, -0.25, 221/255, 112/255, 24/255,
  -0.5, -0.5, 0.25, 221/255, 112/255, 24/255,
  0.25, -0.5, 0.25, 221/255, 112/255, 24/255,
  0.25, -0.5, -0.25, 221/255, 112/255, 24/255,
    // atas permukaan kubus
    -0.5, 0.0001, 0.25, 100/255, 42/255, 24/255,
    -0.5, 0.0001, -0.25, 100/255, 42/255, 24/255,
  0.25, -0.5, -0.25, 221/255, 42/255, 24/255,
  0.25, -0.5, 0.25, 221/255, 42/255, 24/255,
  // kiri permukaan kubus
  -0.5, -0.5, -0.25,100/255, 42/255, 24/255,
  -0.5, 0.0001, -0.25, 100/255, 42/255, 24/255,
  -0.5, 0.0001, 0.25, 100/255, 42/255, 24/255,
  -0.5, -0.5, 0.25, 100/255, 42/255, 24/255,
  // depan permukaan kubus
  -0.5, -0.5, 0.25, 221/255, 42/255, 24/255,
  0.25, -0.5, 0.25, 221/255, 42/255, 24/255,
  // 0.5, -0.5, 0.25, 221/255, 23/255, 24/255,
  -0.5, 0.001, 0.25, 221/255, 42/255, 24/255,
  //   // kanan permukaan kanan
  //   0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
  //   0.5, 0.25, -0.5, 221/255, 112/255, 24/255,
  //   0.5, 0.25, 0.5, 221/255, 112/255, 24/255,
  //   0.5, -0.5, 0.5, 221/255, 112/255, 24/255,

  // // kaki
  // // belakang permukaan balok (diperpanjang)
  -0.5, -0.5, -0.25, 221/255, 42/255, 24/255,
  0.25, -0.5, -0.25, 221/255, 42/255, 24/255,
  // 0.5, -0.5, 0.25, 221/255, 23/255, 24/255,
  -0.5, 0.0010, -0.25, 221/255, 42/255, 24/255,
  // // depan permukaan balok
  // -0.5, -0.5, 0.03125, 221/255, 112/255, 24/255,
  // 0.5, -0.5, 0.03125, 221/255, 112/255, 24/255,
  // 0.5, 1.5, 0.03125, 221/255, 112/255, 24/255,
  // -0.5, 1.5, 0.03125, 221/255, 112/255, 24/255,
  // // kanan permukaan balok
  // 0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
  // 0.5, 1.5, -0.5, 221/255, 112/255, 24/255,
  // 0.5, 1.5, 0.03125, 221/255, 112/255, 24/255,
  // 0.5, -0.5, 0.03125, 221/255, 112/255, 24/255,
  // // kiri permukaan balok
  // -0.5, -0.5, -0.5, 221/255, 112/255, 24/255,
  // -0.5, 1.5, -0.5, 221/255, 112/255, 24/255,
  // -0.5, 1.5, 0.03125, 221/255, 112/255, 24/255,
  // -0.5, -0.5, 0.03125, 221/255, 112/255, 24/255
];

var triangle_robot_faces = [
  0, 1, 2,
  0, 2, 3,

  4, 5, 6,
  4, 6, 7,

  8, 9, 10,
  8, 10, 11,

  12, 13, 14,
  12, 14,

  16-1, 17-1, 18-1,
  16-1, 18-1

  // 16, 17, 18,
  // 16, 18, 19,

  // 20, 21, 22,
  // 20, 22, 23,

  // 24, 25, 26,
  // 24, 26, 27,

  // 28, 29, 30,
  // 28, 30, 31,

  // 32, 33, 34,
  // 32, 34, 35
];


  var head_array = generateSphere(0, 0, -0.25, 0.5, 100);
  var eye_array = generateCylinderHorizonRotate(0, 0.6, (CANVAS.width / 5), (CANVAS.height / 3.5), [221/255, 112/255, 24/255])
  var inner_eye_array = generateCylinderHorizonRotate(0, 0.6, (CANVAS.width / 12), (CANVAS.height / 12), [201/255, 92/255, 4/255])

  var shoulder_array = generateSphere2(0, 0, -0.25, 0.5, 100);

  var neck_array = generateCylinderVerti(0, 2.3, (CANVAS.width / 2), (CANVAS.height / 2), [221/255, 112/255, 24/255]);
  var neck_deco_array = generateCylinderHorizon(0, 1.3, (CANVAS.width / 7), (CANVAS.height / 7));

  var wraist_array = generateCylinderHorizon(0, 2.3, (CANVAS.width / 2), (CANVAS.height / 2));
  var hand_array = generateCylinderVerti(0, 1.3, (CANVAS.width / 3), (CANVAS.height / 3), [221/255, 112/255, 24/255]);
  var arm_array = generateCylinderHorizonRotate(0, 0.6, (CANVAS.width / 2.35), (CANVAS.height / 2.35), [221/255, 112/255, 24/255])
  var inner_arm_array = generateCylinderHorizonRotate(0, 0.61, (CANVAS.width / 3.05), (CANVAS.height / 3.05), [128/255, 128/255, 128/255])

  var leg_deco1 = [0.5, -0.5, 0.6, -0.6];

  // var mouseDown = function (e) {
  //   leg_deco1.push(
  //     normalizeScreen(e.pageX, e.pageY, CANVAS.width, CANVAS.height)[0]
  //   );
  //   leg_deco1.push(
  //     normalizeScreen(e.pageX, e.pageY, CANVAS.width, CANVAS.height)[1]
  //   );
  //   console.log(normalizeScreen(e.pageX, e.pageY, CANVAS.width, CANVAS.height)[0]);
  //   console.log(normalizeScreen(e.pageX, e.pageY, CANVAS.width, CANVAS.height)[1]);
  // };

  CANVAS.addEventListener("mousedown", mouseDown, false);

  var head = new MyObject(head_array.vertices, head_array.faces, shader_fragment_source, shader_vertex_source);
    
  var wraist = new MyObject(wraist_array.vertices, wraist_array.faces, shader_fragment_source, shader_vertex_source);

  var rightLeg = new MyObject(legVertex, leg_faces, shader_fragment_source, shader_vertex_source);
  
  var leftLeg = new MyObject(legVertex, leg_faces, shader_fragment_source, shader_vertex_source);

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

  var rightEye = new MyObject(eye_array.vertices,eye_array.faces, shader_fragment_source, shader_vertex_source);

  var leftEye = new MyObject(eye_array.vertices,eye_array.faces, shader_fragment_source, shader_vertex_source);

  var innerRightEye = new MyObject(inner_eye_array.vertices,inner_eye_array.faces, shader_fragment_source, shader_vertex_source);

  var innerLeftEye = new MyObject(inner_eye_array.vertices,inner_eye_array.faces, shader_fragment_source, shader_vertex_source);

  var mouth = new MyObject(mouthVertex,mouth_faces, shader_fragment_source, shader_vertex_source);

  // var legDeco = new MyObject(leg_deco1,leg_deco1, shader_fragment_source, shader_vertex_source);

  body.addChild(rightArm);
  body.addChild(leftArm);
  body.addChild(wraist);
  body.addChild(rightLeg);
  body.addChild(leftLeg);
  rightArm.addChild(innerRightArm);
  leftArm.addChild(innerLeftArm);
  body.addChild(rightShoulder);
  body.addChild(leftShoulder);
  rightShoulder.addChild(rightHand);
  leftShoulder.addChild(leftHand);
  body.addChild(neck);
  neck.addChild(neckDeco);
  body.addChild(head)
  head.addChild(rightEye);
  head.addChild(leftEye);
  head.addChild(mouth);
  rightEye.addChild(innerRightEye);
  leftEye.addChild(innerLeftEye);

  //robot r2d2 array

  var body_robot_array = generateCylinderVerti(0, 4, (CANVAS.width), (CANVAS.height), [221/255, 112/255, 24/255])
  var head_robot_array = generateSphereFull(0 , 0, -0.25, 1, 100)
  var top_robot_head = generateCylinderVerti(0, 1, (CANVAS.width/3), (CANVAS.height/3), [128/255, 128/255, 128/255])
  var robot_arm_extension = generateCylinderHorizon(0, 1, (CANVAS.width / 3), (CANVAS.height / 3), [221/255, 112/255, 24/255])
  var robot_arm_extension2 = generateCylinderHorizon(0, 1, (CANVAS.width / 3), (CANVAS.height / 3), [221/255, 112/255, 24/255])
  var robot_arm_upper = generateCylinderHorizon(0, 1, (CANVAS.width / 1.5), (CANVAS.height / 1.5), [221/255, 112/255, 24/255])
  var robot_arm_upper2 = generateCylinderHorizon(0, 1, (CANVAS.width / 1.5), (CANVAS.height / 1.5), [221/255, 112/255, 24/255])
  var robot_bottom = generateCylinderVerti(0, 1, (CANVAS.width/3), (CANVAS.height/3), [1/255, 1/255, 200/255])
  

  //Mace Windu

   var mulut_array = generateMulut_Lego (0, 0, -0.25, 0.5, 100);

   var mata2_array = generateMata2_Lego (0, 0, -0.25, 0.5, 100);
 
   var mata_array = generateMata_Lego (0, 0, -0.25, 0.5, 100);
 
   var sayap_array = generateSayap_Lego (0, 0, -0.25, 0.5, 100);
 
   var saber_array6 = generateLightSaber6_Lego (0, 0, -0.25, 0.5, 100);
 
   var saber_array5 = generateLightSaber5_Lego (0, 0, -0.25, 0.5, 100);
 
   var saber_array4 = generateLightSaber4_Lego (0, 0, -0.25, 0.5, 100);
 
   var saber_array3 = generateLightSaber3_Lego (0, 0, -0.25, 0.5, 100);
 
   var saber_array2 = generateLightSaber2_Lego (0, 0 , -0.25, 0.5, 100);
 
   var saber_array1 = generateLightSaber1_Lego (0, 0 , -0.25, 0.5, 100);
 
   var head_array_kecil = generateCylinderKecil_Lego (0, 0, -0.25, 0.5, 100);
 
   var head_array_Lego = generateCylinder_Lego(0, 0, -0.25, 0.5, 100);
   var shoulder_array_Lego = generateSphere2_Lego(0, 0, -0.25, 0.5, 100);
 
   var neck_array_Lego = generateCylinderVerti_Lego(0, 2.3, (CANVAS.width / 2), (CANVAS.height / 2));
   var neck_deco_array_Lego = generateCylinderHorizon_Lego(1, 0.3, (CANVAS.width / 7), (CANVAS.height / 7));
 
   var wraist_array_Lego = generateCylinderHorizon_Lego(0, 2.3, (CANVAS.width / 2), (CANVAS.height / 2));
   var hand_array_Lego = generateCylinderVerti_Lego(0, 1.3, (CANVAS.width / 3), (CANVAS.height / 3));
   var arm_array_Lego = generateCylinderHorizonRotate_Lego(0, 0.6, (CANVAS.width / 2.35), (CANVAS.height / 2.35), [139/255, 69/255, 19/255]);
   var inner_arm_array_Lego = generateCylinderHorizonRotate_Lego(0, 0.61, (CANVAS.width / 3.05), (CANVAS.height / 3.05), [0, 0, 0]);

  //Mace Windu
  var mulut = new MyObject(mulut_array.vertices, mulut_array.faces, shader_fragment_source, shader_vertex_source);

  var mata2 = new MyObject(mata2_array.vertices, mata2_array.faces, shader_fragment_source, shader_vertex_source);

  var mata = new MyObject(mata_array.vertices, mata_array.faces, shader_fragment_source, shader_vertex_source);

  var sayap = new MyObject(sayap_array.vertices, sayap_array.faces, shader_fragment_source, shader_vertex_source);

  var saber6 = new MyObject(saber_array6.vertices, saber_array6.faces, shader_fragment_source, shader_vertex_source);

  var saber5 = new MyObject(saber_array5.vertices, saber_array5.faces, shader_fragment_source, shader_vertex_source);

  var saber4 = new MyObject(saber_array4.vertices, saber_array4.faces, shader_fragment_source, shader_vertex_source);

  var saber3 = new MyObject(saber_array3.vertices, saber_array3.faces, shader_fragment_source, shader_vertex_source);

  var saber2 = new MyObject(saber_array2.vertices, saber_array2.faces, shader_fragment_source, shader_vertex_source);

  var saber1 = new MyObject(saber_array1.vertices, saber_array1.faces, shader_fragment_source, shader_vertex_source);

  var headKecil = new MyObject(head_array_kecil.vertices, head_array_kecil.faces, shader_fragment_source, shader_vertex_source);
  
  var head_Lego = new MyObject(head_array_Lego.vertices, head_array_Lego.faces, shader_fragment_source, shader_vertex_source);
    
  var wraist_Lego = new MyObject(wraist_array_Lego.vertices, wraist_array_Lego.faces, shader_fragment_source, shader_vertex_source);

  var rightLeg_Lego = new MyObject(legVertex_Lego, triangle_faces_Lego, shader_fragment_source, shader_vertex_source);
  
  var leftLeg_Lego = new MyObject(legVertex_Lego, triangle_faces_Lego, shader_fragment_source, shader_vertex_source);

  var body_Lego = new MyObject(bodyVertex_Lego, body_faces_Lego, shader_fragment_source, shader_vertex_source);
  
  var neck_Lego = new MyObject(neck_array_Lego.vertices, neck_array_Lego.faces, shader_fragment_source, shader_vertex_source);

  var rightHand_Lego = new MyObject(hand_array_Lego.vertices,hand_array_Lego.faces, shader_fragment_source, shader_vertex_source);

  var rightShoulder_Lego = new MyObject(shoulder_array_Lego.vertices, shoulder_array_Lego.faces, shader_fragment_source, shader_vertex_source);

  var leftHand_Lego = new MyObject(hand_array_Lego.vertices,hand_array_Lego.faces, shader_fragment_source, shader_vertex_source);

  var leftShoulder_Lego = new MyObject(shoulder_array_Lego.vertices, shoulder_array_Lego.faces, shader_fragment_source, shader_vertex_source);

  var rightArm_Lego = new MyObject(arm_array_Lego.vertices,arm_array_Lego.faces, shader_fragment_source, shader_vertex_source)

  var leftArm_Lego = new MyObject(arm_array_Lego.vertices,arm_array_Lego.faces, shader_fragment_source, shader_vertex_source);

  var innerRightArm_Lego = new MyObject(inner_arm_array_Lego.vertices,inner_arm_array_Lego.faces, shader_fragment_source, shader_vertex_source);
  
  var innerLeftArm_Lego = new MyObject(inner_arm_array_Lego.vertices,inner_arm_array_Lego.faces, shader_fragment_source, shader_vertex_source);

  var neckDeco_Lego = new MyObject(neck_deco_array_Lego.vertices,neck_deco_array_Lego.faces, shader_fragment_source, shader_vertex_source);
  

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

  var footRobot2 = new MyObject(foot_vertex , foot_faces , shader_fragment_source , shader_vertex_source);

  var bottomRobot = new MyObject(robot_bottom.vertices , robot_bottom.faces , shader_fragment_source , shader_vertex_source);

  var triangleRobot = new MyObject(triangle_robot_vertex , triangle_robot_faces, shader_fragment_source , shader_vertex_source)
  
  var triangleRobot2 = new MyObject(triangle_robot_vertex , triangle_robot_faces, shader_fragment_source , shader_vertex_source)

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
  
  LIBS.translateZ(VIEWMATRIX, -15);
  
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

  rightEye.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(rightEye.MOVEMATRIX, rightEye.MOVEMATRIX, [-0.25, 4.15, 0.065]);

  leftEye.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(leftEye.MOVEMATRIX, leftEye.MOVEMATRIX, [0.25, 4.15, 0.065]);

  innerRightEye.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(innerRightEye.MOVEMATRIX, innerRightEye.MOVEMATRIX, [-0.25, 4.15, 0.0675]);

  innerLeftEye.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(innerLeftEye.MOVEMATRIX, innerLeftEye.MOVEMATRIX, [0.25, 4.15, 0.0675]);

  mouth.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(mouth.MOVEMATRIX, mouth.MOVEMATRIX, [0, 3.65, 0.05]);
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
  glMatrix.mat4.rotateY(armRobot.MOVEMATRIX,
    armRobot.MOVEMATRIX, degrees_to_radians(90));

  armRobot2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(armRobot2.MOVEMATRIX, armRobot2.MOVEMATRIX,[4.7, 1 ,0])
  glMatrix.mat4.rotateY(armRobot2.MOVEMATRIX,
    armRobot2.MOVEMATRIX, degrees_to_radians(90));
  

  footRobot.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(footRobot.MOVEMATRIX, footRobot.MOVEMATRIX,[7.8, 0 ,0])
  glMatrix.mat4.rotateY(footRobot.MOVEMATRIX,
  footRobot.MOVEMATRIX, degrees_to_radians(90));
  // glMatrix.mat4.rotateY(footRobot.MOVEMATRIX,
  // footRobot.MOVEMATRIX , degrees_to_radians(180))

  footRobot2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(footRobot2.MOVEMATRIX, footRobot2.MOVEMATRIX,[4.3, 0 ,0])
  glMatrix.mat4.rotateY(footRobot2.MOVEMATRIX,
  footRobot2.MOVEMATRIX, degrees_to_radians(90));
  glMatrix.mat4.rotateY(footRobot2.MOVEMATRIX,
    footRobot2.MOVEMATRIX , degrees_to_radians(180))

  bottomRobot.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(bottomRobot.MOVEMATRIX, bottomRobot.MOVEMATRIX,[6 , -0.46 , 0])

  triangleRobot.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(triangleRobot.MOVEMATRIX , triangleRobot.MOVEMATRIX , [6.8 ,-0.5 ,0 ])
  glMatrix.mat4.rotateX(triangleRobot.MOVEMATRIX,
    triangleRobot.MOVEMATRIX , degrees_to_radians(180))

    triangleRobot2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(triangleRobot2.MOVEMATRIX , triangleRobot.MOVEMATRIX , [-1.6   ,-0.01 ,0 ])
  glMatrix.mat4.rotateX(triangleRobot2.MOVEMATRIX,
    triangleRobot2.MOVEMATRIX , degrees_to_radians(180))
    glMatrix.mat4.rotateZ(triangleRobot2.MOVEMATRIX,
      triangleRobot2.MOVEMATRIX , degrees_to_radians(180))



  

  //Mace Windu
  mulut.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(mulut.MOVEMATRIX, mulut.MOVEMATRIX, [-5.55, 3.35, 0.196]);

  mata2.MOVEMATRIX = glMatrix.mat4.create(); // mata kanan
  glMatrix.mat4.translate(mata2.MOVEMATRIX, mata2.MOVEMATRIX, [-5.90, 3.80, 0.500]);

  mata.MOVEMATRIX = glMatrix.mat4.create(); // mata kiri
  glMatrix.mat4.translate(mata.MOVEMATRIX, mata.MOVEMATRIX, [-5.20, 3.80, 0.500]);

  sayap.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(sayap.MOVEMATRIX, sayap.MOVEMATRIX, [-5.55, -0.91, -1.532]);

  wraist_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(wraist_Lego.MOVEMATRIX, wraist_Lego.MOVEMATRIX, [-6.70, 0.0, 0.0]);
  
  rightLeg_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(rightLeg_Lego.MOVEMATRIX, rightLeg_Lego.MOVEMATRIX, [-6.21, -1, 0.0]);
  
  leftLeg_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(leftLeg_Lego.MOVEMATRIX, leftLeg_Lego.MOVEMATRIX, [-4.89, -1, 0.0]);

  body_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(body_Lego.MOVEMATRIX, body_Lego.MOVEMATRIX, [-5.50, 0.95, 0.0]);

  neck_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(neck_Lego.MOVEMATRIX, neck_Lego.MOVEMATRIX, [-5.55, 1.5, 0.0]);

  saber6.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(saber6.MOVEMATRIX, saber6.MOVEMATRIX, [-3.90, 0.455, 0.030]);

  saber5.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(saber5.MOVEMATRIX, saber5.MOVEMATRIX, [-3.90, 0.550, 0.700]);

  saber4.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(saber4.MOVEMATRIX, saber4.MOVEMATRIX, [-3.90, 0.550, -0.620]);

  saber3.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(saber3.MOVEMATRIX, saber3.MOVEMATRIX, [-3.90, 0.550, -0.450]);

  saber2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(saber2.MOVEMATRIX, saber2.MOVEMATRIX, [-3.90, 0.550, 0.450]);

  saber1.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(saber1.MOVEMATRIX, saber1.MOVEMATRIX, [-3.90, 0.550, 3.200]);

  headKecil.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(headKecil.MOVEMATRIX, headKecil.MOVEMATRIX, [-5.55, 4.2, -0.004]);

  head_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(head_Lego.MOVEMATRIX, head_Lego.MOVEMATRIX, [-5.55, 3.6,-0.04]);

  rightHand_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(rightHand_Lego.MOVEMATRIX, rightHand_Lego.MOVEMATRIX, [-7.10, 1,0]);
  glMatrix.mat4.rotateZ(rightHand_Lego.MOVEMATRIX, rightHand_Lego.MOVEMATRIX, degrees_to_radians_Lego(-8));

  rightShoulder_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(rightShoulder_Lego.MOVEMATRIX, rightShoulder_Lego.MOVEMATRIX, [-6.98, 1.3,-0.25]);

  leftHand_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(leftHand_Lego.MOVEMATRIX, leftHand_Lego.MOVEMATRIX, [-3.98, 1,0]);
  glMatrix.mat4.rotateY(leftHand_Lego.MOVEMATRIX, leftHand_Lego.MOVEMATRIX, degrees_to_radians_Lego(180));
  glMatrix.mat4.rotateZ(leftHand_Lego.MOVEMATRIX, leftHand_Lego.MOVEMATRIX, degrees_to_radians_Lego(-8));

  leftShoulder_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(leftShoulder_Lego.MOVEMATRIX, leftShoulder_Lego.MOVEMATRIX, [-4.10, 1.3,0.25]);
  glMatrix.mat4.rotateY(leftShoulder_Lego.MOVEMATRIX, leftShoulder_Lego.MOVEMATRIX, degrees_to_radians_Lego(180));

  rightArm_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(rightArm_Lego.MOVEMATRIX, rightArm_Lego.MOVEMATRIX, [-7.20, 0.60,-0.3]);

  leftArm_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(leftArm_Lego.MOVEMATRIX, leftArm_Lego.MOVEMATRIX, [-3.90, 0.60,-0.3]);

  innerRightArm_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(innerRightArm_Lego.MOVEMATRIX, innerRightArm_Lego.MOVEMATRIX, [-7.20, 0.490,-0.305]);

  innerLeftArm_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(innerLeftArm_Lego.MOVEMATRIX, innerLeftArm_Lego.MOVEMATRIX, [-3.90, 0.490,-0.305]);

  neckDeco_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(neckDeco_Lego.MOVEMATRIX, neckDeco_Lego.MOVEMATRIX, [-6.0, 3.4, 0.0]);

  
  // Drawing
  GL.clearColor(0.0, 0.0, 0.0, 0.0);

  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);

  GL.clearDepth(1.0);
  var time_prev = 0;

  // C-3P0
  var goombaPos = [0,0,0];
  var goombaMoveSpeed = 0.05;
  var walkFront = true;

    var goombaFeet1Pos = [0,0,0];
    var goombaFeet2Pos = [0,0,0];
    var goombaFeet1RotatePos = 0;
    var rotateBack1 = false;
    var goombaFeet2RotatePos = 0;
    var rotateBack2 = true;
    var goombaRotateSpeed = 0.02;

  var animate = function (time) {
    var AMORTIZATION = 0.95;
    
    if (time > 0) {
      // mencegah kalau time = null
      var dt = time - time_prev;
      var dt = time - time_prev;
    if (!drag) {
      (dX *= AMORTIZATION), (dY *= AMORTIZATION);
      (THETA += dX), (PHI += dY);
    }
      // else {
        VIEWMATRIX = LIBS.get_I4();
        LIBS.translateZ(VIEWMATRIX, -20);
        LIBS.rotateY(VIEWMATRIX, THETA);
        LIBS.rotateX(VIEWMATRIX, PHI);
      // }
      // LIBS.rotateX(MOVEMATRIX, dt*0.0004);
      // LIBS.rotateY(MOVEMATRIX, dt*0.0004);
      // LIBS.rotateZ(MOVEMATRIX, dt*0.0004);
      // console.log(dt);
      // time_prev = time;
      // glMatrix.mat4.rotateY(shoulder.MOVEMATRIX, shoulder.MOVEMATRIX, THETA*0.1);
      // glMatrix.mat4.rotateX(shoulder.MOVEMATRIX, shoulder.MOVEMATRIX, -PHI*0.1);
      // glMatrix.mat4.rotateY(hand.MOVEMATRIX, hand.MOVEMATRIX, THETA*0.1);
      // glMatrix.mat4.rotateX(hand.MOVEMATRIX, hand.MOVEMATRIX, PHI*0.1);
    }



    // C-3PO
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
    rightEye.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    leftEye.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    innerLeftEye.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    innerRightEye.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    mouth.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);

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
    footRobot2.setuniformmatrix4(PROJMATRIX,VIEWMATRIX);
    bottomRobot.setuniformmatrix4(PROJMATRIX,VIEWMATRIX);
    triangleRobot.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    triangleRobot2.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);


    //Mace Windu
    wraist_Lego.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    rightLeg_Lego.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    leftLeg_Lego.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    body_Lego.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    neck_Lego.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    head_Lego.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    rightHand_Lego.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    rightShoulder_Lego.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    leftHand_Lego.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    leftShoulder_Lego.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    rightArm_Lego.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    leftArm_Lego.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    innerRightArm_Lego.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    innerLeftArm_Lego.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    neckDeco_Lego.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    headKecil.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    saber1.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    saber2.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    saber3.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    saber4.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    saber5.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    saber6.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    sayap.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    mata.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    mata2.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    mulut.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);



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

    //posisi awal
    if (walkFront == true) {
      goombaPos[2] += goombaMoveSpeed;
      if(goombaPos[2] >= 5) {
        walkFront = false;
      }
    }
    else {
      goombaPos[2] -= goombaMoveSpeed;
      if(goombaPos[2] <= -5) {
        walkFront = true;
      }
    }

    console.log(goombaPos[2])

    LIBS.translateZ(body.MOVEMATRIX, goombaPos[2]);
    // LIBS.rotateX(body.MOVEMATRIX, 1.5);

    if (walkFront == false) {
      LIBS.rotateY(body.MOVEMATRIX, Math.PI);
    }

    // wraist.draw();
    body.draw();
    // neck.draw();
    // head.draw();
    // rightShoulder.draw();
    // leftShoulder.draw();
    // rightArm.draw();
    // leftArm.draw();
    // neckDeco.draw();
    // rightEye.draw();
    // leftEye.draw();
    // mouth.draw();
    // legDeco.drawSpline(leg_deco1);

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
    footRobot2.draw();
    bottomRobot.draw();
    triangleRobot.draw();
    triangleRobot2.draw();

    //Mace Windu
    wraist_Lego.draw();
    body_Lego.draw();
    neck_Lego.draw();
    head_Lego.draw();
    rightHand_Lego.draw();
    leftHand_Lego.draw();
    rightArm_Lego.draw();
    leftArm_Lego.draw();
    neckDeco_Lego.draw();
    headKecil.draw();
    saber1.draw();
    saber2.draw();
    saber3.draw();
    saber4.draw();
    saber5.draw();
    saber6.draw();
    sayap.draw();
    mata.draw();
    mata2.draw();
    mulut.draw();
    leftLeg_Lego.draw();
    rightLeg_Lego.draw();
    leftShoulder_Lego.draw();
    rightShoulder_Lego.draw();
    innerRightArm_Lego.draw();
    innerLeftArm_Lego.draw();
    
    GL.flush();
    window.requestAnimationFrame(animate);
  };

  animate(0);
}
window.addEventListener("load", main);
