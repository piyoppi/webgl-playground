const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  uniform vec2 u_resolution; 
  varying vec2 v_texCoord;
  uniform vec2 u_translation;
  uniform vec2 u_rotation;
  uniform vec2 u_scale;

  void main() {
    // ピクセル空間座標からクリップ空間座標に変換
    vec2 translatedPosition = (a_position + u_translation) * u_scale;
    vec2 rotatedPosition = mat2(u_rotation.x, -u_rotation.y, u_rotation.y, u_rotation.x) * translatedPosition;
    vec2 clipSpace = ((rotatedPosition / u_resolution) * 2.0) - 1.0;

    vec2 position = clipSpace * vec2(1, -1);
    gl_Position = vec4(position, 0, 1);

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
  constructor() {
    this.position = [0, 0];
    this.rotation = [0, 1];
    this.scale = [1, 1];
  }

  setRotation(deg) {
    const rad = (deg / 180.0) * 2.0 * Math.PI
    this.rotation[0] = Math.cos(rad);
    this.rotation[1] = Math.sin(rad);
  }
}

let canvas = null;
let gl = null;
let texCoordLocation;
let positionAttributeLocation;
let textureLocation;
let resolutionUniformLocation;
let translationLocation;
let rotationLocation;
let scaleLocation;

const sprites = [];
const camera = new Camera();

function initialize() {
  canvas = document.getElementById("canvas");
  gl = canvas.getContext("webgl");

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);

  gl.useProgram(program);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
  positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  textureLocation = gl.getUniformLocation(program, "u_image");
  resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
  translationLocation = gl.getUniformLocation(program, "u_translation");
  rotationLocation = gl.getUniformLocation(program, "u_rotation");
  scaleLocation = gl.getUniformLocation(program, "u_scale");

  // キャンバスサイズの設定
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
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

function render(cameraPosition, cameraRotation, cameraScale) {
  /* --------------------------------------------------------------------------------- */
  /* 描画の下準備 */
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  /* --------------------------------------------------------------------------------- */
  /* カメラの移動と回転と拡大縮小 */
  gl.uniform2fv(translationLocation, cameraPosition);
  gl.uniform2fv(rotationLocation, cameraRotation);
  gl.uniform2fv(scaleLocation, cameraScale);

  /* 頂点ベクトルの始点（0）から n つぶんの頂点を利用してプリミティブを描画 */
  gl.drawArrays(gl.TRIANGLES, 0, 6 * sprites.length);
}

function step() {
  render(camera.position, camera.rotation, camera.scale);
  requestAnimationFrame(step);
}

const image = new Image();
image.src = "image.png";
image.onload = () => {
  initialize();

  const sprite = new Sprite(50, 50, 100, 100, image);
  sprite.initialize(gl);
  sprites.push(sprite);

  const sprite2 = new Sprite(100, 200, 50, 50, image);
  sprite2.initialize(gl);
  sprites.push(sprite2);

  camera.setRotation(10);
  camera.scale = [1.5, 1.5];
  uploadVertex();
  step();
};
