var LIBS={
  
    load_texture : function(image_URL){
      var texture = GL.createTexture();
  
      var image = new Image();
      image.src = image_URL;
      image.onload = function(e) {
        GL.bindTexture(GL.TEXTURE_2D, texture);
        GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
        //GL.generateMipmap(GL.TEXTURE_2D);
        GL.bindTexture(GL.TEXTURE_2D, null);
      };
  
      return texture;
    },
  
    get_json: function(url, func) {
      // create the request:
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.open("GET", url, true);
      xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
          // the file is loaded. Parse it as JSON and lauch func
          func(JSON.parse(xmlHttp.responseText));
        }
      };
      // send the request:
      xmlHttp.send();
    },
  
    degToRad: function(angle){
      return(angle*Math.PI/180);
    },
  
    get_projection: function(angle, a, zMin, zMax) {
      var tan=Math.tan(LIBS.degToRad(0.5*angle)),
          A=-(zMax+zMin)/(zMax-zMin),
            B=(-2*zMax*zMin)/(zMax-zMin);
  
      return [
        0.5/tan, 0 ,   0, 0,
        0, 0.5*a/tan,  0, 0,
        0, 0,         A, -1,
        0, 0,         B, 0
      ];
    },
  
    get_I4: function() {
      return [1,0,0,0,
              0,1,0,0,
              0,0,1,0,
              0,0,0,1];
    },
  
    set_I4: function(m) {
      m[0]=1, m[1]=0, m[2]=0, m[3]=0,
        m[4]=0, m[5]=1, m[6]=0, m[7]=0,
        m[8]=0, m[9]=0, m[10]=1, m[11]=0,
        m[12]=0, m[13]=0, m[14]=0, m[15]=1;
    },
  
    rotateX: function(m, angle) {
      var c=Math.cos(angle);
      var s=Math.sin(angle);
      var mv1=m[1], mv5=m[5], mv9=m[9];
      m[1]=m[1]*c-m[2]*s;
      m[5]=m[5]*c-m[6]*s;
      m[9]=m[9]*c-m[10]*s;
  
      m[2]=m[2]*c+mv1*s;
      m[6]=m[6]*c+mv5*s;
      m[10]=m[10]*c+mv9*s;
    },
  
    rotateY: function(m, angle) {
      var c=Math.cos(angle);
      var s=Math.sin(angle);
      var mv0=m[0], mv4=m[4], mv8=m[8];
      m[0]=c*m[0]+s*m[2];
      m[4]=c*m[4]+s*m[6];
      m[8]=c*m[8]+s*m[10];
  
      m[2]=c*m[2]-s*mv0;
      m[6]=c*m[6]-s*mv4;
      m[10]=c*m[10]-s*mv8;
    },
  
    rotateZ: function(m, angle) {
      var c=Math.cos(angle);
      var s=Math.sin(angle);
      var mv0=m[0], mv4=m[4], mv8=m[8];
      m[0]=c*m[0]-s*m[1];
      m[4]=c*m[4]-s*m[5];
      m[8]=c*m[8]-s*m[9];
  
      m[1]=c*m[1]+s*mv0;
      m[5]=c*m[5]+s*mv4;
      m[9]=c*m[9]+s*mv8;
    },
  
    translateZ: function(m, t){
      m[14]+=t;
    },
  
    translateY: function(m, t){
      m[13]+=t;
    },
  
    translateX: function(m, t){
      m[12]+=t;
    },
  
    multiply: function(m1, m2){
      var res = this.get_I4();
      var N=4;
  
      for(var i=0; i<N; i++){
        for(var j =0; j<N; j++){
          res[i*N+j] = 0;
          for(var k=0; k<N; k++){
            res[i*N+j] += m1[i*N+k] * m2[k*N+j];
          }
        }
      }
      return res;
    },
    rotateAboutAxis: function(m, angle, axisend, axistart) {
      var a = axisend[0] - axistart[0];
      var b = axisend[1] - axistart[1];
      var c = axisend[2] - axistart[2];
      var l = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2) + Math.pow(c, 2));
      var v = Math.sqrt(Math.pow(b, 2) + Math.pow(c, 2));

      // Langkah 1: Translate P0 ke titik asal O
      var T = this.get_I4();
      T[3] = -axistart[0];
      T[7] = -axistart[1];
      T[11] = -axistart[2];
  
      // Langkah 2: Putar vektor sekitar sumbu X untuk mendapatkannya dalam bidang x-z
      var cosThetaX = c / v;
      var sinThetaX = b / v;
      var R_x = this.get_I4();
  
      R_x[5] = cosThetaX;
      R_x[6] = -sinThetaX;
      R_x[9] = sinThetaX;
      R_x[10] = cosThetaX;
  
      // Langkah 3: Putar vektor sekitar sumbu Y untuk mendapatkannya dalam arah Z
      var cosThetaY = v / l;
      var sinThetaY = -a / l;
      var R_y = this.get_I4();
  
      R_y[0] = cosThetaY;
      R_y[2] = sinThetaY;
      R_y[8] = -sinThetaY;
      R_y[10] = cosThetaY;
  
      // Langkah 4: Putar sudut θ sekitar sumbu L
      var cosThetaZ = Math.cos(angle);
      var sinThetaZ = Math.sin(angle);
      var R_z = this.get_I4();
  
      R_z[0] = cosThetaZ;
      R_z[1] = -sinThetaZ;
      R_z[4] = sinThetaZ;
      R_z[5] = cosThetaZ;
  
      // Langkah 5: Balikkan rotasi seputar sumbu Y
      var R_y_inv = this.get_I4();
  
      R_y_inv[0] = cosThetaY;
      R_y_inv[2] = -sinThetaY;
      R_y_inv[8] = sinThetaY;
      R_y_inv[10] = cosThetaY;
  
      // Langkah 6: Balikkan rotasi seputar sumbu X
      var R_x_inv = this.get_I4();
      R_x_inv[5] = cosThetaX;
      R_x_inv[6] = sinThetaX;
      R_x_inv[9] = -sinThetaX;
      R_x_inv[10] = cosThetaX;
  
      // Langkah 7: Balikkan translasi
      var T_inv = this.get_I4();
      T_inv[3] = axistart[0];
      T_inv[7] = axistart[1];
      T_inv[11] = axistart[2];
  
      // Langkah 8: Kalkulasi transformasi total
      var R = this.multiply(T, R_x);
      R = this.multiply(R, R_y);
      R = this.multiply(R, R_z);
      R = this.multiply(R, R_y_inv);
      R = this.multiply(R, R_x_inv);
      R = this.multiply(R, T_inv);

      

    
  
      // Lakukan transformasi pada vektor m
      var result = this.multiply(R, m);
  
      // Update matriks objek dengan hasil transformasi
      for (var i = 0; i < 16; i++) {
          m[i] = result[i];
      }
     
  }
  ,set_position: function(m,x,y,z){
    m[12]=x, m[13]=y, m[14]=z;
}
    
    
   
  };