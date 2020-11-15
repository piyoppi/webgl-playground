const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  uniform mat3 u_matrix;

  void main() {
    // ピクセル空間座標からクリップ空間座標に変換
    vec3 position = u_matrix * vec3(a_position, 1.0);

    //mat3 m = mat3(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, -1.0, -1.0, 1.0);
    //position = m * position;

    gl_Position = vec4(position.xy, 0, 1);

    // フラグメントシェーダに値を引き継ぐ
    v_texCoord = a_texCoord;
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  uniform sampler2D u_image;
  varying vec2 v_texCoord;

  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
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

class Mat3 {
  static mul(a, b) {
    return [
       a[0] * b[0] + a[3] * b[1] + a[6] * b[2],
       a[1] * b[0] + a[4] * b[1] + a[7] * b[2],
       a[2] * b[0] + a[5] * b[1] + a[8] * b[2],
       a[0] * b[3] + a[3] * b[4] + a[6] * b[5],
       a[1] * b[3] + a[4] * b[4] + a[7] * b[5],
       a[2] * b[3] + a[5] * b[4] + a[8] * b[5],
       a[0] * b[6] + a[3] * b[7] + a[6] * b[8],
       a[1] * b[6] + a[4] * b[7] + a[7] * b[8],
       a[2] * b[6] + a[5] * b[7] + a[8] * b[8],
    ];
  }

  static mulAll(matrixes) {
    console.log(matrixes);
    let currentMat = matrixes[0];
    for(let i = 1; i < matrixes.length; i++ ) {
      console.log(currentMat);
      currentMat = Mat3.mul(matrixes[i], currentMat);
    }
    return currentMat;
  }

  static rotate(rad) {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    return [
      cos, sin,  0.0,
      -sin, cos,  0.0,
      0.0,  0.0,  1.0
    ];
  }

  static translate(x, y) {
    return [
      1.0, 0.0, 0.0,
      0.0, 1.0, 0.0,
        x,   y, 1.0
    ];
  }

  static scale(x, y) {
    return [
        x, 0.0, 0.0,
      0.0,   y, 0.0,
      0.0, 0.0, 1.0
    ];
  }
}

class Mat1 {
  static mul(a, b) {
    return [
      a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
      a[3] * b[0] + a[4] * b[1] + a[5] * b[2],
      a[6] * b[0] + a[7] * b[1] + a[8] * b[2],
    ]
  }
}

class Sprite {
  constructor(x, y, width, height, image) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = image;

    this.mapping = [
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      0.0,  1.0,
      1.0,  0.0,
      1.0,  1.0
    ];

    this.rectangle = null;
    this.texture = null;
  }

  setRectangle() {
    const [x1, y1] = [this.x, this.y];
    const x2 = this.x + this.width;
    const y2 = this.y + this.height;

    this.rectangle = [
      x1, y1,
      x2, y1,
      x1, y2,
      x1, y2,
      x2, y1,
      x2, y2
    ];
  }

  initialize(gl) {
    this.setRectangle();
    this._texture = this.loadTexture(gl);
  }

  loadTexture(gl) {
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);

    // テクスチャパラメータの設定
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    this.texture = texture;
  }
}

class Camera {
  constructor(width, height) {
    this.matrix = [0, 0, 0, 0, 0, 0, 1, 1, 1];
    this.width = width;
    this.height = height;
  }

  setTransformMatrix(pos, deg, scale) {
    const rad = (deg / 180.0) * 2.0 * Math.PI;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const transformes = [
      // カメラを移動するとスプライトは逆向きに動くので反転
      Mat3.scale(-1.0, -1.0),
      // カメラの平行移動
      Mat3.translate(pos[0], pos[1]),
      // 回転中心をカメラ中心にする
      Mat3.translate(this.width / 2.0, this.height / 2.0),
      // カメラの回転
      Mat3.rotate(rad),
      // 中心座標を戻す
      Mat3.translate(-this.width / 2.0, -this.height / 2.0),
      // 反転を戻す
      Mat3.scale(-1.0, -1.0),
      // スケール変換
      Mat3.scale(scale[0], scale[1]),
      //クリップ座標系に変換
      Mat3.scale(2.0 / this.width, 2.0 / this.height),
      Mat3.translate(-1.0, -1.0),
      // Y軸のみ反転
      Mat3.scale(1.0, -1.0),
    ];

    this.matrix = new Float32Array(Mat3.mulAll(transformes));
  }
}

const canvas = document.getElementById("canvas");
let gl = null;
let texCoordLocation;
let positionAttributeLocation;
let textureLocation;
let matrixLocation;
let camera;

const sprites = [];

function initialize() {
  gl = canvas.getContext("webgl");

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);

  gl.useProgram(program);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  camera = new Camera(gl.canvas.width, gl.canvas.height);

  texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
  positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  textureLocation = gl.getUniformLocation(program, "u_image");
  matrixLocation = gl.getUniformLocation(program, "u_matrix");
}

function uploadVertex() {
  const targetSprite = sprites[0];

  /* --------------------------------------------------------------------------------- */
  /* positionBuffer に頂点データをセットする */
  const positionBuffer = gl.createBuffer();
  const vertexes = new Float32Array(sprites.map( sprite => sprite.rectangle ).flat());
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    vertexes,
    gl.STATIC_DRAW
  );

  /* --------------------------------------------------------------------------------- */
  /* テクスチャマッピング */
  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(sprites.map( sprite => sprite.mapping ).flat()),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

  /* --------------------------------------------------------------------------------- */
  const unit = 0;
  // どのテクスチャをアクティブにするか
  gl.activeTexture(gl.TEXTURE0 + unit);
  // どのテクスチャをつかうかをシェーダに教える
  gl.bindTexture(gl.TEXTURE_2D, targetSprite.texture);
  gl.uniform1i(textureLocation, unit);

  /* --------------------------------------------------------------------------------- */
  /* 属性(a_position)にバッファ(positionBuffer)の内容を流し込む */
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
}

function render(camera) {
  /* --------------------------------------------------------------------------------- */
  /* 描画の下準備 */
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  /* --------------------------------------------------------------------------------- */
  /* カメラの移動と回転と拡大縮小 */
  gl.uniformMatrix3fv(matrixLocation, false, camera.matrix);

  /* 頂点ベクトルの始点（0）から n つぶんの頂点を利用してプリミティブを描画 */
  gl.drawArrays(gl.TRIANGLES, 0, 6 * sprites.length);
}

function step() {
  render(camera);
  requestAnimationFrame(step);
}

const image = new Image();
image.src = "image.png";
image.onload = () => {
  initialize();

  const sprite = new Sprite(0, 0, 100, 100, image);
  sprite.initialize(gl);
  sprites.push(sprite);

  const sprite2 = new Sprite(0, 100, 50, 50, image);
  sprite2.initialize(gl);
  sprites.push(sprite2);

  camera.setTransformMatrix([-20.0, -20.0], 20.0, [1.0, 1.0]);

  uploadVertex();
  step();
};
