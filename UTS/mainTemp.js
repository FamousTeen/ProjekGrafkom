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

  MOVEMATRIX = LIBS.get_I4(); // WORLD SPACE

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
    GL.vertexAttribPointer(this._color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4);

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
    GL.drawElements(GL.TRIANGLES, 36, GL.UNSIGNED_SHORT, 0);

    // for (let i = 0; i < this.child.length; i++) {
    //   this.child[i].draw();
    // }
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

function main(){
  var CANVAS = document.getElementById("mycanvas");

  CANVAS.width = window.innerWidth;
  CANVAS.height = window.innerHeight;

  var drag = false;
  var x_prev, y_prev;
  var dX = 0, dY = 0;
  var THETA = 0, PHI = 0;
  var AMORTIZATION = 0.95;

  var mouseDown = function(e) {
    drag = true;
    x_prev = e.pageX;
    y_prev = e.pageY;
    e.preventDefault(); // buat batesi default action mouse
    return false;
  }

  var mouseUp = function(e) {
    drag = false;
  }

  var mouseMove = function(e) {
    if (!drag) { // jika drag == false
      return false;
    }

    // var dX = e.pageX - x_prev;
    // var dY = e.pageY - y_prev;
    // THETA += dX * 2 * Math.PI / CANVAS.width;
    // PHI += dY * 2 * Math.PI / CANVAS.height;
    dX = (e.pageX - x_prev) * 2 *Math.PI / CANVAS.width;
    dY = (e.pageY - y_prev) * 2 * Math.PI / CANVAS.height;
    THETA += dX;
    PHI += dY;
    x_prev = e.pageX;
    y_prev = e.pageY;
    e.preventDefault();
  }

  var keyboardDown = function(e) {
    if (e.key == "w") {
      dY = 2 * (Math.PI * -1) / CANVAS.height;
      PHI += dY;
      e.preventDefault();
    }
    if(e.key == "a") {
      dX = 2 * (Math.PI * -1) / CANVAS.width;
      THETA += dX;
      e.preventDefault();
    }
    if(e.key == "d") {
      dX = 2 * (Math.PI) / CANVAS.width;
      THETA += dX;
      e.preventDefault();
    }
    if(e.key == "s") {
      dY = 2 * (Math.PI) / CANVAS.height;
      PHI += dY;
      e.preventDefault();
    }
  }



  CANVAS.addEventListener("mousedown", mouseDown, false);
  CANVAS.addEventListener("mouseup", mouseUp);
  CANVAS.addEventListener("mouseout", mouseUp, false); // luar dari canvas
  CANVAS.addEventListener("mousemove", mouseMove, false); // pas mouse e gerak
  window.addEventListener("keydown", keyboardDown, false);

  try{
      GL = CANVAS.getContext("webgl" , {antialias: false});
  }catch (error){
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

  `

  var shader_fragment_source = `
  precision mediump float;
  uniform float greyscality;

  varying vec3 vColor;
  void main(void){
      float greyscaleValue = (vColor.r + vColor.g + vColor.b) / 3.0;
      vec3 greyscaleColor = vec3(greyscaleValue, greyscaleValue, greyscaleValue);

      vec3 color = mix(greyscaleColor, vColor, greyscality);

      gl_FragColor = vec4(color,1.0);
  }
  `

  // function mix() di atas untuk interpolasi agar warna yang kita pake bervariasi
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
 

  //FACES
  // var triangle_faces = [0 , 1 , 2];
  // var triangle_faces = [
  //   0 , 1 , 2,
  //   0, 2, 3,
  //   4, 5, 6,
  //   4, 6, 7, 
  //   0, 3, 7,
  //   0, 4, 7,
  //   1, 2, 6,
  //   1, 5, 6,
  //   2, 3, 6,
  //   3, 7, 6,
  //   0, 1, 5,
  //   0, 4, 5
  // ];
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

  var object1 = new MyObject(waistVertex, waist_faces, shader_fragment_source, shader_vertex_source);
  // var object2 = new MyObject(legVertex, triangle_faces, shader_fragment_source, shader_vertex_source);

  // object1.addChild(object2);

   var PROJMATRIX = LIBS.get_projection(40 ,CANVAS.width/CANVAS.height,1 ,100);
  //  var MOVEMATRIX = LIBS.get_I4();
   var VIEWMATRIX = LIBS.get_I4();
  
   
  //  var MOVEMATRIX2 = LIBS.get_I4();
  //  var MOVEMATRIX3 = LIBS.get_I4();
  //  LIBS.translateX(MOVEMATRIX, -0.68);
  //  LIBS.translateX(MOVEMATRIX2, 0.75);
  // //  LIBS.rotateY(MOVEMATRIX, -1.6);
  // //  LIBS.rotateY(MOVEMATRIX2, -1.6);
  //  LIBS.translateY(MOVEMATRIX3, 1.15);
  //  LIBS.translateX(MOVEMATRIX3, -1.1);
  //  LIBS.translateZ(MOVEMATRIX3, 0.5);
  //  LIBS.rotateY(MOVEMATRIX3, -1.6);
  //  LIBS.rotateX(MOVEMATRIX, -1.17);
   

  LIBS.translateZ(VIEWMATRIX, -5);
  //Drawing
  GL.clearColor(0.0,0.0,0.0,0.0);

  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);

  GL.clearDepth(1.0);
  var time_prev = 0;

  var animate = function(time){
    var dt = time - time_prev;
    if (time > 0) { // mencegah kalau time = null
      var dt = (time - time_prev);
      if (!drag) {
        dX *= AMORTIZATION;
        dY *= AMORTIZATION;
        THETA += dX;
        PHI += dY;
      }
      // LIBS.rotateX(MOVEMATRIX, dt*0.0004);  
      // LIBS.rotateY(MOVEMATRIX, dt*0.0004);
      // LIBS.rotateZ(MOVEMATRIX, dt*0.0004);
      // LIBS.set_I4(MOVEMATRIX);

      // LIBS.rotateY(MOVEMATRIX, THETA*0.1);
      // LIBS.rotateX(MOVEMATRIX, PHI*0.1);  

      // LIBS.rotateY(MOVEMATRIX2, THETA*0.1);
      // LIBS.rotateX(MOVEMATRIX2, PHI*0.1);
      
      // LIBS.rotateY(MOVEMATRIX3, THETA*0.1);
      // LIBS.rotateX(MOVEMATRIX3, PHI*0.1);

      // LIBS.translateZ(MOVEMATRIX3, 0.01); 
      // LIBS.translateZ(MOVEMATRIX, 0.01); 
      // LIBS.translateZ(MOVEMATRIX2, 0.01);

      // LIBS.translateY(MOVEMATRIX, 0.2);
      // // LIBS.translateY(MOVEMATRIX2, 0.2);

      // LIBS.rotateX(MOVEMATRIX, -(2 * (Math.PI * -1) / CANVAS.height))
      // LIBS.translateY(MOVEMATRIX, -0.2);

      
      // console.log(dt);
      // LIBS.set_I4(MOVEMATRIX);
      // LIBS.set_I4(MOVEMATRIX2);

      // var radius = 2;
      // var pos_x = radius * Math.cos(PHI) * Math.cos(THETA);
      // var pos_y = -radius * Math.sin(PHI);
      // var pos_z = -radius * Math.cos(PHI) * Math.sin(THETA);

      // LIBS.set_position(MOVEMATRIX, pos_x, pos_y, pos_z);
      // LIBS.set_position(MOVEMATRIX2, -pos_x, -pos_y, -pos_z);

      // time_prev = time;
    }
    
    object1.setuniformmatrix4(PROJMATRIX, VIEWMATRIX);
    // console.log(LIBS.degToRad(dt*0.05));
    // WEBGL MATRIX
    object1.MOVEMATRIX = glMatrix.mat4.create();

    if (dt % 2 < 1) {
      // out itu buta nyimpen hasil perhitungane
      glMatrix.mat4.translate(object1.MOVEMATRIX, object1.MOVEMATRIX, [1.0, 0.0, 0.0]);
      // glMatrix.mat4.translate(object1.MOVEMATRIX, object1.MOVEMATRIX, [-1.0, 0.0, 0.0]);
      glMatrix.mat4.rotateY(object1.MOVEMATRIX, object1.MOVEMATRIX, LIBS.degToRad(dt*0.05));
      glMatrix.mat4.translate(object1.MOVEMATRIX, object1.MOVEMATRIX, [-1.0, 0.0, 0.0]);
      // console.log("lol")
      // object1.draw();
    } 
    else {
      // out itu buta nyimpen hasil perhitungane
      glMatrix.mat4.translate(object1.MOVEMATRIX, object1.MOVEMATRIX, [1.0, 0.0, 0.0]);
      // glMatrix.mat4.translate(object1.MOVEMATRIX, object1.MOVEMATRIX, [-1.0, 0.0, 0.0]);
      glMatrix.mat4.rotateY(object1.MOVEMATRIX, object1.MOVEMATRIX, -(LIBS.degToRad(dt*0.05)));
      glMatrix.mat4.translate(object1.MOVEMATRIX, object1.MOVEMATRIX, [-1.0, 0.0, 0.0]);
    }
    object1.draw();

    GL.flush();
    window.requestAnimationFrame(animate);
  }

  animate();
  


}
window.addEventListener("load" , main);