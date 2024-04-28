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
  uniform_color;

  MOVEMATRIX; // WORLD SPACE

  constructor(object_vertex, object_faces, shader_fragment_source, shader_vertex_source, texture_map) {
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

    this._sampler = GL.getUniformLocation(this.SHADER_PROGRAM, "sampler");

    if (texture_map == "") {
      this._color = GL.getAttribLocation(this.SHADER_PROGRAM, "color");
    } else {
      this._color = GL.getAttribLocation(this.SHADER_PROGRAM, "uv");
    }
    this._position = GL.getAttribLocation(this.SHADER_PROGRAM, "position");

    GL.enableVertexAttribArray(this._color);
    GL.enableVertexAttribArray(this._position);

    GL.useProgram(this.SHADER_PROGRAM);
    GL.uniform1i(this._sampler, 0);

    this.cube_texture = LIBS.loadTexture("texture/" + texture_map);

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
    GL.vertexAttribPointer(this._color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4 );

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
    GL.drawElements(GL.TRIANGLES, this.object_faces.length, GL.UNSIGNED_SHORT, 0);

    if (this.child.length > 0) {
      for (let i = 0; i < this.child.length; i++) {
        this.child[i].draw();
      }
    }  
  }

  drawWTexture(){
    GL.useProgram(this.SHADER_PROGRAM);
    GL.activeTexture(GL.TEXTURE0);
    GL.bindTexture(GL.TEXTURE_2D, this.cube_texture);
    
    GL.bindBuffer(GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
    GL.vertexAttribPointer(this._position, 3, GL.FLOAT, false, 4*(3+2), 0);
    GL.vertexAttribPointer(this._color, 2, GL.FLOAT, false, 4*(3+2), 3*4);

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
    GL.drawElements(GL.TRIANGLES, this.object_faces.length, GL.UNSIGNED_SHORT, 0);

    if (this.child.length > 0) {
      for (let i = 0; i < this.child.length; i++) {
        this.child[i].draw();
      }
    }  
  }

  drawSpline(z) {
      GL.useProgram(this.SHADER_PROGRAM);
      var bspline = generateBSpline(this.object_vertex, 100, 2, z);

      var bspline_vbo = GL.createBuffer();
      GL.bindBuffer(GL.ARRAY_BUFFER, bspline_vbo);
      GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(bspline), GL.STATIC_DRAW);

      GL.vertexAttribPointer(this._position, 3, GL.FLOAT, false, 4 * 3, 0);
      // this.position, 2, GL.FLOAT, false, 0, 0
      GL.uniform3f(this.uniform_color, (0/255), (0/255), (0/255));
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

//Environment

//Environment 

var cube_vertex = [
  -30, -30, -30,     1, 1, 0,
  30, -30, -30,     1, 1, 0,
  30,  30, -30,     1, 1, 0,
  -30,  30, -30,     1, 1, 0,

  // -1, -1, 1,     0, 0, 1,
  // 1, -1, 1,     0, 0, 1,
  // 1,  1, 1,     0, 0, 1,
  // -1,  1, 1,     0, 0, 1,

  -30, -30, -30,     0, 1, 1,
  -30,  30, -30,     0, 1, 1,
  -30,  30,  30,     0, 1, 1,
  -30, -30,  30,     0, 1, 1,

  30, -30, -30,     1, 0, 0,
  30,  30, -30,     1, 0, 0,
  30,  30,  30,     1, 0, 0,
  30, -30,  30,     1, 0, 0,

  -30, -30, -30,     1, 0, 1,
  -30, -30,  30,     1, 0, 1,
  30, -30,  30,     1, 0, 1,
  30, -30, -30,     1, 0, 1,

  -30, 30, -30,     0, 1, 0,
  -30, 30,  30,     0, 1, 0,
  30, 30,  30,     0, 1, 0,
  30, 30, -30,     0, 1, 0 
];

var cube_faces = [
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
  20, 22, 23
];

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

function normalizeScreen(x, y, width, height) {
  var nx = (2 * x) / width - 1;
  var ny = (-2 * y) / height + 1;

  return [nx, ny];
}

function generateBSpline(controlPoint, m, degree, z) {
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
    curves.push(z)
  }
  // console.log(curves);
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
  var scale = -20;

  
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

  var mouseDown = function (e) {
    drag = true;
    (x_prev = e.pageX), (y_prev = e.pageY);
    e.preventDefault();
    return false;
  };
  
  // var mouseDown = function (e) {
  //   legDecoVertices.push(
  //     normalizeScreen(e.pageX, e.pageY, CANVAS.width, CANVAS.height)[0]
  //   );
  //   legDecoVertices.push(
  //     normalizeScreen(e.pageX, e.pageY, CANVAS.width, CANVAS.height)[1]
  //   );
  //   console.log(normalizeScreen(e.pageX, e.pageY, CANVAS.width, CANVAS.height)[0]);
  //   console.log(normalizeScreen(e.pageX, e.pageY, CANVAS.width, CANVAS.height)[1]);
  // };
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

  function zoom(e) {
    e.preventDefault();
  
    scale -= e.deltaY*0.005;
  }

  CANVAS.addEventListener("mousedown", mouseDown, false);
  CANVAS.addEventListener("mouseup", mouseUp, false);
  CANVAS.addEventListener("mouseout", mouseUp, false);
  CANVAS.addEventListener("mousemove", mouseMove, false);
  CANVAS.addEventListener("wheel", zoom, false);

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

  // for spline
  var shader_fragment_source2 = `
        precision mediump float;
        uniform vec3 outColor;
        void main(void){
            gl_FragColor = vec4(outColor,1.);
        }
    `;

    // buat kalo pake texture
    var shader_vertex_source3 = "\n\
  attribute vec3 position;\n\
  uniform mat4 Pmatrix, Vmatrix, Mmatrix;\n\
  attribute vec2 uv;\n\
  varying vec2 vUV;\n\
  \n\
  void main(void) {\n\
  gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.);\n\
  vUV=uv;\n\
  }";
  
    var shader_fragment_source3 = "\n\
  precision mediump float;\n\
  uniform sampler2D sampler;\n\
  varying vec2 vUV;\n\
  \n\
  \n\
  void main(void) {\n\
  gl_FragColor = texture2D(sampler, vUV);\n\
  //gl_FragColor = vec4(1.,1.,1.,1.);\n\
  }";

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
        (radius * Math.cos(LIBS.degToRad(i))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(i))) / CANVAS.height;
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
        (radius * Math.cos(LIBS.degToRad(i % 360))) /
        CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(i % 360))) /
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
        (radius * Math.cos(LIBS.degToRad(360))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(360))) /
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
        (radius * Math.cos(LIBS.degToRad(i))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(i))) / CANVAS.height;
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
        (radius * Math.cos(LIBS.degToRad(i % 360))) /
        CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(i % 360))) /
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
        (radius * Math.cos(LIBS.degToRad(360))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(360))) /
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
  cylinderVertex.push(139/255);
  cylinderVertex.push(69/255);
  cylinderVertex.push(19/255);

  for (var i = 0; i <= 720; i++) {
    if (i <= 360) {
      var x =
        (radius * Math.cos(LIBS.degToRad(i))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(i))) / CANVAS.height;
      cylinderVertex.push(x);
      cylinderVertex.push(z1);
      cylinderVertex.push(y);
      cylinderVertex.push(139/255);
  cylinderVertex.push(69/255);
  cylinderVertex.push(19/255);
    }
    if (i == 360) {
      cylinderVertex.push(0);
      cylinderVertex.push(1);
      cylinderVertex.push(0);
      cylinderVertex.push(139/255);
  cylinderVertex.push(69/255);
  cylinderVertex.push(19/255);
    }
    if (i >= 360) {
      var x =
        (radius * Math.cos(LIBS.degToRad(i % 360))) /
        CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(i % 360))) /
        CANVAS.height;
      cylinderVertex.push(x);
      cylinderVertex.push(z2);
      cylinderVertex.push(y);
      cylinderVertex.push(139/255);
  cylinderVertex.push(69/255);
  cylinderVertex.push(19/255);
    }
    if (i == 720) {
      var x =
        (radius * Math.cos(LIBS.degToRad(360))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(360))) /
        CANVAS.height;
        cylinderVertex.push(x);
      cylinderVertex.push(1);
      cylinderVertex.push(y);
      cylinderVertex.push(139/255);
  cylinderVertex.push(69/255);
  cylinderVertex.push(19/255);
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

    -1.2, 0, 0.5,210/255, 180/255, 140/255,
    1.1, 0, 0.5,210/255, 180/255, 140/255,
    0.9, 2, 0.5, 210/255, 180/255, 140/255,
    -1, 2, 0.5, 210/255, 180/255, 140/255,

    -1.2, 0, -0.5,210/255, 180/255, 140/255,
    1.1, 0, -0.5,  210/255, 180/255, 140/255,
    0.9, 2, -0.5,  210/255, 180/255, 140/255,
    -1, 2, -0.5,    210/255, 180/255, 140/255
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
        (radius * Math.cos(LIBS.degToRad(i))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(i))) / CANVAS.height;
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
        (radius * Math.cos(LIBS.degToRad(i % 360))) /
        CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(i % 360))) /
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
        (radius * Math.cos(LIBS.degToRad(360))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(360))) /
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
        (radius * Math.cos(LIBS.degToRad(i))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(i))) / CANVAS.height;
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
        (radius * Math.cos(LIBS.degToRad(i % 360))) /
        CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(i % 360))) /
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
        (radius * Math.cos(LIBS.degToRad(360))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(360))) /
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
        (radius * Math.cos(LIBS.degToRad(i))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(i))) / CANVAS.height;
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
        (radius * Math.cos(LIBS.degToRad(i % 360))) /
        CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(i % 360))) /
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
        (radius * Math.cos(LIBS.degToRad(360))) / CANVAS.width;
      var y =
        (radius2 * Math.sin(LIBS.degToRad(360))) /
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
  //Environment 

var cube_vertex = [
  -30, -30, -30,     1, 1, 0,
  30, -30, -30,     1, 1, 0,
  30,  30, -30,     1, 1, 0,
  -30,  30, -30,     1, 1, 0,

  // -1, -1, 1,     0, 0, 1,
  // 1, -1, 1,     0, 0, 1,
  // 1,  1, 1,     0, 0, 1,
  // -1,  1, 1,     0, 0, 1,

  -30, -30, -30,     0, 1, 1,
  -30,  30, -30,     0, 1, 1,
  -30,  30,  30,     0, 1, 1,
  -30, -30,  30,     0, 1, 1,

  30, -30, -30,     1, 0, 0,
  30,  30, -30,     1, 0, 0,
  30,  30,  30,     1, 0, 0,
  30, -30,  30,     1, 0, 0,

  -30, -30, -30,     1, 0, 1,
  -30, -30,  30,     1, 0, 1,
  30, -30,  30,     1, 0, 1,
  30, -30, -30,     1, 0, 1,

  -30, 30, -30,     0, 1, 0,
  -30, 30,  30,     0, 1, 0,
  30, 30,  30,     0, 1, 0,
  30, 30, -30,     0, 1, 0 
];

