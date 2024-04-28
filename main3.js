var GL;

function generateSphere(xpos, ypos, zpos, xrad, yrad, zrad, step, stack){
  var vertices = [];
  var faces = [];

  for(var i=0;i<=stack;i++){
    for (var j=0;j<=step;j++){
      var u = i*1.0/stack * Math.PI;
      var v = j*1.0/step * 2*Math.PI;

      var x = Math.cos(v)*Math.sin(u)*xrad;
      var y = Math.cos(u)*yrad;
      var z = Math.sin(v)*Math.sin(u)*zrad;

      u = 1 - i*1.0/stack;
      v = 1 - j*1.0/step;
      vertices.push(x,y,z, i*1.0/stack, j*1.0/step);
    }
  }
  for (var i=0;i<stack;i++){
    for (var j=0;j<step;j++){
      var a = i*(step+1)+j;
      var b = a+1;
      var c = a+step;
      var d = a+step+1;
      faces.push(a,b,d,   a,d,c);
    }
  }
}
function generateCircle(x,y,rad){
    var list = []
    for(var i=0;i<360;i++){
      var a = rad*Math.cos((i/180)*Math.PI) + x;
      var b = rad*Math.sin((i/180)*Math.PI) + y;
      list.push(a);
      list.push(b);
    }
    return list;
  }


  class MyObject{
    canvas = null;
    vertex = [];
    faces = [];


    SHADER_PROGRAM = null;
    _color = null;
    _position = null;
    _uv = null;

    _MMatrix = LIBS.get_I4();
    _PMatrix = LIBS.get_I4();
    _VMatrix = LIBS.get_I4();
    _greyScality = 0;
    _sampler = null;

    TRIANGLE_VERTEX = null;
    TRIANGLE_FACES = null;

    MODEL_MATRIX = LIBS.get_I4();
    texture = null;

    child = [];

    constructor(vertex, faces, source_shader_vertex, source_shader_fragment){
      this.vertex = vertex;
      this.faces = faces;


      var compile_shader = function(source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
          alert("ERROR IN " + typeString + " SHADER: " + GL.getShaderInfoLog(shader));
          return false;
        }
        return shader;
       };
   
    var shader_vertex = compile_shader(source_shader_vertex, GL.VERTEX_SHADER, "VERTEX");
   
    var shader_fragment = compile_shader(source_shader_fragment, GL.FRAGMENT_SHADER, "FRAGMENT");
   
    this.SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(this.SHADER_PROGRAM, shader_vertex);
    GL.attachShader(this.SHADER_PROGRAM, shader_fragment);
   
    GL.linkProgram(this.SHADER_PROGRAM);


    //vao
    this._color = GL.getAttribLocation(this.SHADER_PROGRAM, "color");
    this._position = GL.getAttribLocation(this.SHADER_PROGRAM, "position");
    this._uv = GL.getAttribLocation(this.SHADER_PROGRAM, "uv");


    //uniform
    this._PMatrix = GL.getUniformLocation(this.SHADER_PROGRAM,"PMatrix"); //projection
    this._VMatrix = GL.getUniformLocation(this.SHADER_PROGRAM,"VMatrix"); //View
    this._MMatrix = GL.getUniformLocation(this.SHADER_PROGRAM,"MMatrix"); //Model
    this._greyScality = GL.getUniformLocation(this.SHADER_PROGRAM, "greyScality");//GreyScality
    this._sampler = GL.getUniformLocation(this.SHADER_PROGRAM, "sampler");



    GL.enableVertexAttribArray(this._color);
    GL.enableVertexAttribArray(this._position);
    GL.enableVertexAttribArray(this._uv);
    GL.useProgram(this.SHADER_PROGRAM);




    this.TRIANGLE_VERTEX = GL.createBuffer();
    this.TRIANGLE_FACES = GL.createBuffer();
    this.texture = LIBS.load_texture("Resource/Rock.jpg");
    }


    setup(){
      GL.bindBuffer(GL.ARRAY_BUFFER, this.TRIANGLE_VERTEX);
      GL.bufferData(GL.ARRAY_BUFFER,
      new Float32Array(this.vertex),
      GL.STATIC_DRAW);


      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.TRIANGLE_FACES);
      GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(this.faces),
      GL.STATIC_DRAW);

      this.child.forEach(object => {
        object.setup
      });
    }


    render(VIEW_MATRIX, PROJECTION_MATRIX){
          GL.useProgram(this.SHADER_PROGRAM);  
          GL.activeTexture(GL.TEXTURE0);
          GL.bindTexture(GL.TEXTURE_2D, this.texture);
          GL.bindBuffer(GL.ARRAY_BUFFER, this.TRIANGLE_VERTEX);
          GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.TRIANGLE_FACES);
          GL.vertexAttribPointer(this._position, 3, GL.FLOAT, false, 4*(3+3+2), 0);
          GL.vertexAttribPointer(this._color, 3, GL.FLOAT, false, 4*(3+3+2), 3*4);
          GL.vertexAttribPointer(this._uv, 2, GL.FLOAT, false, 4*(3+3+2), (3+3)*4);
          


          GL.uniformMatrix4fv(this._PMatrix,false,PROJECTION_MATRIX);
          GL.uniformMatrix4fv(this._VMatrix,false,VIEW_MATRIX);
          GL.uniformMatrix4fv(this._MMatrix,false,this.MODEL_MATRIX);
          GL.uniform1f(this._greyScality, 1);
          GL.uniform1i(this._sampler, 0);
 
          GL.drawElements(GL.TRIANGLES, this.faces.length, GL.UNSIGNED_SHORT, 0);

          GL.flush();

          this.child.forEach(object => {
            object.render(VIEW_MATRIX, PROJECTION_MATRIX);
          });
    }
  }
 
 
  function main(){
      var CANVAS = document.getElementById("myCanvas");
 
 
      CANVAS.width = window.innerWidth;
      CANVAS.height = window.innerHeight;


      var drag = false;
      var dX =0;
      var dY=0;


      var X_prev = 0;
      var Y_prev=0;


      var THETA = 0;
      var ALPHA = 0;


      var FRICTION= 0.95;


      var mouseDown = function(e){
        drag = true;
        X_prev = e.pageX;
        Y_prev = e.pageY;
      }


      var mouseUp = function(e){
        drag = false;
      }


      var mouseMove = function(e){
        if(!drag){return false;}
        dX = e.pageX - X_prev;
        dY = e.pageY- Y_prev;
        console.log(dX+" "+dY);
        X_prev = e.pageX;
        Y_prev = e.pageY;


        THETA += dX * 2*Math.PI / CANVAS.width;
        ALPHA += dY * 2*Math.PI / CANVAS.height;
      }


      var keyDown = function(e){
        e.preventDefault();
        console.log(e);
      }


      CANVAS.addEventListener("mousedown", mouseDown, false);
      CANVAS.addEventListener("mouseup", mouseUp, false);
      CANVAS.addEventListener("mouseout", mouseUp,false);
      CANVAS.addEventListener("mousemove", mouseMove, false);
      CANVAS.addEventListener("keydown", keyDown);
 
 
     
      try{
          GL = CANVAS.getContext("webgl", {antialias: true});
      }catch(e){
          alert("WebGL context cannot be initialized");
          return false;
      }
      //shaders
      var shader_vertex_source=`
      attribute vec3 position;
      attribute vec3 color;
      attribute vec2 uv;

      uniform mat4 PMatrix;
      uniform mat4 VMatrix;
      uniform mat4 MMatrix;
     
      varying vec3 vColor;
      varying vec2 vUv;
      void main(void) {
      gl_Position = PMatrix*VMatrix*MMatrix*vec4(position, 1.);
      vColor = color;
      vUv = uv;


      gl_PointSize=20.0;
      }`;
      var shader_fragment_source =`
      precision mediump float;
      varying vec3 vColor;
      varying vec2 vUv;
      // uniform vec3 color;
      uniform sampler2D sampler;

      uniform float greyScality;


      void main(void) {
      float greyScaleValue = (vColor.r + vColor.g + vColor.b)/3.;
      vec3 greyScaleColor = vec3(greyScaleValue, greyScaleValue, greyScaleValue);
      vec3 color = mix(greyScaleColor, vColor, greyScality);
      gl_FragColor = vec4(color, 1.);
      gl_FragColor = texture2D(sampler, vUv) * vec4(color,1.);
      }`;
     
 
 
      /*========================= THE TRIANGLE ========================= */
    POINTS:
    // var triangle_vertex = [
    //   -1, -1, // first corner (ind 0) : -> bottom left of the viewport
    //  1,0,0,
    //   1, -1, // (ind 1) bottom right of the viewport
    //   0,1,0,
    //   0, 1,  // (ind 2) top right of the viewport
    //   0,0,1,
    // ];
 


    var cube = [
        -4, 0, -1, 1, 0, 0, 0, 0, // Vertex 0
        4 , 0, -1, 0, 1, 0, 0, 0, // Vertex 1
        4.5, 0, 1, 0, 0, 1, 1, 1, // Vertex 2
        -4.5, 0, 1, 1, 1, 1, 1, 1, // Vertex 3
        // Top
        -4, 3, -1, 1, 0, 0, 0, 0, // Vertex 4
        4, 3, -1, 0, 1, 0, 0, 0, // Vertex 5
        4.5, 3, 1, 0, 0, 1, 1, 1, // Vertex 6
        -4.5, 3, 1, 1, 1, 1, 1, 1 // Vertex 7
    ]
   
      // FACES:
      var cube_faces = [
        0, 1, 2,
    0, 2, 3,
    // Top
    4, 5, 6,
    4, 6, 7,
    // Side faces
    0, 1, 5,
    0, 5, 4,
    1, 2, 6,
    1, 6, 5,
    2, 3, 7,
    2, 7, 6,
    3, 0, 4,
    3, 4, 7
      ];

      var blockVertices = [
        -4, 0, -1, 1, 0, 0, 0, 0, // Vertex 0
        4 , 0, -1, 0, 1, 0, 0, 0, // Vertex 1
        4.5, 0, 1, 0, 0, 1, 1, 1, // Vertex 2
        -4.5, 0, 1, 1, 1, 1, 1, 1, // Vertex 3
        // Top
        -4, 3, -1, 1, 0, 0, 0, 0, // Vertex 4
        4, 3, -1, 0, 1, 0, 0, 0, // Vertex 5
        4.5, 3, 1, 0, 0, 1, 1, 1, // Vertex 6
        -4.5, 3, 1, 1, 1, 1, 1, 1 // 
];

var blockFaces = [
  0, 1, 2,
  0, 2, 3,
  // Top
  4, 5, 6,
  4, 6, 7,
  // Side faces
  0, 1, 5,
  0, 5, 4,
  1, 2, 6,
  1, 6, 5,
  2, 3, 7,
  2, 7, 6,
  3, 0, 4,
  3, 4, 7
];


      //matrix
      var PROJECTION_MATRIX = LIBS.get_projection(40, CANVAS.width/CANVAS.height, 1,100);
      var VIEW_MATRIX = LIBS.get_I4();
      var MODEL_MATRIX = LIBS.get_I4();
    //   var MODEL_MATRIX2 = LIBS.get_I4();


      LIBS.translateZ(VIEW_MATRIX,-8);


      var object = new MyObject(cube, cube_faces, shader_vertex_source, shader_fragment_source);
      object.setup();
var blockObject = new MyObject(blockVertices, blockFaces, shader_vertex_source, shader_fragment_source);

// Setup the new object
blockObject.setup();

      GL.clearColor(0.0, 0.0, 0.0, 0.0);

      LIBS.translateX(object.MODEL_MATRIX, -1)

      GL.enable(GL.DEPTH_TEST);
      GL.depthFunc(GL.LEQUAL);
 
      var time_prev = 0;
      var animate = function(time) {
          GL.viewport(0, 0, CANVAS.width, CANVAS.height);
          GL.clear(GL.COLOR_BUFFER_BIT | GL.D_BUFFER_BIT);
          var dt = time-time_prev;
          time_prev=time;


          if(!drag){
            dX*=FRICTION;
            dY*=FRICTION;


            THETA += dX *2*Math.PI/CANVAS.width;
            ALPHA += dY * 2*Math.PI/CANVAS.height;
          }


          var radius = 2;
          var pos_x = radius * Math.cos(ALPHA)*Math.sin(THETA);
          var pos_y = radius * Math.sin(ALPHA);
          var pos_z = radius * Math.cos(ALPHA)*Math.cos(THETA);

          var VIEW_MATRIX = LIBS.get_I4();
          LIBS.translateZ(VIEW_MATRIX, -20);


          MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateX(MODEL_MATRIX, -1);
          LIBS.rotateY(MODEL_MATRIX, THETA);
          LIBS.rotateX(MODEL_MATRIX, ALPHA);


          object.MODEL_MATRIX=MODEL_MATRIX;
          object.render(VIEW_MATRIX, PROJECTION_MATRIX);

          var blockModelMatrix = LIBS.get_I4();
          LIBS.translateX(blockModelMatrix, 3); // Example translation
          LIBS.rotateX(blockModelMatrix, ALPHA); // Example rotation
          LIBS.rotateY(blockModelMatrix, THETA); // Example rotation
          blockObject.MODEL_MATRIX = blockModelMatrix;
          blockObject.render(VIEW_MATRIX, PROJECTION_MATRIX);
       

          window.requestAnimationFrame(animate);
      };
 
 
      animate(0);
  }
  window.addEventListener('load',main);

