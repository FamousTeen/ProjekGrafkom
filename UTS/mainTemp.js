var handVertex = []
  handVertex.push(0);
  handVertex.push(0);
  handVertex.push(0);
  handVertex.push(221/255);
  handVertex.push(112/255);
  handVertex.push(24/255);

  for (var i = 0; i <= 720; i++) {
    if (i <= 360) {
      var x =
        ((CANVAS.width / 3) * Math.cos(degrees_to_radians(i))) / CANVAS.width;
      var y =
        ((CANVAS.height / 3) * Math.sin(degrees_to_radians(i))) / CANVAS.height;
      handVertex.push(x);
      handVertex.push(0);
      handVertex.push(y);
      handVertex.push(221/255);
      handVertex.push(112/255);
      handVertex.push(24/255);
    }
    if (i == 360) {
      handVertex.push(0);
      handVertex.push(1);
      handVertex.push(0);
      handVertex.push(221/255);
      handVertex.push(112/255);
      handVertex.push(24/255);
    }
    if (i >= 360) {
      var x =
        ((CANVAS.width / 3) * Math.cos(degrees_to_radians(i % 360))) /
        CANVAS.width;
      var y =
        ((CANVAS.height / 3) * Math.sin(degrees_to_radians(i % 360))) /
        CANVAS.height;
      handVertex.push(x);
      handVertex.push(1.4);
      handVertex.push(y);
      handVertex.push(221/255);
      handVertex.push(112/255);
      handVertex.push(24/255);
    }
    if (i == 720) {
      var x =
        ((CANVAS.width / 3) * Math.cos(degrees_to_radians(360))) / CANVAS.width;
      var y =
        ((CANVAS.height / 3) * Math.sin(degrees_to_radians(360))) /
        CANVAS.height;
        handVertex.push(x);
      handVertex.push(1);
      handVertex.push(y);
      handVertex.push(221/255);
      handVertex.push(112/255);
      handVertex.push(24/255);
    }
  }

  var hand_faces = []
  console.log(handVertex.length / 6 - 1)

    for (var i = 0; i < handVertex.length / 6 - 1; i++) {
      if (i <= 360) {
        hand_faces.push(0);
        hand_faces.push(i);
        hand_faces.push(i + 1);
      }
      if (i > 362) {
        hand_faces.push(362);
        hand_faces.push(i);
        hand_faces.push(i + 1);
      }
    }

    var bottom_circle_index = 0;
    var top_circle_index = 363;

    for (var i = 0; i <= 360; i++) {
      hand_faces.push(bottom_circle_index);
      hand_faces.push(bottom_circle_index + 1);
      hand_faces.push(top_circle_index);
      hand_faces.push(top_circle_index);
      hand_faces.push(top_circle_index + 1);
      hand_faces.push(bottom_circle_index + 1);
      bottom_circle_index++;
      top_circle_index++;
    }