var cube_faces = [
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
  20, 22, 23
];



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
    0.9, 2, -0.5, 221/255, 112/255, 24/255
  ];

  var c3poFrontBodyVertexWTexture = [
     // depan permukaan kubus
    -1.2, 0, 0.5,       0, 0,
    1.1, 0, 0.5,        1, 0,
    0.9, 2, 0.5,        1, 1,
    -1, 2, 0.5,         0, 1,
  ]

  var c3poBackBodyVertexWTexture = [
    // belakang permukaan kubus
    -1.2, 0, -0.5,      0, 0,
    1.1, 0, -0.5,       1, 0,
    0.9, 2, -0.5,       1, 1,
    -1, 2, -0.5,        0, 1
 ]
  

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

  var c3po_faces_Texture = [
    0, 1, 2,
    0, 2, 3
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

  var legDecoVertices = [0.366666666, 0.45, 0.066666666, 0.125, 1.15, -0.5];
  var legDecoVertices2 = [0.566666666, 0.45, 0.166666666, 0.225, 1.15, -0.2];
  var legDecoVertices3 = [0.5-0.65, -0.725, 0.2-0.65, -0.25, -0.5-0.65, -0.25];
  var legDecoVertices4 = [0.2-0.65, -0.725, 0.1-0.65, -0.35, -0.5-0.65, -0.45];

  //robot r2d2 array

  var body_robot_array = generateCylinderVerti(0, 4, (CANVAS.width), (CANVAS.height), [221/255, 112/255, 24/255])
  var head_robot_array = generateSphereFull(0 , 0, -0.25, 1, 100)
  var top_robot_head = generateCylinderVerti(0, 1, (CANVAS.width/3), (CANVAS.height/3), [128/255, 128/255, 128/255])
  var robot_arm_extension = generateCylinderHorizon(0, 1, (CANVAS.width / 3), (CANVAS.height / 3), [221/255, 112/255, 24/255])
  var robot_arm_extension2 = generateCylinderHorizon(0, 1, (CANVAS.width / 3), (CANVAS.height / 3), [221/255, 112/255, 24/255])
  var robot_arm_upper = generateCylinderHorizon(0, 1, (CANVAS.width / 1.5), (CANVAS.height / 1.5), [221/255, 112/255, 24/255])
  var robot_arm_upper2 = generateCylinderHorizon(0, 1, (CANVAS.width / 1.5), (CANVAS.height / 1.5), [221/255, 112/255, 24/255])
  var robot_bottom = generateCylinderVerti(0, 1, (CANVAS.width/3), (CANVAS.height/3), [1/255, 1/255, 200/255])
  var robot_eye = generateCylinderVerti(0, 1 , (CANVAS.width/7) , (CANVAS.height/7) , [0, 0, 0])
  var robot_eye_socket = generateCylinderVerti(0, 1, (CANVAS.width/6), (CANVAS.height/6), [1/255, 1/255, 200/255])
  

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
 
   var neck_array_Lego = generateCylinderVerti(0, 2.3, (CANVAS.width / 2.1), (CANVAS.height / 2.1), [139/255, 69/255, 19/255]);
   var neck_deco_array_Lego = generateCylinderHorizon_Lego(1, 0.3, (CANVAS.width / 7), (CANVAS.height / 7));
 
   var wraist_array_Lego = generateCylinderHorizon_Lego(0, 2.3, (CANVAS.width / 2), (CANVAS.height / 2));
   var hand_array_Lego = generateCylinderVerti(0, 1.3, (CANVAS.width / 3), (CANVAS.height / 3), [210/255, 180/255, 140/255]);
   var arm_array_Lego = generateCylinderHorizonRotate_Lego(0, 0.6, (CANVAS.width / 2.35), (CANVAS.height / 2.35), [139/255, 69/255, 19/255]);
   var inner_arm_array_Lego = generateCylinderHorizonRotate_Lego(0, 0.61, (CANVAS.width / 3.05), (CANVAS.height / 3.05), [0, 0, 0]);
//  =======
   
// Environment
var envi = new MyObject(cube_vertex, cube_faces, shader_fragment_source, shader_vertex_source, "");


//environment
var planet1_array = generateSphereFull(0 , 0, -0.25, 1, 100)


//=======
  
  var head = new MyObject(head_array.vertices, head_array.faces, shader_fragment_source, shader_vertex_source, "");
    
  var wraist = new MyObject(wraist_array.vertices, wraist_array.faces, shader_fragment_source, shader_vertex_source, "");

  var rightLeg = new MyObject(legVertex, triangle_faces, shader_fragment_source, shader_vertex_source, "");
  
  var leftLeg = new MyObject(legVertex, triangle_faces, shader_fragment_source, shader_vertex_source);

  var body = new MyObject(bodyVertex, body_faces, shader_fragment_source, shader_vertex_source, "");

  var frontBodyWTexture = new MyObject(c3poFrontBodyVertexWTexture, c3po_faces_Texture, shader_fragment_source3, shader_vertex_source3, "c3po_body_front.png");

  var backBodyWTexture = new MyObject(c3poBackBodyVertexWTexture, c3po_faces_Texture, shader_fragment_source3, shader_vertex_source3, "c3po_body_back.png");
  
  var neck = new MyObject(neck_array.vertices, neck_array.faces, shader_fragment_source, shader_vertex_source, "");

  var rightHand = new MyObject(hand_array.vertices,hand_array.faces, shader_fragment_source, shader_vertex_source, "");

  var rightShoulder = new MyObject(shoulder_array.vertices, shoulder_array.faces, shader_fragment_source, shader_vertex_source, "");

  var leftHand = new MyObject(hand_array.vertices,hand_array.faces, shader_fragment_source, shader_vertex_source, "");

  var leftShoulder = new MyObject(shoulder_array.vertices, shoulder_array.faces, shader_fragment_source, shader_vertex_source, "");

  var rightArm = new MyObject(arm_array.vertices,arm_array.faces, shader_fragment_source, shader_vertex_source, "")

  var leftArm = new MyObject(arm_array.vertices,arm_array.faces, shader_fragment_source, shader_vertex_source, "");

  var innerRightArm = new MyObject(inner_arm_array.vertices,inner_arm_array.faces, shader_fragment_source, shader_vertex_source, "");
  
  var innerLeftArm = new MyObject(inner_arm_array.vertices,inner_arm_array.faces, shader_fragment_source, shader_vertex_source, "");

  var neckDeco = new MyObject(neck_deco_array.vertices,neck_deco_array.faces, shader_fragment_source, shader_vertex_source, "");

  var rightEye = new MyObject(eye_array.vertices,eye_array.faces, shader_fragment_source, shader_vertex_source, "");

  var leftEye = new MyObject(eye_array.vertices,eye_array.faces, shader_fragment_source, shader_vertex_source, "");

  var innerRightEye = new MyObject(inner_eye_array.vertices,inner_eye_array.faces, shader_fragment_source, shader_vertex_source, "");

  var innerLeftEye = new MyObject(inner_eye_array.vertices,inner_eye_array.faces, shader_fragment_source, shader_vertex_source, "");

  var mouth = new MyObject(mouthVertex,mouth_faces, shader_fragment_source, shader_vertex_source, "");

  var legDeco = new MyObject(legDecoVertices,legDecoVertices, shader_fragment_source2, shader_vertex_source, "")

  var legDeco2 = new MyObject(legDecoVertices2,legDecoVertices2, shader_fragment_source2, shader_vertex_source, "")

  var legDeco3 = new MyObject(legDecoVertices3,legDecoVertices3, shader_fragment_source2, shader_vertex_source, "")

  var legDeco4 = new MyObject(legDecoVertices4,legDecoVertices4, shader_fragment_source2, shader_vertex_source, "")

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

  //Mace Windu
  var mulut = new MyObject(mulut_array.vertices, mulut_array.faces, shader_fragment_source, shader_vertex_source, "");

  var mata2 = new MyObject(mata2_array.vertices, mata2_array.faces, shader_fragment_source, shader_vertex_source, "");

  var mata = new MyObject(mata_array.vertices, mata_array.faces, shader_fragment_source, shader_vertex_source, "");

  var sayap = new MyObject(sayap_array.vertices, sayap_array.faces, shader_fragment_source, shader_vertex_source, "");

  var saber6 = new MyObject(saber_array6.vertices, saber_array6.faces, shader_fragment_source, shader_vertex_source, "");

  var saber5 = new MyObject(saber_array5.vertices, saber_array5.faces, shader_fragment_source, shader_vertex_source, "");

  var saber4 = new MyObject(saber_array4.vertices, saber_array4.faces, shader_fragment_source, shader_vertex_source, "");

  var saber3 = new MyObject(saber_array3.vertices, saber_array3.faces, shader_fragment_source, shader_vertex_source, "");

  var saber2 = new MyObject(saber_array2.vertices, saber_array2.faces, shader_fragment_source, shader_vertex_source, "");

  var saber1 = new MyObject(saber_array1.vertices, saber_array1.faces, shader_fragment_source, shader_vertex_source, "");

  var headKecil = new MyObject(head_array_kecil.vertices, head_array_kecil.faces, shader_fragment_source, shader_vertex_source, "");
  
  var head_Lego = new MyObject(head_array_Lego.vertices, head_array_Lego.faces, shader_fragment_source, shader_vertex_source, "");
    
  var wraist_Lego = new MyObject(wraist_array_Lego.vertices, wraist_array_Lego.faces, shader_fragment_source, shader_vertex_source, "");

  var rightLeg_Lego = new MyObject(legVertex_Lego, triangle_faces_Lego, shader_fragment_source, shader_vertex_source, "");
  
  var leftLeg_Lego = new MyObject(legVertex_Lego, triangle_faces_Lego, shader_fragment_source, shader_vertex_source, "");

  var body_Lego = new MyObject(bodyVertex_Lego, body_faces_Lego, shader_fragment_source, shader_vertex_source, "");
  
  var neck_Lego = new MyObject(neck_array_Lego.vertices, neck_array_Lego.faces, shader_fragment_source, shader_vertex_source, "");

  var rightHand_Lego = new MyObject(hand_array_Lego.vertices,hand_array_Lego.faces, shader_fragment_source, shader_vertex_source, "");

  var rightShoulder_Lego = new MyObject(shoulder_array_Lego.vertices, shoulder_array_Lego.faces, shader_fragment_source, shader_vertex_source, "");

  var leftHand_Lego = new MyObject(hand_array_Lego.vertices,hand_array_Lego.faces, shader_fragment_source, shader_vertex_source, "");

  var leftShoulder_Lego = new MyObject(shoulder_array_Lego.vertices, shoulder_array_Lego.faces, shader_fragment_source, shader_vertex_source, "");

  var rightArm_Lego = new MyObject(arm_array_Lego.vertices,arm_array_Lego.faces, shader_fragment_source, shader_vertex_source, "")

  var leftArm_Lego = new MyObject(arm_array_Lego.vertices,arm_array_Lego.faces, shader_fragment_source, shader_vertex_source, "");

  var innerRightArm_Lego = new MyObject(inner_arm_array_Lego.vertices,inner_arm_array_Lego.faces, shader_fragment_source, shader_vertex_source, "");
  
  var innerLeftArm_Lego = new MyObject(inner_arm_array_Lego.vertices,inner_arm_array_Lego.faces, shader_fragment_source, shader_vertex_source, "");

  var neckDeco_Lego = new MyObject(neck_deco_array_Lego.vertices,neck_deco_array_Lego.faces, shader_fragment_source, shader_vertex_source, "");

  body_Lego.addChild(rightArm_Lego);
  body_Lego.addChild(leftArm_Lego);
  body_Lego.addChild(wraist_Lego);
  body_Lego.addChild(rightLeg_Lego);
  body_Lego.addChild(leftLeg_Lego);
  rightArm_Lego.addChild(innerRightArm_Lego);
  leftArm_Lego.addChild(innerLeftArm_Lego);
  body_Lego.addChild(rightShoulder_Lego);
  body_Lego.addChild(leftShoulder_Lego);
  rightShoulder_Lego.addChild(rightHand_Lego);
  leftShoulder_Lego.addChild(leftHand_Lego);
  body_Lego.addChild(neck_Lego);
  neck_Lego.addChild(neckDeco_Lego);
  body_Lego.addChild(head_Lego)
  head_Lego.addChild(mata2);
  head_Lego.addChild(mata);
  head_Lego.addChild(mulut);

  

  //Robot r2d2

  var robotBody = new MyObject(body_robot_array.vertices , neck_deco_array.faces , shader_fragment_source ,shader_vertex_source, "");

  var robotHead = new MyObject(head_robot_array.vertices , head_robot_array.faces, shader_fragment_source , shader_vertex_source, "");

  var topRobot = new MyObject(top_robot_head.vertices , top_robot_head.faces, shader_fragment_source , shader_vertex_source, "");

  var armExtension = new MyObject(robot_arm_extension.vertices , robot_arm_extension.faces , shader_fragment_source , shader_vertex_source, "");

  var armExtension2 = new MyObject(robot_arm_extension2.vertices , robot_arm_extension2.faces , shader_fragment_source , shader_vertex_source, "");

  var armUpper = new MyObject(robot_arm_upper.vertices , robot_arm_upper.faces , shader_fragment_source , shader_vertex_source, "");

  var armUpper2 = new MyObject(robot_arm_upper2.vertices , robot_arm_upper2.faces , shader_fragment_source , shader_vertex_source, "");

  var armRobot = new MyObject(arm_Vertex , arm_faces , shader_fragment_source , shader_vertex_source, "");

  var armRobot2 = new MyObject(arm2_Vertex , arm2_faces , shader_fragment_source , shader_vertex_source, "");
  
  var footRobot = new MyObject(foot_vertex , foot_faces , shader_fragment_source , shader_vertex_source, "");

  var footRobot2 = new MyObject(foot_vertex , foot_faces , shader_fragment_source , shader_vertex_source, "");

  var bottomRobot = new MyObject(robot_bottom.vertices , robot_bottom.faces , shader_fragment_source , shader_vertex_source, "");

  var triangleRobot = new MyObject(triangle_robot_vertex , triangle_robot_faces, shader_fragment_source , shader_vertex_source, "")
  
  var triangleRobot2 = new MyObject(triangle_robot_vertex , triangle_robot_faces, shader_fragment_source , shader_vertex_source, "")

  var robotEye = new MyObject(robot_eye.vertices , robot_eye.faces, shader_fragment_source , shader_vertex_source, "");

  var robotSocketEye = new MyObject(robot_eye_socket.vertices , robot_eye_socket.faces , shader_fragment_source , shader_vertex_source, "");

  robotBody.addChild(bottomRobot);
  robotBody.addChild(robotHead);
  robotBody.addChild(triangleRobot);
  robotBody.addChild(triangleRobot2);

  footRobot.addChild(armUpper);
  footRobot.addChild(armRobot);
  footRobot.addChild(armExtension);

  footRobot2.addChild(armUpper2);
  footRobot2.addChild(armRobot2);
  footRobot2.addChild(armExtension2);

  //Environment

  var hangar = new MyObject(cube_vertex , cube_faces , shader_fragment_source , shader_vertex_source, "");
  var planet1 = new MyObject(planet1_array.vertices , planet1_array.faces , shader_fragment_source , shader_vertex_source , "")


  var PROJMATRIX = LIBS.get_projection(
    40,
    CANVAS.width / CANVAS.height,
    1,
    100
  );
  var VIEWMATRIX = LIBS.get_I4();

// Environment
   envi.MOVEMATRIX = glMatrix.mat4.create();

  // C-3PO

  wraist.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(wraist.MOVEMATRIX, wraist.MOVEMATRIX, [-1.15, 0.0, 0.0]);
  
  rightLeg.MOVEMATRIX = glMatrix.mat4.create();
  // glMatrix.mat4.translate(rightLeg.MOVEMATRIX, rightLeg.MOVEMATRIX, [-0.65, -1, 0.0]);
  
  
  
  leftLeg.MOVEMATRIX = glMatrix.mat4.create();
  // glMatrix.mat4.translate(leftLeg.MOVEMATRIX, leftLeg.MOVEMATRIX, [0.65, -1, 0.0]);

  body.MOVEMATRIX = glMatrix.mat4.create();

  rightHand.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(rightHand.MOVEMATRIX, rightHand.MOVEMATRIX, [-1.53, 1,0]);
    glMatrix.mat4.rotateZ(rightHand.MOVEMATRIX, rightHand.MOVEMATRIX, LIBS.degToRad(-8));

    rightShoulder.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(rightShoulder.MOVEMATRIX, rightShoulder.MOVEMATRIX, [-1.42, 1.3,-0.25]);

    leftHand.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(leftHand.MOVEMATRIX, leftHand.MOVEMATRIX, [1.53, 1,0]);
    glMatrix.mat4.rotateY(leftHand.MOVEMATRIX, leftHand.MOVEMATRIX, LIBS.degToRad(180));
    glMatrix.mat4.rotateZ(leftHand.MOVEMATRIX, leftHand.MOVEMATRIX, LIBS.degToRad(-8));

    leftShoulder.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(leftShoulder.MOVEMATRIX, leftShoulder.MOVEMATRIX, [1.42, 1.3,0.25]);
    glMatrix.mat4.rotateY(leftShoulder.MOVEMATRIX, leftShoulder.MOVEMATRIX, LIBS.degToRad(180));

    rightArm.MOVEMATRIX = glMatrix.mat4.create();
    // glMatrix.mat4.translate(rightArm.MOVEMATRIX, rightArm.MOVEMATRIX, [-1.55, 0.75,-0.3;])

    leftArm.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(leftArm.MOVEMATRIX, leftArm.MOVEMATRIX, [1.55, 0.75,-0.3]);

    innerRightArm.MOVEMATRIX = glMatrix.mat4.create();
    // glMatrix.mat4.translate(innerRightArm.MOVEMATRIX, innerRightArm.MOVEMATRIX, [-1.55, 0.645,-0.305]);

    innerLeftArm.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(innerLeftArm.MOVEMATRIX, innerLeftArm.MOVEMATRIX, [1.55, 0.645,-0.305]);

  neck.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(neck.MOVEMATRIX, neck.MOVEMATRIX, [0, 1.5, 0.0]);

  head.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(head.MOVEMATRIX, head.MOVEMATRIX, [-0.5, 3.5,-0.25]);

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
  
  legDeco.MOVEMATRIX = glMatrix.mat4.create();
  legDeco2.MOVEMATRIX = glMatrix.mat4.create();
  legDeco3.MOVEMATRIX = glMatrix.mat4.create();
  legDeco4.MOVEMATRIX = glMatrix.mat4.create();

  frontBodyWTexture.MOVEMATRIX = glMatrix.mat4.create();
  backBodyWTexture.MOVEMATRIX = glMatrix.mat4.create();

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
    armRobot.MOVEMATRIX, LIBS.degToRad(90));

  armRobot2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(armRobot2.MOVEMATRIX, armRobot2.MOVEMATRIX,[4.7, 1 ,0])
  glMatrix.mat4.rotateY(armRobot2.MOVEMATRIX,
    armRobot2.MOVEMATRIX, LIBS.degToRad(90));
  

  footRobot.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(footRobot.MOVEMATRIX, footRobot.MOVEMATRIX,[7.8, 0 ,0])
  glMatrix.mat4.rotateY(footRobot.MOVEMATRIX,
  footRobot.MOVEMATRIX, LIBS.degToRad(90));
  // glMatrix.mat4.rotateY(footRobot.MOVEMATRIX,
  // footRobot.MOVEMATRIX , LIBS.degToRad(180))

  footRobot2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(footRobot2.MOVEMATRIX, footRobot2.MOVEMATRIX,[4.3, 0 ,0])
  glMatrix.mat4.rotateY(footRobot2.MOVEMATRIX,
  footRobot2.MOVEMATRIX, LIBS.degToRad(90));
  glMatrix.mat4.rotateY(footRobot2.MOVEMATRIX,
    footRobot2.MOVEMATRIX , LIBS.degToRad(180))

  bottomRobot.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(bottomRobot.MOVEMATRIX, bottomRobot.MOVEMATRIX,[6 , -0.46 , 0])

  triangleRobot.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(triangleRobot.MOVEMATRIX , triangleRobot.MOVEMATRIX , [6.8 ,-0.5 ,0 ])
  glMatrix.mat4.rotateX(triangleRobot.MOVEMATRIX,
    triangleRobot.MOVEMATRIX , LIBS.degToRad(180))

    triangleRobot2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(triangleRobot2.MOVEMATRIX , triangleRobot.MOVEMATRIX , [-1.6   ,-0.01 ,0 ])
  glMatrix.mat4.rotateX(triangleRobot2.MOVEMATRIX,
    triangleRobot2.MOVEMATRIX , LIBS.degToRad(180))
    glMatrix.mat4.rotateZ(triangleRobot2.MOVEMATRIX,
      triangleRobot2.MOVEMATRIX , LIBS.degToRad(180))

      robotEye.MOVEMATRIX = glMatrix.mat4.create();
      glMatrix.mat4.translate(robotEye.MOVEMATRIX, robotEye.MOVEMATRIX, [6, 4.4, 0.4])
      glMatrix.mat4.rotateX(robotEye.MOVEMATRIX , robotEye.MOVEMATRIX , LIBS.degToRad(90))
     

      robotSocketEye.MOVEMATRIX = glMatrix.mat4.create();
      glMatrix.mat4.translate(robotSocketEye.MOVEMATRIX, robotSocketEye.MOVEMATRIX ,  [6 ,4.4 , 0.3 ])
      glMatrix.mat4.rotateX(robotSocketEye.MOVEMATRIX , robotSocketEye.MOVEMATRIX , LIBS.degToRad(90))

  

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
  
  // LIBS.translateZ(VIEWMATRIX, -20);
  
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
  glMatrix.mat4.rotateZ(rightHand_Lego.MOVEMATRIX, rightHand_Lego.MOVEMATRIX, LIBS.degToRad(-8));

  rightShoulder_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(rightShoulder_Lego.MOVEMATRIX, rightShoulder_Lego.MOVEMATRIX, [-6.98, 1.3,-0.25]);

  leftHand_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(leftHand_Lego.MOVEMATRIX, leftHand_Lego.MOVEMATRIX, [-3.98, 1,0]);
  glMatrix.mat4.rotateY(leftHand_Lego.MOVEMATRIX, leftHand_Lego.MOVEMATRIX, LIBS.degToRad(180));
  glMatrix.mat4.rotateZ(leftHand_Lego.MOVEMATRIX, leftHand_Lego.MOVEMATRIX, LIBS.degToRad(-8));

  leftShoulder_Lego.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(leftShoulder_Lego.MOVEMATRIX, leftShoulder_Lego.MOVEMATRIX, [-4.10, 1.3,0.25]);
  glMatrix.mat4.rotateY(leftShoulder_Lego.MOVEMATRIX, leftShoulder_Lego.MOVEMATRIX, LIBS.degToRad(180));

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

  //Environment

  hangar.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(hangar.MOVEMATRIX , hangar.MOVEMATRIX , [10 , 28.4 , 0])

  planet1.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(planet1.MOVEMATRIX , planet1.MOVEMATRIX , [8 , 25 ,80])

  
  // Drawing
  GL.clearColor(0.0, 0.0, 0.0, 0.0);

  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);

  GL.clearDepth(1.0);
  var time_prev = 0;

  // C-3P0
  var c3poPos = [0,0,0];
  var c3poMovSpeed = 0.05;
  var walkFront = true;

  var c3poFeet1RotatePos = 0;
  var rotateBackLeg1 = false;
  var c3poFeet2RotatePos = 0;
  var rotateBackLeg2 = true;
  var c3poRotateSpeed = 0.05;
  var rotateBackHand1 = false;
  var c3poHand1RotatePos = 0;

  //Robo R2d2 animation

  var robotPos = [0,0,0];
  var robotMoveSpeed = 0.05;
  var walkFrontRobot = true;
  var eyeRotate = 0;
    var eyeRotateDec = true;


  var eyeRotate2 = 0;
  var eyeRotateDec2 = true;

  //Mace Windu buat animasi gerak
  var MaceWinduPos = [0,0,0];
  var MaceWinduMovSpeed = 0.05;
  var MaceWinduwalkFront = true;

  // kaki
  var MaceWinduFeet1RotatePos = 0;
  var MaceWindurotateBackLeg1 = false;

  var MaceWinduFeet2RotatePos = 0;
  var MaceWindurotateBackLeg2 = true;
  
  var MaceWinduRotateSpeed = 0.05; // buat leg

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
      VIEWMATRIX = LIBS.get_I4();
      LIBS.translateZ(VIEWMATRIX, scale);
      console.log(scale)
      LIBS.rotateX(VIEWMATRIX, PHI);
      LIBS.rotateY(VIEWMATRIX, THETA);
      time_prev = time;
      // LIBS.rotateX(MOVEMATRIX, dt*0.0004);
      // LIBS.rotateY(MOVEMATRIX, dt*0.0004);
      // LIBS.rotateZ(MOVEMATRIX, dt*0.0004);
      // console.log(dt);
      // time_prev = time;
      // glMatrix.mat4.rotateY(VIEWMATRIX, VIEWMATRIX, THETA*0.1);
      // glMatrix.mat4.rotateX(VIEWMATRIX, VIEWMATRIX, PHI*0.1);
      // // glMatrix.mat4.rotateY(shoulder.MOVEMATRIX, shoulder.MOVEMATRIX, THETA*0.1);
      // glMatrix.mat4.rotateX(shoulder.MOVEMATRIX, shoulder.MOVEMATRIX, -PHI*0.1);
      // glMatrix.mat4.rotateY(hand.MOVEMATRIX, hand.MOVEMATRIX, THETA*0.1);
      // glMatrix.mat4.rotateX(hand.MOVEMATRIX, hand.MOVEMATRIX, PHI*0.1);
    }

