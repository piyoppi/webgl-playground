const vertexShaderSource = `
  attribute vec4 a_position;
  attribute vec4 a_color;
  uniform mat4 u_camera_matrix;
  uniform mat4 u_matrix;
  varying vec4 v_color;

  void main() {
    vec4 position = u_camera_matrix * u_matrix * a_position;
    gl_Position = position;

    v_color = a_color;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  varying vec4 v_color;

  void main() {
    gl_FragColor = v_color;
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  // シェーダのコンパイル結果を取得
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  // シェーダをアタッチ
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  // リンク
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function deg2rad(deg) {
  return (deg / 180.0) * Math.PI;
}

class Mat4 {
  static mul(a, b) {
    return [
       a[0] * b[ 0] + a[4] * b[ 1] + a[ 8] * b[ 2] + a[12] * b[ 3],
       a[1] * b[ 0] + a[5] * b[ 1] + a[ 9] * b[ 2] + a[13] * b[ 3],
       a[2] * b[ 0] + a[6] * b[ 1] + a[10] * b[ 2] + a[14] * b[ 3],
       a[3] * b[ 0] + a[7] * b[ 1] + a[11] * b[ 2] + a[15] * b[ 3],
       a[0] * b[ 4] + a[4] * b[ 5] + a[ 8] * b[ 6] + a[12] * b[ 7],
       a[1] * b[ 4] + a[5] * b[ 5] + a[ 9] * b[ 6] + a[13] * b[ 7],
       a[2] * b[ 4] + a[6] * b[ 5] + a[10] * b[ 6] + a[14] * b[ 7],
       a[3] * b[ 4] + a[7] * b[ 5] + a[11] * b[ 6] + a[15] * b[ 7],
       a[0] * b[ 8] + a[4] * b[ 9] + a[ 8] * b[10] + a[12] * b[11],
       a[1] * b[ 8] + a[5] * b[ 9] + a[ 9] * b[10] + a[13] * b[11],
       a[2] * b[ 8] + a[6] * b[ 9] + a[10] * b[10] + a[14] * b[11],
       a[3] * b[ 8] + a[7] * b[ 9] + a[11] * b[10] + a[15] * b[11],
       a[0] * b[12] + a[4] * b[13] + a[ 8] * b[14] + a[12] * b[15],
       a[1] * b[12] + a[5] * b[13] + a[ 9] * b[14] + a[13] * b[15],
       a[2] * b[12] + a[6] * b[13] + a[10] * b[14] + a[14] * b[15],
       a[3] * b[12] + a[7] * b[13] + a[11] * b[14] + a[15] * b[15]
    ];
  }

  static mulAll(matrixes) {
    let currentMat = matrixes[0];
    for(let i = 1; i < matrixes.length; i++ ) {
      currentMat = Mat4.mul(matrixes[i], currentMat);
    }
    return currentMat;
  }

  static rotateX(rad) {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    return [
      1.0,  0.0, 0.0, 0.0,
      0.0,  cos, sin, 0.0,
      0.0, -sin, cos, 0.0,
      0.0,  0.0, 0.0, 1.0
    ];
  }

  static rotateY(rad) {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    return [
      cos, 0.0, -sin, 0.0,
      0.0, 1.0,  0.0, 0.0,
      sin, 0.0,  cos, 0.0,
      0.0, 0.0,  0.0, 1.0
    ];
  }

  static rotateZ(rad) {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    return [
       cos, sin, 0.0, 0.0,
      -sin, cos, 0.0, 0.0,
       0.0, 0.0, 1.0, 0.0,
       0.0, 0.0, 0.0, 1.0
    ];
  }

  static translate(x, y, z) {
    return [
      1.0, 0.0, 0.0, 0.0,
      0.0, 1.0, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
        x,   y,   z, 1.0
    ];
  }

  static scale(x, y, z) {
    return [
        x, 0.0, 0.0, 0.0,
      0.0,   y, 0.0, 0.0,
      0.0, 0.0,   z, 0.0,
      0.0, 0.0, 0.0, 1.0
    ];
  }

  static inverse(mat) {
    const a11 = mat[0];
    const a12 = mat[4];
    const a13 = mat[8];
    const a14 = mat[12];
    const a21 = mat[1];
    const a22 = mat[5];
    const a23 = mat[9];
    const a24 = mat[13];
    const a31 = mat[2];
    const a32 = mat[6];
    const a33 = mat[10];
    const a34 = mat[14];
    const a41 = mat[3];
    const a42 = mat[7];
    const a43 = mat[11];
    const a44 = mat[15];

    const det =
      a11 * a22 * a33 * a44
      + a11 * a23 * a34 * a42
      + a11 * a24 * a32 * a43
      - a11 * a24 * a33 * a42
      - a11 * a23 * a32 * a44
      - a11 * a22 * a34 * a43
      - a12 * a21 * a33 * a44
      - a13 * a21 * a34 * a42
      - a14 * a21 * a32 * a43
      + a14 * a21 * a33 * a42
      + a13 * a21 * a32 * a44
      + a12 * a21 * a34 * a43
      + a12 * a23 * a31 * a44
      + a13 * a24 * a31 * a42
      + a14 * a22 * a31 * a43
      - a14 * a23 * a31 * a42
      - a13 * a22 * a31 * a44
      - a12 * a24 * a31 * a43
      - a12 * a23 * a34 * a41
      - a13 * a24 * a32 * a41
      - a14 * a22 * a33 * a41
      + a14 * a23 * a32 * a41
      + a13 * a22 * a34 * a41
      + a12 * a24 * a33 * a41;

    return [
      (a22 * a33 * a44 + a23 * a34 * a42 + a24 * a32 * a43 - a24 * a33 * a42 - a23 * a32 * a44 - a22 * a34 * a43) / det,
      (-a12 * a33 * a44 - a13 * a34 * a42 - a14 * a32 * a43 + a14 * a33 * a42 + a13 * a32 * a44 + a12 * a34 * a43) / det,
      (a12 * a23 * a44 + a13 * a24 * a42 + a14 * a22 * a43 - a14 * a23 * a42 - a13 * a22 * a44 - a12 * a24 * a43) / det,
      (-a12 * a23 * a34 - a13 * a24 * a32 - a14 * a22 * a33 + a14 * a23 * a32 + a13 * a22 * a34 + a12 * a24 * a33) / det,
      (-a21 * a33 * a44 - a23 * a34 * a41 - a24 * a31 * a43 + a24 * a33 * a41 + a23 * a31 * a44 + a21 * a34 * a43) / det,
      (a11 * a33 * a44 + a13 * a34 * a41 + a14 * a31 * a43 - a14 * a33 * a41 - a13 * a31 * a44 - a11 * a34 * a43) / det,
      (-a11 * a23 * a44 - a13 * a24 * a41 - a14 * a21 * a43 + a14 * a23 * a41 + a13 * a21 * a44 + a11 * a24 * a43) / det,
      (a11 * a23 * a34 + a13 * a24 * a31 + a14 * a21 * a33 - a14 * a23 * a31 - a13 * a21 * a34 - a11 * a24 * a33) / det,
      (a21 * a32 * a44 + a22 * a34 * a41 + a24 * a31 * a42 - a24 * a32 * a41 - a22 * a31 * a44 - a21 * a34 * a42) / det,
      (-a11 * a32 * a44 - a12 * a34 * a41 - a14 * a31 * a42 + a14 * a32 * a41 + a12 * a31 * a44 + a11 * a34 * a42) / det,
      (a11 * a22 * a44 + a12 * a24 * a41 + a14 * a21 * a42 - a14 * a22 * a41 - a12 * a21 * a44 - a11 * a24 * a42) / det,
      (-a11 * a22 * a34 - a12 * a24 * a31 - a14 * a21 * a32 + a14 * a22 * a31 + a12 * a21 * a34 + a11 * a24 * a32) / det,
      (-a21 * a32 * a43 - a22 * a33 * a41 - a23 * a31 * a42 + a23 * a32 * a41 + a22 * a31 * a43 + a21 * a33 * a42) / det,
      (a11 * a32 * a43 + a12 * a33 * a41 + a13 * a31 * a42 - a13 * a32 * a41 - a12 * a31 * a43 - a11 * a33 * a42) / det,
      (-a11 * a22 * a43 - a12 * a23 * a41 - a13 * a21 * a42 + a13 * a22 * a41 + a12 * a21 * a43 + a11 * a23 * a42) / det,
      (a11 * a22 * a33 + a12 * a23 * a31 + a13 * a21 * a32 - a13 * a22 * a31 - a12 * a21 * a33 - a11 * a23 * a32) / det
    ];
  }

  static perspective(fov, aspect, near, far) {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    const rangeInv = 1.0 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  }

  static perspective2(top, bottom, left, right, near, far) {
    return [
      (2 * near) / (right - left), 0, 0, 0,
      0, (2 * near) / (top - bottom), 0, 0,
      (right + left) / (right - left), (top + bottom) / (top - bottom), -(far + near) / (far - near), -1,
      0, 0, -(2 * far * near) / (far - near), 0
    ];
  }
}

class Mat1 {
  static mul4(a, b) {
    return [
      a[ 0] * b[0] + a[ 1] * b[1] + a[ 2] * b[2] + a[ 3] * b[3],
      a[ 4] * b[0] + a[ 5] * b[1] + a[ 6] * b[2] + a[ 7] * b[3],
      a[ 8] * b[0] + a[ 9] * b[1] + a[10] * b[2] + a[11] * b[3],
      a[12] * b[0] + a[13] * b[1] + a[14] * b[2] + a[15] * b[3],
    ];
  }
}

class Plane {
  constructor(x, y, z, width, height) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.width = width;
    this.height = height;
    this.vertexes = [];
    this.setXYPlaneVertexes();
  }

  setXYPlaneVertexes() {
    this.vertexes = Plane.xyPlaneVertexes(this.x, this.y, this.z, this.width, this.height);
  }

  static xyPlaneVertexes(x1, y1, z, width, height, isFront) {
    const x2 = x1 + width;
    const y2 = y1 + height;

    if( isFront ) {
      return [
        x1, y1, z,
        x1, y2, z,
        x2, y1, z,
        x1, y2, z,
        x2, y2, z,
        x2, y1, z,
      ];
    } else {
      return [
        x1, y2, z,
        x1, y1, z,
        x2, y1, z,
        x2, y2, z,
        x1, y2, z,
        x2, y1, z,
      ];
    }
  }

  static zyPlaneVertexes(x, y1, z1, height, depth, isFront) {
    const y2 = y1 + height;
    const z2 = z1 + depth;

    if( isFront ) {
      return [
        x, y1, z1,
        x, y2, z1,
        x, y1, z2,
        x, y2, z1,
        x, y2, z2,
        x, y1, z2,
      ];
    } else {
      return [
        x, y1, z1,
        x, y1, z2,
        x, y2, z1,
        x, y2, z1,
        x, y1, z2,
        x, y2, z2,
      ];
    }
  }

  static xzPlaneVertexes(x1, y, z1, width, depth, isFront) {
    const x2 = x1 + width;
    const z2 = z1 + depth;

    if( isFront ) {
      return [
        x1, y, z1,
        x1, y, z2,
        x2, y, z1,
        x1, y, z2,
        x2, y, z2,
        x2, y, z1,
      ];
    } else {
      return [
        x1, y, z1,
        x2, y, z1,
        x1, y, z2,
        x1, y, z2,
        x2, y, z1,
        x2, y, z2
      ];
    }
  }
}

class Cube {
  constructor(x, y, z, width, height, depth) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.vertexes = [];
    this.vertexColors = [];
    this.matrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this.transformes = [];

    this.setVertexes();
    this.setColors();
  }

  setRotateZ(deg, index = -1) {
    const rotateMat = [
      Mat4.translate(-this.x, -this.y, 0),
      Mat4.rotateZ(deg2rad(deg)),
      Mat4.translate(this.x, this.y, 0),
    ];
    this._setTransformes(Mat4.mulAll(rotateMat));
  }

  clearTransform() {
    this.transformes.length = 0;
  }

  _setTransformes(mat, index) {
    if( index >= 0 ) {
      this.transformes[index] = mat;
    } else {
      this.transformes.push(mat);
    }
  }

  calcTransformMatrix() {
    this.matrix = new Float32Array(Mat4.mulAll(this.transformes));
  }

  setVertexes() {
    const center = [
      this.width / 2.0,
      this.height / 2.0,
      this.depth / 2.0,
    ];

    this.vertexes = [
      ...Plane.xyPlaneVertexes(this.x - center[0], this.y - center[1], this.z - center[2], this.width, this.height, true),
      ...Plane.zyPlaneVertexes(this.x + center[0], this.y - center[1], this.z - center[2], this.height, this.depth, true),
      ...Plane.xyPlaneVertexes(this.x - center[0], this.y - center[1], this.z + center[2], this.width, this.height, false),
      ...Plane.zyPlaneVertexes(this.x - center[0], this.y - center[1], this.z - center[2], this.height, this.depth, false),
      ...Plane.xzPlaneVertexes(this.x - center[0], this.y + center[1], this.z - center[2], this.width, this.depth, true),
      ...Plane.xzPlaneVertexes(this.x - center[0], this.y - center[1], this.z - center[2], this.width, this.depth, false),
    ]
  }

  setColors() {
    this.vertexColors = [
      255, 0, 0, 255,
      255, 0, 0, 255,
      255, 0, 0, 255,
      255, 0, 0, 255,
      255, 0, 0, 255,
      255, 0, 0, 255,

      0, 255, 0, 255,
      0, 255, 0, 255,
      0, 255, 0, 255,
      0, 255, 0, 255,
      0, 255, 0, 255,
      0, 255, 0, 255,

      0, 0, 255, 255,
      0, 0, 255, 255,
      0, 0, 255, 255,
      0, 0, 255, 255,
      0, 0, 255, 255,
      0, 0, 255, 255,

      0, 255, 255, 255,
      0, 255, 255, 255,
      0, 255, 255, 255,
      0, 255, 255, 255,
      0, 255, 255, 255,
      0, 255, 255, 255,

      255, 255, 0, 255,
      255, 255, 0, 255,
      255, 255, 0, 255,
      255, 255, 0, 255,
      255, 255, 0, 255,
      255, 255, 0, 255,

      255, 0, 255, 255,
      255, 0, 255, 255,
      255, 0, 255, 255,
      255, 0, 255, 255,
      255, 0, 255, 255,
      255, 0, 255, 255,
    ];
  }
}

class Camera {
  constructor(width, height) {
    this.matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1];
    this.width = width;
    this.height = height;
  }

  setTransformMatrix(pos, rot, scale) {
    const rad = rot.map( deg => (deg / 180.0) * Math.PI );
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const depth = 400;

    const transformes = [
      // カメラの平行移動
      //
      // ワールド座標系から見た点をP(w), カメラ座標系から見た点をP(c),ワールド座標系から見たカメラ位置をC(w)とすると、
      // P(c) = -C(w) + P(w)
      // -C(w)だけ平行移動する変換行列Tとすると、
      // P(c) = TP(w)
      // 以下の変換行列がTに相当
      Mat4.translate(-pos[0], -pos[1], -pos[2]),
      // カメラの回転
      // カメラの回転角度と逆向きに回転することでワールド座標系の座標軸と一致する
      Mat4.rotateX(-rad[0]),
      Mat4.rotateY(-rad[1]),
      Mat4.rotateZ(-rad[2]),
      // 透視投影変換
      Mat4.perspective(deg2rad(50), this.width / this.height, 1, 2000)
    ];

    this.matrix = new Float32Array(Mat4.mulAll(transformes));
  }
}

const canvas = document.getElementById("canvas");
let gl = null;
let vertexColorAttributeLocation;
let positionAttributeLocation;
let cameraMatrixLocation;
let matrixLocation;
let camera;

const primitives = [];

function initialize() {
  gl = canvas.getContext("webgl");

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);

  gl.useProgram(program);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  camera = new Camera(gl.canvas.width, gl.canvas.height);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  vertexColorAttributeLocation = gl.getAttribLocation(program, "a_color");
  positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  cameraMatrixLocation = gl.getUniformLocation(program, "u_camera_matrix");
  matrixLocation = gl.getUniformLocation(program, "u_matrix");
}

function uploadVertex() {
  /* --------------------------------------------------------------------------------- */
  /* positionBuffer に頂点データをセットする */
  const positionBuffer = gl.createBuffer();
  const vertexes = new Float32Array(primitives.map( primitive => primitive.vertexes ).flat());
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    vertexes,
    gl.STATIC_DRAW
  );

  /* --------------------------------------------------------------------------------- */
  /* positionBuffer に頂点データをセットする */
  const colorBuffer = gl.createBuffer();
  const colors = new Uint8Array(primitives.map( primitive => primitive.vertexColors ).flat());
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    colors,
    gl.STATIC_DRAW
  );

  /* --------------------------------------------------------------------------------- */
  /* 属性(a_position)にバッファ(positionBuffer)の内容を流し込む */
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  /* --------------------------------------------------------------------------------- */
  /* 属性(a_color)にバッファ(colorBuffer)の内容を流し込む */
  gl.enableVertexAttribArray(vertexColorAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(vertexColorAttributeLocation, 4, gl.UNSIGNED_BYTE, false, 0, 0);
}

function render(camera) {
  /* --------------------------------------------------------------------------------- */
  /* 描画の下準備 */
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  /* --------------------------------------------------------------------------------- */
  /* カメラの移動と回転と拡大縮小 */
  gl.uniformMatrix4fv(cameraMatrixLocation, false, camera.matrix);

  let offset = 0;
  for(let i = 0; i < primitives.length; i++ ) {
    gl.uniformMatrix4fv(matrixLocation, false, primitives[i].matrix);

    /* 頂点ベクトルの始点（0）から n つぶんの頂点を利用してプリミティブを描画 */
    const length = primitives[i].vertexes.length / 3;
    gl.drawArrays(gl.TRIANGLES, offset, length);
    offset += length;
  }
}

let rotZ = 0;

let cameraPosition = [0, 0, 0];
let cameraRotateZ = 0;
let rotateAngle = 0;
const rotateRadius = 500;
function step() {
  const primitive = primitives[0];
  primitive.clearTransform();
  primitive.setRotateZ(rotZ++);
  primitive.calcTransformMatrix();

  const primitive2 = primitives[1];
  primitive2.clearTransform();
  primitive2.setRotateZ(-rotZ);
  primitive2.calcTransformMatrix();


  rotateAngle+=0.5;
  const rotateAngleRad = deg2rad(rotateAngle);
  cameraRotateZ = rotateAngle + 90;
  cameraPosition[0] = rotateRadius * Math.cos(rotateAngleRad);
  cameraPosition[2] = -rotateRadius * Math.sin(rotateAngleRad) - 150;

  camera.setTransformMatrix(cameraPosition, [0.0, cameraRotateZ, 0.0], [1.0, 1.0, 1.0]);

  render(camera);
  requestAnimationFrame(step);
}

initialize();

const cube = new Cube(0, 0, 0, 50, 50, 50);
const cube2 = new Cube(0, 0, -300, 50, 50, 50);
const cube3 = new Cube(-150, 0, -150, 50, 50, 50);
const cube4 = new Cube(150, 0, -150, 50, 50, 50);
primitives.push(cube);
primitives.push(cube2);
primitives.push(cube3);
primitives.push(cube4);

camera.setTransformMatrix([0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [1.0, 1.0, 1.0]);

uploadVertex();
step();
