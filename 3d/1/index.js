const vertexShaderSource = `
  attribute vec4 a_position;
  attribute vec4 a_color;
  uniform mat4 u_camera_matrix;
  uniform mat4 u_matrix;
  varying vec4 v_color;

  void main() {
    gl_Position = u_camera_matrix * u_matrix * a_position;
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
  return (deg / 180.0) * 2.0 * Math.PI;
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
    const rad = rot.map( deg => (deg / 180.0) * 2.0 * Math.PI );
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const depth = 400;

    const transformes = [
      // カメラを移動するとスプライトは逆向きに動くので反転
      Mat4.scale(-1.0, -1.0, 1.0),
      // カメラの平行移動
      Mat4.translate(pos[0], pos[1], pos[2]),
      // 回転中心をカメラ中心にする
      Mat4.translate(this.width / 2.0, this.height / 2.0, 0.0),
      // カメラの回転
      Mat4.rotateX(rad[0]),
      Mat4.rotateY(rad[1]),
      Mat4.rotateZ(rad[2]),
      // 中心座標を戻す
      Mat4.translate(-this.width / 2.0, -this.height / 2.0, 0.0),
      // 反転を戻す
      Mat4.scale(-1.0, -1.0, 1.0),
      // スケール変換
      Mat4.scale(scale[0], scale[1], scale[2]),
      //クリップ座標系に変換
      Mat4.scale(2.0 / this.width, 2.0 / this.height, 2 / depth),
      Mat4.translate(-1.0, -1.0, 0.0),
      // Y軸のみ反転
      Mat4.scale(1.0, -1.0, 1.0),
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
  gl.clear(gl.COLOR_BUFFER_BIT);

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
function step() {
  const primitive = primitives[0];
  primitive.clearTransform();
  primitive.setRotateZ(rotZ++);
  primitive.calcTransformMatrix();
  render(camera);
  requestAnimationFrame(step);
}

initialize();

const cube = new Cube(100, 100, 0, 100, 100, 100);
const cube2 = new Cube(150, 150, 0, 100, 100, 100);
primitives.push(cube);
primitives.push(cube2);

camera.setTransformMatrix([0.0, -100.0, 0.0], [30.0, 10.0, 0.0], [1.0, 1.0, 1.0]);

uploadVertex();
step();