// Environment
envi.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);

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
    legDeco.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    legDeco2.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    legDeco3.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    legDeco4.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    frontBodyWTexture.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    backBodyWTexture.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);

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
    robotEye.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    robotSocketEye.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);


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


    //Environment
    
    hangar.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    planet1.setuniformmatrix4(PROJMATRIX , VIEWMATRIX);


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

    // C-3PO
    // posisi awal
    if (walkFront == true) {
      c3poPos[2] += c3poMovSpeed;
      if(c3poPos[2] >= 15) {
        walkFront = false;
      }
    }
    else {
      c3poPos[2] -= c3poMovSpeed;
      if(c3poPos[2] <= -15) {
        walkFront = true;
      }
    }

    // inisialisasi part move matrix & static animation
    body.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(body.MOVEMATRIX, body.MOVEMATRIX, [0.05, 0.95, c3poPos[2]]);
    // LIBS.rotateX(body.MOVEMATRIX, 1.5);

    frontBodyWTexture.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(frontBodyWTexture.MOVEMATRIX, frontBodyWTexture.MOVEMATRIX, [0.05, 0.95, c3poPos[2]]);
    backBodyWTexture.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(backBodyWTexture.MOVEMATRIX, backBodyWTexture.MOVEMATRIX, [0.05, 0.95, c3poPos[2]]);

    wraist.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(wraist.MOVEMATRIX, wraist.MOVEMATRIX, [-1.15, 0.0, c3poPos[2]]);

    if (walkFront == false) {
      LIBS.rotateY(body.MOVEMATRIX, Math.PI*2);
      LIBS.rotateY(wraist.MOVEMATRIX, Math.PI*2);
    }

    leftLeg.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(leftLeg.MOVEMATRIX, leftLeg.MOVEMATRIX, [0.65, -1, c3poPos[2]]);

    rightLeg.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(rightLeg.MOVEMATRIX, rightLeg.MOVEMATRIX, [-0.65, -1, c3poPos[2]]);

    rightHand.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(rightHand.MOVEMATRIX, rightHand.MOVEMATRIX, [-1.55, 2, 0.095+c3poPos[2]]);
    glMatrix.mat4.rotateZ(rightHand.MOVEMATRIX, rightHand.MOVEMATRIX, LIBS.degToRad(-8));
    glMatrix.mat4.rotateX(rightHand.MOVEMATRIX, rightHand.MOVEMATRIX, LIBS.degToRad(90));

    rightShoulder.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(rightShoulder.MOVEMATRIX, rightShoulder.MOVEMATRIX, [-1.62, 2,1+c3poPos[2]]);
    glMatrix.mat4.rotateX(rightShoulder.MOVEMATRIX, rightShoulder.MOVEMATRIX, LIBS.degToRad(-100));

    leftHand.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(leftHand.MOVEMATRIX, leftHand.MOVEMATRIX, [1.55, 2, 1.2+c3poPos[2]]);
    glMatrix.mat4.rotateY(leftHand.MOVEMATRIX, leftHand.MOVEMATRIX, LIBS.degToRad(180));
    glMatrix.mat4.rotateZ(leftHand.MOVEMATRIX, leftHand.MOVEMATRIX, LIBS.degToRad(-8));
    glMatrix.mat4.rotateX(leftHand.MOVEMATRIX, leftHand.MOVEMATRIX, LIBS.degToRad(90));

    leftShoulder.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(leftShoulder.MOVEMATRIX, leftShoulder.MOVEMATRIX, [1.62, 2.5,0.9+c3poPos[2]]);
    // 
    glMatrix.mat4.rotateY(leftShoulder.MOVEMATRIX, leftShoulder.MOVEMATRIX, LIBS.degToRad(180));
    glMatrix.mat4.rotateX(leftShoulder.MOVEMATRIX, leftShoulder.MOVEMATRIX, LIBS.degToRad(100));

    rightArm.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(rightArm.MOVEMATRIX, rightArm.MOVEMATRIX, [-1.5, 2.25,1.7])
    LIBS.translateZ(rightArm.MOVEMATRIX, c3poPos[2])
    LIBS.rotateX(rightArm.MOVEMATRIX, LIBS.degToRad(90))


    leftArm.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(leftArm.MOVEMATRIX, leftArm.MOVEMATRIX, [1.5, 2.25,1.7]);
    LIBS.translateZ(leftArm.MOVEMATRIX, c3poPos[2])
    LIBS.rotateX(leftArm.MOVEMATRIX, LIBS.degToRad(90))

    innerRightArm.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(innerRightArm.MOVEMATRIX, innerRightArm.MOVEMATRIX, [-1.5, 2.259,1.85]);
    LIBS.translateZ(innerRightArm.MOVEMATRIX, c3poPos[2])
    LIBS.rotateX(innerRightArm.MOVEMATRIX, LIBS.degToRad(90))


    innerLeftArm.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(innerLeftArm.MOVEMATRIX, innerLeftArm.MOVEMATRIX, [1.5, 2.259,1.85]);
    LIBS.translateZ(innerLeftArm.MOVEMATRIX, c3poPos[2])
    LIBS.rotateX(innerLeftArm.MOVEMATRIX, LIBS.degToRad(90))

    neck.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(neck.MOVEMATRIX, neck.MOVEMATRIX, [0, 1.5, c3poPos[2]]);

    head.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(head.MOVEMATRIX, head.MOVEMATRIX, [-0.5, 3.5,-0.25+c3poPos[2]]);

    neckDeco.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(neckDeco.MOVEMATRIX, neckDeco.MOVEMATRIX, [-0.65, 3.4, c3poPos[2]]);

    rightEye.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(rightEye.MOVEMATRIX, rightEye.MOVEMATRIX, [-0.25, 4.15, 0.065+c3poPos[2]]);

    leftEye.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(leftEye.MOVEMATRIX, leftEye.MOVEMATRIX, [0.25, 4.15, 0.065+c3poPos[2]]);

    innerRightEye.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(innerRightEye.MOVEMATRIX, innerRightEye.MOVEMATRIX, [-0.25, 4.15, 0.0675+c3poPos[2]]);

    innerLeftEye.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(innerLeftEye.MOVEMATRIX, innerLeftEye.MOVEMATRIX, [0.25, 4.15, 0.0675+c3poPos[2]]);

    mouth.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(mouth.MOVEMATRIX, mouth.MOVEMATRIX, [0, 3.65, 0.05+c3poPos[2]]);

    legDeco.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(legDeco.MOVEMATRIX, legDeco.MOVEMATRIX, [0, 0, c3poPos[2]]);
    legDeco2.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(legDeco2.MOVEMATRIX, legDeco2.MOVEMATRIX, [0, 0, c3poPos[2]]);
    legDeco3.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(legDeco3.MOVEMATRIX, legDeco3.MOVEMATRIX, [0, 0, c3poPos[2]]);
    legDeco4.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(legDeco4.MOVEMATRIX, legDeco4.MOVEMATRIX, [0, 0, c3poPos[2]]);

    // leg animation
    temp = LIBS.get_I4();
    LIBS.translateZ(temp, -c3poPos[2]);
    leftLeg.MOVEMATRIX = LIBS.mul(leftLeg.MOVEMATRIX, temp);

    if (rotateBackLeg1 == true) {
      c3poFeet1RotatePos -= c3poRotateSpeed;
      if (c3poFeet1RotatePos <= -0.35) {
        rotateBackLeg1 = false;
      }
    }
    else {
      c3poFeet1RotatePos += c3poRotateSpeed;
      if (c3poFeet1RotatePos >= 0.35) {
        rotateBackLeg1 = true;
      }
    }

    if (walkFront == false) {
      LIBS.rotateY(leftLeg.MOVEMATRIX, Math.PI);
    }
    
    temp = LIBS.get_I4();
    LIBS.rotateX(temp, c3poFeet1RotatePos);
    leftLeg.MOVEMATRIX = LIBS.mul(leftLeg.MOVEMATRIX, temp);
    temp = LIBS.get_I4();
    LIBS.translateZ(temp, c3poPos[2]);
    leftLeg.MOVEMATRIX = LIBS.mul(leftLeg.MOVEMATRIX, temp);


    temp = LIBS.get_I4();
    LIBS.translateZ(temp, -c3poPos[2]);
    rightLeg.MOVEMATRIX = LIBS.mul(rightLeg.MOVEMATRIX, temp);

    if (rotateBackLeg2 == true) {
      c3poFeet2RotatePos -= c3poRotateSpeed;
      if (c3poFeet2RotatePos <= -0.35) {
        rotateBackLeg2 = false;
      }
    }
    else {
      c3poFeet2RotatePos += c3poRotateSpeed;
      if (c3poFeet2RotatePos >= 0.35) {
        rotateBackLeg2 = true;
      }
    }

    if (walkFront == false) {
      LIBS.rotateY(rightLeg.MOVEMATRIX, Math.PI);
    }
    
    temp = LIBS.get_I4();
    LIBS.rotateX(temp, c3poFeet2RotatePos);
    rightLeg.MOVEMATRIX = LIBS.mul(rightLeg.MOVEMATRIX, temp);
    temp = LIBS.get_I4();
    LIBS.translateZ(temp, c3poPos[2]);
    rightLeg.MOVEMATRIX = LIBS.mul(rightLeg.MOVEMATRIX, temp);


    if (walkFront == false) {
      LIBS.rotateY(rightEye.MOVEMATRIX, -Math.PI);
      LIBS.translateZ(rightEye.MOVEMATRIX, -0.1);
      LIBS.rotateY(mouth.MOVEMATRIX, Math.PI);
      LIBS.translateZ(mouth.MOVEMATRIX, -0.1);
      LIBS.rotateY(leftEye.MOVEMATRIX, Math.PI);
      LIBS.translateZ(leftEye.MOVEMATRIX, -0.1);
      LIBS.rotateY(innerLeftEye.MOVEMATRIX, Math.PI);
      LIBS.translateZ(innerLeftEye.MOVEMATRIX, -0.165);
      LIBS.rotateY(innerRightEye.MOVEMATRIX, Math.PI);
      LIBS.translateZ(innerRightEye.MOVEMATRIX, -0.165);
      LIBS.rotateY(leftShoulder.MOVEMATRIX, LIBS.degToRad(190))
      LIBS.translateZ(leftShoulder.MOVEMATRIX, -1.65)
      LIBS.translateX(leftShoulder.MOVEMATRIX, -1.1)
      LIBS.translateZ(leftHand.MOVEMATRIX, -1.3)
      LIBS.translateZ(leftArm.MOVEMATRIX, -2.1)
      LIBS.translateZ(innerLeftArm.MOVEMATRIX, -3.675)
      LIBS.translateZ(leftArm.MOVEMATRIX, -1.3)
      LIBS.rotateY(rightShoulder.MOVEMATRIX, LIBS.degToRad(-190))
      LIBS.translateZ(rightShoulder.MOVEMATRIX, -1.8)
      LIBS.translateX(rightShoulder.MOVEMATRIX, 1.1)
      LIBS.translateZ(rightHand.MOVEMATRIX, -1.4)
      LIBS.translateX(rightHand.MOVEMATRIX, -0.1)
      LIBS.translateX(leftHand.MOVEMATRIX, 0.1)
      LIBS.translateX(rightArm.MOVEMATRIX, -0.1)
      LIBS.translateX(innerRightArm.MOVEMATRIX, -0.1)
      LIBS.translateX(leftArm.MOVEMATRIX, 0.1)
      LIBS.translateX(innerLeftArm.MOVEMATRIX, 0.1)
      LIBS.translateZ(rightArm.MOVEMATRIX, -3.395)
      LIBS.translateZ(innerRightArm.MOVEMATRIX, -3.675)
      LIBS.rotateY(legDeco.MOVEMATRIX, Math.PI)
      LIBS.rotateY(legDeco2.MOVEMATRIX, Math.PI)
      LIBS.rotateY(legDeco3.MOVEMATRIX, Math.PI)
      LIBS.rotateY(legDeco4.MOVEMATRIX, Math.PI)
      LIBS.rotateY(backBodyWTexture.MOVEMATRIX, Math.PI)
      LIBS.rotateY(frontBodyWTexture.MOVEMATRIX, Math.PI)
      LIBS.translateX(backBodyWTexture.MOVEMATRIX, -0.1)
      LIBS.translateX(frontBodyWTexture.MOVEMATRIX, -0.1)
    }

    // C-3PO
    body.draw();
    legDeco.drawSpline(0.533);
    legDeco2.drawSpline(0.533);
    legDeco3.drawSpline(0.533);
    legDeco4.drawSpline(0.533);
    backBodyWTexture.drawWTexture();
    frontBodyWTexture.drawWTexture();
    // legDeco.drawSpline(leg_deco1);

    //robo r2d2

    

    if (walkFront == true) {
      robotPos[2] += robotMoveSpeed;
      // console.log("run")
      // LIBS.rotateZ(robotBody.MOVEMATRIX , LIBS.degToRad(-0.2))
      // LIBS.rotateZ(robotHead.MOVEMATRIX , LIBS.degToRad(-0.2))
      // LIBS.rotateZ(topRobot.MOVEMATRIX , LIBS.degToRad(-0.2))
      // LIBS.rotateZ(armExtension.MOVEMATRIX , LIBS.degToRad(-0.2))
      // LIBS.rotateZ(armExtension2.MOVEMATRIX , LIBS.degToRad(-0.2))
      // LIBS.rotateZ(armUpper.MOVEMATRIX , LIBS.degToRad(-0.2))
      // LIBS.rotateZ(armUpper2.MOVEMATRIX , LIBS.degToRad(-0.2))
      // LIBS.rotateZ(armRobot.MOVEMATRIX , LIBS.degToRad(-0.2))
      // LIBS.rotateZ(armRobot2.MOVEMATRIX , LIBS.degToRad(-0.2))
      // LIBS.rotateZ(footRobot.MOVEMATRIX , LIBS.degToRad(-0.2))
      // LIBS.rotateZ(footRobot2.MOVEMATRIX , LIBS.degToRad(-0.2))
      // LIBS.rotateZ(bottomRobot.MOVEMATRIX , LIBS.degToRad(-0.2))
      // LIBS.rotateZ(robotBody.MOVEMATRIX , LIBS.degToRad(-0.2))
      // LIBS.rotateZ(triangleRobot.MOVEMATRIX , LIBS.degToRad(-0.2))
      // LIBS.rotateZ(triangleRobot2 .MOVEMATRIX , LIBS.degToRad(-0.2))
      // LIBS.rotateZ(robotEye.MOVEMATRIX , LIBS.degToRad(-0.2))

      // LIBS.rotateZ(robotBody.MOVEMATRIX , LIBS.degToRad(2))
      // LIBS.rotateZ(robotHead.MOVEMATRIX , LIBS.degToRad(2))
      // LIBS.rotateZ(topRobot.MOVEMATRIX , LIBS.degToRad(2))
      // LIBS.rotateZ(armExtension.MOVEMATRIX , LIBS.degToRad(2))
      // LIBS.rotateZ(armExtension2.MOVEMATRIX , LIBS.degToRad(2))
      // LIBS.rotateZ(armUpper.MOVEMATRIX , LIBS.degToRad(2))
      // LIBS.rotateZ(armUpper2.MOVEMATRIX , LIBS.degToRad(2))
      // LIBS.rotateZ(armRobot.MOVEMATRIX , LIBS.degToRad(2))
      // LIBS.rotateZ(armRobot2.MOVEMATRIX , LIBS.degToRad(2))
      // LIBS.rotateZ(footRobot.MOVEMATRIX , LIBS.degToRad(2))
      // LIBS.rotateZ(footRobot2.MOVEMATRIX , LIBS.degToRad(2))
      // LIBS.rotateZ(bottomRobot.MOVEMATRIX , LIBS.degToRad(2))
      // LIBS.rotateZ(robotBody.MOVEMATRIX , LIBS.degToRad(2))
      // LIBS.rotateZ(triangleRobot.MOVEMATRIX , LIBS.degToRad(2))
      // LIBS.rotateZ(triangleRobot2 .MOVEMATRIX , LIBS.degToRad(2))
      // LIBS.rotateZ(robotEye.MOVEMATRIX , LIBS.degToRad(2))

      
      
      if(robotPos[2] >= 15) {
        walkFront = false;
        // rotateExecuted = false;
       
      }
    }
    else {
      robotPos[2] -= robotMoveSpeed;
      // LIBS.rotateX(robotSocketEye.MOVEMATRIX , LIBS.degToRad(3))
      // LIBS.rotateX(robotSocketEye.MOVEMATRIX , LIBS.degToRad(3))

      if(robotPos[2] <= -15) {
        walkFront = true;
      }
      
      // rotateExecuted = false;
    }

    robotBody.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(robotBody.MOVEMATRIX, robotBody.MOVEMATRIX, [6, -1.05, 0.0]);

  robotHead.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(robotHead.MOVEMATRIX, robotHead.MOVEMATRIX, [6, 2.95, 0.27])

  // glMatrix.mat4.rotateX(robotHead.MOVEMATRIX,
  // robotHead.MOVEMATRIX , degrees_to_radians(180 ))

  topRobot.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(topRobot.MOVEMATRIX, topRobot.MOVEMATRIX, [6, 3.15, 0])

  armExtension.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(armExtension.MOVEMATRIX, armExtension.MOVEMATRIX,[6.2 , 1.95 , 0])

  armExtension2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(armExtension2.MOVEMATRIX, armExtension2.MOVEMATRIX,[4.8 , 1.95 , 0])

  armUpper.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(armUpper.MOVEMATRIX, armUpper.MOVEMATRIX,[7.1 , 1.95 , 0])
  

  armUpper2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(armUpper2.MOVEMATRIX, armUpper2.MOVEMATRIX,[3.9 , 1.95 , 0])

  armRobot.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(armRobot.MOVEMATRIX, armRobot.MOVEMATRIX,[7.9, -0.05 ,0])
  glMatrix.mat4.rotateY(armRobot.MOVEMATRIX,
    armRobot.MOVEMATRIX, LIBS.degToRad(90));

  armRobot2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(armRobot2.MOVEMATRIX, armRobot2.MOVEMATRIX,[4.7, -0.05 ,0])
  glMatrix.mat4.rotateY(armRobot2.MOVEMATRIX,
    armRobot2.MOVEMATRIX, LIBS.degToRad(90));
  

  footRobot.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(footRobot.MOVEMATRIX, footRobot.MOVEMATRIX,[7.8, -1.05 ,0])
  glMatrix.mat4.rotateY(footRobot.MOVEMATRIX,
  footRobot.MOVEMATRIX, LIBS.degToRad(90));
  // glMatrix.mat4.rotateY(footRobot.MOVEMATRIX,
  // footRobot.MOVEMATRIX , LIBS.degToRad(180))

  footRobot2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(footRobot2.MOVEMATRIX, footRobot2.MOVEMATRIX,[4.3, -1.05 ,0])
  glMatrix.mat4.rotateY(footRobot2.MOVEMATRIX,
  footRobot2.MOVEMATRIX, LIBS.degToRad(90));
  glMatrix.mat4.rotateY(footRobot2.MOVEMATRIX,
    footRobot2.MOVEMATRIX , LIBS.degToRad(180))

  bottomRobot.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(bottomRobot.MOVEMATRIX, bottomRobot.MOVEMATRIX,[6 , -1.51 , 0])

  triangleRobot.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(triangleRobot.MOVEMATRIX , triangleRobot.MOVEMATRIX , [6.8 ,-1.55 ,0 ])
  glMatrix.mat4.rotateX(triangleRobot.MOVEMATRIX,
    triangleRobot.MOVEMATRIX , LIBS.degToRad(180))

    triangleRobot2.MOVEMATRIX = glMatrix.mat4.create();
  glMatrix.mat4.translate(triangleRobot2.MOVEMATRIX , triangleRobot.MOVEMATRIX , [-1.6   ,0.01 ,0 ])
  glMatrix.mat4.rotateX(triangleRobot2.MOVEMATRIX,
    triangleRobot2.MOVEMATRIX , LIBS.degToRad(180))
    glMatrix.mat4.rotateZ(triangleRobot2.MOVEMATRIX,
      triangleRobot2.MOVEMATRIX , LIBS.degToRad(180))

      robotEye.MOVEMATRIX = glMatrix.mat4.create();
      glMatrix.mat4.translate(robotEye.MOVEMATRIX, robotEye.MOVEMATRIX, [6, 3.35, 0.4])
      glMatrix.mat4.rotateX(robotEye.MOVEMATRIX , robotEye.MOVEMATRIX , LIBS.degToRad(90))
     

      robotSocketEye.MOVEMATRIX = glMatrix.mat4.create();
      glMatrix.mat4.translate(robotSocketEye.MOVEMATRIX, robotSocketEye.MOVEMATRIX ,  [6 ,3.35 , 0.3 ])
      glMatrix.mat4.rotateX(robotSocketEye.MOVEMATRIX , robotSocketEye.MOVEMATRIX , LIBS.degToRad(90))

    LIBS.translateZ(robotBody.MOVEMATRIX, robotPos[2]);
    LIBS.translateZ(robotHead.MOVEMATRIX, robotPos[2]);
    LIBS.translateZ(bottomRobot.MOVEMATRIX, robotPos[2]);
    LIBS.translateZ(triangleRobot.MOVEMATRIX, robotPos[2]);
    LIBS.translateZ(triangleRobot2.MOVEMATRIX, robotPos[2]);
    LIBS.translateZ(armExtension.MOVEMATRIX, robotPos[2]);
    LIBS.translateZ(armExtension2.MOVEMATRIX, robotPos[2]);
    LIBS.translateZ(armRobot.MOVEMATRIX, robotPos[2]);
    LIBS.translateZ(armRobot2.MOVEMATRIX, robotPos[2]);
    LIBS.translateZ(armUpper.MOVEMATRIX, robotPos[2]);
    LIBS.translateZ(armUpper2.MOVEMATRIX, robotPos[2]);
    LIBS.translateZ(footRobot.MOVEMATRIX, robotPos[2]);
    LIBS.translateZ(footRobot2.MOVEMATRIX, robotPos[2]);
    LIBS.translateZ(robotEye.MOVEMATRIX, robotPos[2]);
    LIBS.translateZ(robotSocketEye.MOVEMATRIX,robotPos[2]);
 
    // LIBS.rotateX(body.MOVEMATRIX, 1.5);



    if (walkFront == false) {
      LIBS.rotateY(robotBody.MOVEMATRIX, Math.PI);
      
      LIBS.rotateY(robotEye.MOVEMATRIX, Math.PI);
      LIBS.translateZ(robotEye.MOVEMATRIX , -0.75);
      LIBS.rotateY(robotSocketEye.MOVEMATRIX, Math.PI);
      LIBS.translateZ(robotSocketEye.MOVEMATRIX , -0.5);
      // LIBS.translateZ()
      // if(rotateExecuted){
        // console.log("run2")
       //  robotBody.MOVEMATRIX = glMatrix.mat4.create();
       //  glMatrix.mat4.translate(robotBody.MOVEMATRIX, robotBody.MOVEMATRIX, [6, 0.0, 0.0]);
       LIBS.rotateX(robotBody.MOVEMATRIX , LIBS.degToRad(10))
       // LIBS.rotateX(robotHead.MOVEMATRIX , LIBS.degToRad(10))
       LIBS.rotateX(bottomRobot.MOVEMATRIX , LIBS.degToRad(10))
       LIBS.rotateX(triangleRobot.MOVEMATRIX , LIBS.degToRad(10))
       LIBS.rotateX(triangleRobot2.MOVEMATRIX , LIBS.degToRad(10))
       LIBS.translateZ(robotHead.MOVEMATRIX, 0.68)
       LIBS.translateZ(robotEye.MOVEMATRIX, 0.68)
       LIBS.translateZ(robotSocketEye.MOVEMATRIX, 0.68)
       rotateExecuted = false
    //  }
     if(eyeRotateDec){
      // console.log("TESTINGA GAIN")
      LIBS.rotateY(robotSocketEye.MOVEMATRIX , LIBS.degToRad(1))
      LIBS.rotateY(robotSocketEye.MOVEMATRIX , LIBS.degToRad(1))
      eyeRotate += 0.5
      if(eyeRotate == 5){
        eyeRotateDec = false;
      }
    }else if (!eyeRotateDec){
      // console.log("run12132132")
      LIBS.rotateY(robotSocketEye.MOVEMATRIX , LIBS.degToRad(-1))
      LIBS.rotateY(robotSocketEye.MOVEMATRIX , LIBS.degToRad(-1))
      eyeRotate -= 0.5
      if(eyeRotate == 0){
        eyeRotateDec = true;
      }
    }

    if(eyeRotateDec2){
      LIBS.rotateY(robotEye.MOVEMATRIX , LIBS.degToRad(2))
      LIBS.rotateY(robotEye.MOVEMATRIX , LIBS.degToRad(2))
      eyeRotate2 += 0.5
      if(eyeRotate2 == 5){
        eyeRotateDec2 = false;
      }
    }else if (!eyeRotateDec2){
      // console.log("run1515")
      LIBS.rotateY(robotEye.MOVEMATRIX , LIBS.degToRad(-2))
      LIBS.rotateY(robotEye.MOVEMATRIX , LIBS.degToRad(-2))
      eyeRotate2 -= 0.5
      if(eyeRotate2 == 0){
        eyeRotateDec2 = true;
      }
    }
    }
    else {
      if(eyeRotateDec){
        // console.log("TESTT")
        LIBS.rotateY(robotSocketEye.MOVEMATRIX , LIBS.degToRad(-3))
        LIBS.rotateY(robotSocketEye.MOVEMATRIX , LIBS.degToRad(-3))
        eyeRotate += 0.5
        if(eyeRotate == 5){
          eyeRotateDec = false;
        }
      }else if (!eyeRotateDec){
        // console.log("run12")
        LIBS.rotateY(robotSocketEye.MOVEMATRIX , LIBS.degToRad(3))
        LIBS.rotateY(robotSocketEye.MOVEMATRIX , LIBS.degToRad(3))
        eyeRotate -= 0.5
        if(eyeRotate == 0){
          eyeRotateDec = true;
        }
      }

      if(eyeRotateDec2){
        // console.log("TESTINGGGGGGGG")
        LIBS.rotateY(robotEye.MOVEMATRIX , LIBS.degToRad(-2))
        LIBS.rotateY(robotEye.MOVEMATRIX , LIBS.degToRad(-2))
        eyeRotate2 += 0.5
        if(eyeRotate2 == 5){
          eyeRotateDec2 = false;
        }
      }else if (!eyeRotateDec2){
        // console.log("run10")
        LIBS.rotateY(robotEye.MOVEMATRIX , LIBS.degToRad(2))
        LIBS.rotateY(robotEye.MOVEMATRIX , LIBS.degToRad(2))
        eyeRotate2 -= 0.5
        if(eyeRotate2 == 0){
          eyeRotateDec2 = true;
        }
      }

      // if(!rotateExecuted){
        LIBS.rotateX(robotBody.MOVEMATRIX , LIBS.degToRad(-10))
        // LIBS.rotateZ(robotHead.MOVEMATRIX , LIBS.degToRad(-10))
        LIBS.rotateX(bottomRobot.MOVEMATRIX , LIBS.degToRad(-10))
        LIBS.rotateX(triangleRobot.MOVEMATRIX , LIBS.degToRad(-10))
        LIBS.rotateX(triangleRobot2.MOVEMATRIX , LIBS.degToRad(-10))
        // console.log("run")
        rotateExecuted = true;

        LIBS.translateZ(robotHead.MOVEMATRIX, -0.68)
        LIBS.translateZ(robotEye.MOVEMATRIX, - 0.68)
        LIBS.translateZ(robotSocketEye.MOVEMATRIX, -0.68)
      // }
    }

    robotBody.draw();
    // robotHead.draw();
    // topRobot.draw();
    // armExtension.draw();
    // armExtension2.draw();
    // armUpper.draw();
    // armUpper2.draw();
    // armRobot.draw();
    // armRobot2.draw();
    footRobot.draw();
    footRobot2.draw();
    // bottomRobot.draw();
    // triangleRobot.draw();
    // triangleRobot2.draw();
    robotEye.draw();
    robotSocketEye.draw();

    //Mace Windu buat animasi gerak
    
    if (MaceWinduwalkFront == true) {
      MaceWinduPos[2] += MaceWinduMovSpeed;
      if(MaceWinduPos[2] >= 15) {
        MaceWinduwalkFront = false;
      }
    }
    else {
      MaceWinduPos[2] -= MaceWinduMovSpeed;
      if(MaceWinduPos[2] <= -15) {
        MaceWinduwalkFront = true;
      }
    }

    // inisialisasi part move matrix & static animation
    body_Lego.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(body_Lego.MOVEMATRIX, body_Lego.MOVEMATRIX, [-5.55, 0.95, MaceWinduPos[2]]);
    // LIBS.rotateX(body_Lego.MOVEMATRIX, 1.5);

    wraist_Lego.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(wraist_Lego.MOVEMATRIX, wraist_Lego.MOVEMATRIX, [-6.75, 0.0, MaceWinduPos[2]]);

    if (MaceWinduwalkFront == false) {
      LIBS.rotateY(body_Lego.MOVEMATRIX, Math.PI*2);
      LIBS.rotateY(wraist_Lego.MOVEMATRIX, Math.PI*2);
    }

    leftLeg_Lego.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(leftLeg_Lego.MOVEMATRIX, leftLeg_Lego.MOVEMATRIX, [-4.95, -1, MaceWinduPos[2]]);

    rightLeg_Lego.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(rightLeg_Lego.MOVEMATRIX, rightLeg_Lego.MOVEMATRIX, [-6.25, -1, MaceWinduPos[2]]);

    rightHand_Lego.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(rightHand_Lego.MOVEMATRIX, rightHand_Lego.MOVEMATRIX, [-7.15, 0.82, -0.0+MaceWinduPos[2]]);
    glMatrix.mat4.rotateZ(rightHand_Lego.MOVEMATRIX, rightHand_Lego.MOVEMATRIX, degrees_to_radians_Lego(-8));
    // glMatrix.mat4.rotateX(rightHand_Lego.MOVEMATRIX, rightHand_Lego.MOVEMATRIX, degrees_to_radians_Lego(90));

    rightShoulder_Lego.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(rightShoulder_Lego.MOVEMATRIX, rightShoulder_Lego.MOVEMATRIX, [-7.055, 1.1,-0.25+MaceWinduPos[2]]);
    // glMatrix.mat4.rotateX(rightShoulder_Lego.MOVEMATRIX, rightShoulder_Lego.MOVEMATRIX, degrees_to_radians(-100));

    leftHand_Lego.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(leftHand_Lego.MOVEMATRIX, leftHand_Lego.MOVEMATRIX, [-4.18, 2, 1.2+MaceWinduPos[2]]);
    glMatrix.mat4.rotateY(leftHand_Lego.MOVEMATRIX, leftHand_Lego.MOVEMATRIX, degrees_to_radians_Lego(180));
    glMatrix.mat4.rotateZ(leftHand_Lego.MOVEMATRIX, leftHand_Lego.MOVEMATRIX, degrees_to_radians_Lego(-8));
    glMatrix.mat4.rotateX(leftHand_Lego.MOVEMATRIX, leftHand_Lego.MOVEMATRIX, degrees_to_radians_Lego(90));

    leftShoulder_Lego.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(leftShoulder_Lego.MOVEMATRIX, leftShoulder_Lego.MOVEMATRIX, [-4.10, 2.5,0.9+MaceWinduPos[2]]);
    // 
    glMatrix.mat4.rotateY(leftShoulder_Lego.MOVEMATRIX, leftShoulder_Lego.MOVEMATRIX, degrees_to_radians_Lego(180));
    glMatrix.mat4.rotateX(leftShoulder_Lego.MOVEMATRIX, leftShoulder_Lego.MOVEMATRIX, degrees_to_radians_Lego(100));

    rightArm_Lego.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(rightArm_Lego.MOVEMATRIX, rightArm_Lego.MOVEMATRIX, [-7.20, 0.41,-0.3])
    LIBS.translateZ(rightArm_Lego.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(rightArm_Lego.MOVEMATRIX, degrees_to_radians_Lego(0))


    leftArm_Lego.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(leftArm_Lego.MOVEMATRIX, leftArm_Lego.MOVEMATRIX, [-4.18, 2.25,1.63]);
    LIBS.translateZ(leftArm_Lego.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(leftArm_Lego.MOVEMATRIX, degrees_to_radians_Lego(90))
    

    innerRightArm_Lego.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(innerRightArm_Lego.MOVEMATRIX, innerRightArm_Lego.MOVEMATRIX, [-7.20, 0.30,-0.305]);
    LIBS.translateZ(innerRightArm_Lego.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(innerRightArm_Lego.MOVEMATRIX, degrees_to_radians_Lego(0))


    innerLeftArm_Lego.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(innerLeftArm_Lego.MOVEMATRIX, innerLeftArm_Lego.MOVEMATRIX, [-4.18, 2.259,1.75]);
    LIBS.translateZ(innerLeftArm_Lego.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(innerLeftArm_Lego.MOVEMATRIX, degrees_to_radians_Lego(90))

    sayap.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(sayap.MOVEMATRIX, sayap.MOVEMATRIX, [-5.55, -0.91, -1.532]);
    LIBS.translateZ(sayap.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(sayap.MOVEMATRIX, degrees_to_radians_Lego(0.1))

    neck_Lego.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(neck_Lego.MOVEMATRIX, neck_Lego.MOVEMATRIX, [-5.55, 1.5, 0.0]);
    LIBS.translateZ(neck_Lego.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(neck_Lego.MOVEMATRIX, degrees_to_radians_Lego(0))

    head_Lego.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(head_Lego.MOVEMATRIX, head_Lego.MOVEMATRIX, [-5.55, 3.6,-0.04]);
    LIBS.translateZ(head_Lego.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(head_Lego.MOVEMATRIX, degrees_to_radians_Lego(0))

    headKecil.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(headKecil.MOVEMATRIX, headKecil.MOVEMATRIX, [-5.55, 4.2, -0.004]);
    LIBS.translateZ(headKecil.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(headKecil.MOVEMATRIX, degrees_to_radians_Lego(0))

    neckDeco_Lego.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(neckDeco_Lego.MOVEMATRIX, neckDeco_Lego.MOVEMATRIX, [-6.0, 3.4, 0.0]);
    LIBS.translateZ(neckDeco_Lego.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(neckDeco_Lego.MOVEMATRIX, degrees_to_radians_Lego(0))

    mata.MOVEMATRIX = glMatrix.mat4.create(); // mata kiri
    glMatrix.mat4.translate(mata.MOVEMATRIX, mata.MOVEMATRIX, [-5.20, 3.80, 0.500]);
    LIBS.translateZ(mata.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(mata.MOVEMATRIX, degrees_to_radians_Lego(0))

    mata2.MOVEMATRIX = glMatrix.mat4.create(); // mata kanan
    glMatrix.mat4.translate(mata2.MOVEMATRIX, mata2.MOVEMATRIX, [-5.90, 3.80, 0.500]);
    LIBS.translateZ(mata2.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(mata2.MOVEMATRIX, degrees_to_radians_Lego(0))

    mulut.MOVEMATRIX = glMatrix.mat4.create();
    glMatrix.mat4.translate(mulut.MOVEMATRIX, mulut.MOVEMATRIX, [-5.55, 3.35, 0.196]);
    LIBS.translateZ(mulut.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(mulut.MOVEMATRIX, degrees_to_radians_Lego(0))

    saber6.MOVEMATRIX = glMatrix.mat4.create(); // pegangan buat tangannya
    glMatrix.mat4.translate(saber6.MOVEMATRIX, saber6.MOVEMATRIX, [-4.18, 1.855, 1.800]);
    LIBS.translateZ(saber6.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(saber6.MOVEMATRIX, degrees_to_radians_Lego(90))

    saber5.MOVEMATRIX = glMatrix.mat4.create(); //atas pegangan atas lagi bentuk medium
    glMatrix.mat4.translate(saber5.MOVEMATRIX, saber5.MOVEMATRIX, [-4.18, 2.700, 1.700]);
    LIBS.translateZ(saber5.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(saber5.MOVEMATRIX, degrees_to_radians_Lego(90))

    saber4.MOVEMATRIX = glMatrix.mat4.create(); // bawah pegangan bawah lagi bentuk kecil
    glMatrix.mat4.translate(saber4.MOVEMATRIX, saber4.MOVEMATRIX, [-4.18, 1.300, 1.700]);
    LIBS.translateZ(saber4.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(saber4.MOVEMATRIX, degrees_to_radians_Lego(90))

    saber3.MOVEMATRIX = glMatrix.mat4.create(); // bawah pegangan
    glMatrix.mat4.translate(saber3.MOVEMATRIX, saber3.MOVEMATRIX, [-4.18, 1.500, 1.700]);
    LIBS.translateZ(saber3.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(saber3.MOVEMATRIX, degrees_to_radians_Lego(90))

    saber2.MOVEMATRIX = glMatrix.mat4.create(); // atas pegangan
    glMatrix.mat4.translate(saber2.MOVEMATRIX, saber2.MOVEMATRIX, [-4.18, 2.390, 1.700]);
    LIBS.translateZ(saber2.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(saber2.MOVEMATRIX, degrees_to_radians_Lego(90))

    saber1.MOVEMATRIX = glMatrix.mat4.create(); //lampu / pedang lightsaber
    glMatrix.mat4.translate(saber1.MOVEMATRIX, saber1.MOVEMATRIX, [-4.18, 4.850, 1.750]);
    LIBS.translateZ(saber1.MOVEMATRIX, MaceWinduPos[2])
    LIBS.rotateX(saber1.MOVEMATRIX, degrees_to_radians_Lego(90))

    // leg animation Mace Windu
    // Kaki kiri
    temp = LIBS.get_I4();
    LIBS.translateZ(temp, -MaceWinduPos[2]);
    leftLeg_Lego.MOVEMATRIX = LIBS.mul(leftLeg_Lego.MOVEMATRIX, temp);

    if (MaceWindurotateBackLeg1 == true) {
      MaceWinduFeet1RotatePos -= MaceWinduRotateSpeed;
      if (MaceWinduFeet1RotatePos <= -0.35) {
        MaceWindurotateBackLeg1 = false;
      }
    }
    else {
      MaceWinduFeet1RotatePos += MaceWinduRotateSpeed;
      if (MaceWinduFeet1RotatePos >= 0.35) {
        MaceWindurotateBackLeg1 = true;
      }
    }

    if (MaceWinduwalkFront == false) {
      LIBS.rotateY(leftLeg_Lego.MOVEMATRIX, Math.PI);
    }
    
    temp = LIBS.get_I4();
    LIBS.rotateX(temp, MaceWinduFeet1RotatePos);
    leftLeg_Lego.MOVEMATRIX = LIBS.mul(leftLeg_Lego.MOVEMATRIX, temp);
    temp = LIBS.get_I4();
    LIBS.translateZ(temp, MaceWinduPos[2]);
    leftLeg_Lego.MOVEMATRIX = LIBS.mul(leftLeg_Lego.MOVEMATRIX, temp);

    //Kaki kanan
    temp = LIBS.get_I4();
    LIBS.translateZ(temp, -MaceWinduPos[2]);
    rightLeg_Lego.MOVEMATRIX = LIBS.mul(rightLeg_Lego.MOVEMATRIX, temp);

    if (MaceWindurotateBackLeg2 == true) {
      MaceWinduFeet2RotatePos -= MaceWinduRotateSpeed;
      if (MaceWinduFeet2RotatePos <= -0.35) {
        MaceWindurotateBackLeg2 = false;
      }
    }
    else {
      MaceWinduFeet2RotatePos += MaceWinduRotateSpeed;
      if (MaceWinduFeet2RotatePos >= 0.35) {
        MaceWindurotateBackLeg2 = true;
      }
    }

    if (MaceWinduwalkFront == false) {
      LIBS.rotateY(rightLeg_Lego.MOVEMATRIX, Math.PI);
    }
    
    temp = LIBS.get_I4();
    LIBS.rotateX(temp, MaceWinduFeet2RotatePos);
    rightLeg_Lego.MOVEMATRIX = LIBS.mul(rightLeg_Lego.MOVEMATRIX, temp);
    temp = LIBS.get_I4();
    LIBS.translateZ(temp, MaceWinduPos[2]);
    rightLeg_Lego.MOVEMATRIX = LIBS.mul(rightLeg_Lego.MOVEMATRIX, temp);


    if (MaceWinduwalkFront == false) {
      LIBS.rotateY(mata2.MOVEMATRIX, -Math.PI);
      LIBS.translateZ(mata2.MOVEMATRIX, -1.1);
      LIBS.rotateY(mulut.MOVEMATRIX, Math.PI);
      LIBS.translateZ(mulut.MOVEMATRIX, -0.47);
      LIBS.rotateY(mata.MOVEMATRIX, Math.PI);
      LIBS.translateZ(mata.MOVEMATRIX, -1.1);

      //bahu kiri
      LIBS.rotateY(leftShoulder_Lego.MOVEMATRIX, degrees_to_radians_Lego(-35))
      LIBS.rotateZ(leftShoulder_Lego.MOVEMATRIX, degrees_to_radians_Lego(5))
      LIBS.rotateX(leftShoulder_Lego.MOVEMATRIX, degrees_to_radians_Lego(100))
      LIBS.translateZ(leftShoulder_Lego.MOVEMATRIX, -0.70)
      LIBS.translateX(leftShoulder_Lego.MOVEMATRIX, -0.54)
      LIBS.translateY(leftShoulder_Lego.MOVEMATRIX, -1.5)
      
      // bahu kanan
      LIBS.rotateZ(rightShoulder_Lego.MOVEMATRIX, degrees_to_radians_Lego(40))
      LIBS.rotateX(rightShoulder_Lego.MOVEMATRIX, degrees_to_radians_Lego(90))
      LIBS.translateZ(rightShoulder_Lego.MOVEMATRIX, -0.90) // depan belakang
      LIBS.translateX(rightShoulder_Lego.MOVEMATRIX, 0.5) //kanan kiri
      LIBS.translateY(rightShoulder_Lego.MOVEMATRIX, 1.28) // atas bawah
      
      // tangan kanan
      LIBS.rotateX(rightHand_Lego.MOVEMATRIX, degrees_to_radians_Lego(90))
      LIBS.rotateY(rightHand_Lego.MOVEMATRIX, degrees_to_radians_Lego(-8))
      LIBS.translateZ(rightHand_Lego.MOVEMATRIX, -1.40)
      LIBS.translateX(rightHand_Lego.MOVEMATRIX, 0.12)
      LIBS.translateY(rightHand_Lego.MOVEMATRIX, 1.28)

      // tangan kiri
      LIBS.rotateX(leftHand_Lego.MOVEMATRIX, degrees_to_radians_Lego(90))
      LIBS.rotateZ(leftHand_Lego.MOVEMATRIX, degrees_to_radians_Lego(8))
      LIBS.translateX(leftHand_Lego.MOVEMATRIX, 0.15)
      LIBS.translateY(leftHand_Lego.MOVEMATRIX, -1.30)
      LIBS.translateZ(leftHand_Lego.MOVEMATRIX, -1.15)

      // kanan
      LIBS.rotateX(rightArm_Lego.MOVEMATRIX, degrees_to_radians_Lego(90))
      LIBS.translateX(rightArm_Lego.MOVEMATRIX, 0.15)
      LIBS.translateZ(rightArm_Lego.MOVEMATRIX, -1.50)
      LIBS.translateY(rightArm_Lego.MOVEMATRIX, 2.00)

      // kanan
      LIBS.rotateX(innerRightArm_Lego.MOVEMATRIX, degrees_to_radians_Lego(90))
      LIBS.translateX(innerRightArm_Lego.MOVEMATRIX, 0.15)
      LIBS.translateZ(innerRightArm_Lego.MOVEMATRIX, -1.62)
      LIBS.translateY(innerRightArm_Lego.MOVEMATRIX, 2.115)

      // kiri
      LIBS.rotateX(leftArm_Lego.MOVEMATRIX, degrees_to_radians_Lego(-90))
      LIBS.translateX(leftArm_Lego.MOVEMATRIX, 0.18)
      LIBS.translateZ(leftArm_Lego.MOVEMATRIX, -2)
      LIBS.translateY(leftArm_Lego.MOVEMATRIX, -1.93)

      // kiri
      LIBS.rotateX(innerLeftArm_Lego.MOVEMATRIX, degrees_to_radians_Lego(-90))
      LIBS.translateX(innerLeftArm_Lego.MOVEMATRIX, 0.180)
      LIBS.translateZ(innerLeftArm_Lego.MOVEMATRIX, -2.1250)
      LIBS.translateY(innerLeftArm_Lego.MOVEMATRIX, -2.06)

      
      // sayap
      LIBS.rotateX(sayap.MOVEMATRIX, degrees_to_radians_Lego(-30))
      LIBS.translateZ(sayap.MOVEMATRIX, 3.07)
      LIBS.translateX(sayap.MOVEMATRIX, -0.05)
      LIBS.translateY(sayap.MOVEMATRIX, 0.050)

      // LightSaber
      // Saber 1
      LIBS.translateX(saber1.MOVEMATRIX, -2.88) //kanan kiri
      LIBS.translateZ(saber1.MOVEMATRIX, -3.60) // depan belakang
      LIBS.translateY(saber1.MOVEMATRIX, 0.70) // atas bawah

      // Saber 2
      LIBS.translateX(saber2.MOVEMATRIX, -2.88) //kanan kiri
      LIBS.translateZ(saber2.MOVEMATRIX, -3.53) // depan belakang
      LIBS.translateY(saber2.MOVEMATRIX, 0.17) // atas bawah


      // Saber 3
      LIBS.translateX(saber3.MOVEMATRIX, -2.88) //kanan kiri
      LIBS.translateZ(saber3.MOVEMATRIX, -3.53) // depan belakang
      LIBS.translateY(saber3.MOVEMATRIX, 0.17) // atas bawah

      // saber 4
      LIBS.translateX(saber4.MOVEMATRIX, -2.88) //kanan kiri                     3.0
      LIBS.translateZ(saber4.MOVEMATRIX, -3.53) // depan belakang
      LIBS.translateY(saber4.MOVEMATRIX, 0.18) // atas bawah

      // saber 5
      LIBS.translateX(saber5.MOVEMATRIX, -2.88) //kanan kiri
      LIBS.translateZ(saber5.MOVEMATRIX, -3.53) // depan belakang
      LIBS.translateY(saber5.MOVEMATRIX, 0.15) // atas bawah

      // saber 6 (pegangan)
      LIBS.translateX(saber6.MOVEMATRIX, -2.88) //kanan kiri
      LIBS.translateZ(saber6.MOVEMATRIX, -3.7780) // depan belakang
      LIBS.translateY(saber6.MOVEMATRIX, 0.30) // atas bawah
    }

    body_Lego.draw();
    sayap.draw();
    headKecil.draw();
    saber1.draw();
    saber2.draw();
    saber3.draw();
    saber4.draw();
    saber5.draw();
    saber6.draw();
    
    GL.flush();
    window.requestAnimationFrame(animate);
  };

  animate();
}
window.addEventListener("load", main);
