const vertexShaderSource = `
  attribute vec4 a_position;
  uniform mat4 u_matrix;

  void main() {
    gl_Position = u_matrix * a_position;
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  void main() {
    gl_FragColor = vec4(1, 0, 0, 1);
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
  }

  setXYPlaneVertexes() {
    const [x1, y1] = [this.x, this.y];
    const x2 = this.x + this.width;
    const y2 = this.y + this.height;
    const z = this.z;

    this.vertexes = [
      x1, y1, z,
      x2, y1, z,
      x1, y2, z,
      x1, y2, z,
      x2, y1, z,
      x2, y2, z
    ];
  }

  initialize() {
    this.setXYPlaneVertexes();
  }
}

class Camera {
  constructor(width, height) {
    this.matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1];
    this.width = width;
    this.height = height;
  }

  setTransformMatrix(pos, deg, scale) {
    const rad = (deg / 180.0) * 2.0 * Math.PI;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const transformes = [
      // カメラを移動するとスプライトは逆向きに動くので反転
      Mat4.scale(-1.0, -1.0, 1.0),
      // カメラの平行移動
      Mat4.translate(pos[0], pos[1], pos[2]),
      // 回転中心をカメラ中心にする
      Mat4.translate(this.width / 2.0, this.height / 2.0, 0.0),
      // カメラの回転
      Mat4.rotateZ(rad),
      // 中心座標を戻す
      Mat4.translate(-this.width / 2.0, -this.height / 2.0, 0.0),
      // 反転を戻す
      Mat4.scale(-1.0, -1.0, 1.0),
      // スケール変換
      Mat4.scale(scale[0], scale[1], scale[2]),
      //クリップ座標系に変換
      Mat4.scale(2.0 / this.width, 2.0 / this.height, 0.0),
      Mat4.translate(-1.0, -1.0, 0.0),
      // Y軸のみ反転
      Mat4.scale(1.0, -1.0, 1.0),
    ];

    this.matrix = new Float32Array(Mat4.mulAll(transformes));
    console.log(transformes);
    console.log(this.matrix);
    console.log(Mat1.mul4(this.matrix, [0, 0, 0, 1]));
    console.log(Mat1.mul4(this.matrix, [100, 100, 0, 1]));
  }
}

const canvas = document.getElementById("canvas");
let gl = null;
let positionAttributeLocation;
let matrixLocation;
let camera;

const planes = [];

function initialize() {
  gl = canvas.getContext("webgl");

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);

  gl.useProgram(program);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  camera = new Camera(gl.canvas.width, gl.canvas.height);

  positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  matrixLocation = gl.getUniformLocation(program, "u_matrix");
}

function uploadVertex() {
  const targetSprite = planes[0];

  /* --------------------------------------------------------------------------------- */
  /* positionBuffer に頂点データをセットする */
  const positionBuffer = gl.createBuffer();
  const vertexes = new Float32Array(planes.map( plane => plane.vertexes ).flat());
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    vertexes,
    gl.STATIC_DRAW
  );

  /* --------------------------------------------------------------------------------- */
  /* 属性(a_position)にバッファ(positionBuffer)の内容を流し込む */
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
}

function render(camera) {
  /* --------------------------------------------------------------------------------- */
  /* 描画の下準備 */
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  /* --------------------------------------------------------------------------------- */
  /* カメラの移動と回転と拡大縮小 */
  gl.uniformMatrix4fv(matrixLocation, false, camera.matrix);

  /* 頂点ベクトルの始点（0）から n つぶんの頂点を利用してプリミティブを描画 */
  gl.drawArrays(gl.TRIANGLES, 0, 6 * planes.length);
}

function step() {
  render(camera);
  requestAnimationFrame(step);
}

initialize();

const plane = new Plane(0, 0, 0, 100, 100);
plane.initialize(gl);
planes.push(plane);

camera.setTransformMatrix([0.0, 0.0, 0.0], 0.0, [1.0, 1.0, 1.0]);

uploadVertex();
step();
