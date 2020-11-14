const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  uniform vec2 u_resolution; 
  varying vec2 v_texCoord;

  void main() {
    // ピクセル空間座標からクリップ空間座標に変換
    vec2 clipSpace = ((a_position / u_resolution) * 2.0) - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

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

const sprites = [];

let canvas = null;
let gl = null;
let program = null;

function initialize() {
  canvas = document.getElementById("canvas");
  gl = canvas.getContext("webgl");

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  program = createProgram(gl, vertexShader, fragmentShader);

  gl.useProgram(program);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function addSprite(image) {
  const sprite = new Sprite(0, 0, 100, 100, image);
  sprite.initialize(gl);
  sprites.push(sprite);
}

class Sprite {
  constructor(x, y, width, height, image) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = image;

    this.mapping = new Float32Array([
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      0.0,  1.0,
      1.0,  0.0,
      1.0,  1.0
    ]);

    this.rectangle = null;
    this.texture = null;
  }

  setRectangle() {
    const [x1, y1] = [this.x, this.y];
    const x2 = this.x + this.width;
    const y2 = this.y + this.height;

    this.rectangle = new Float32Array([
      x1, y1,
      x2, y1,
      x1, y2,
      x1, y2,
      x2, y1,
      x2, y2
    ]);
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

function render() {

  const targetSprite = sprites[0];

  /* --------------------------------------------------------------------------------- */
  /* positionBuffer に頂点データをセットする */
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, targetSprite.rectangle, gl.STATIC_DRAW);

  /* --------------------------------------------------------------------------------- */
  /* テクスチャマッピング */
  const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, targetSprite.mapping, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

  /* --------------------------------------------------------------------------------- */
  /* 描画の下準備 */

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  /* --------------------------------------------------------------------------------- */

  const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

  const textureLocation = gl.getUniformLocation(program, "u_image");

  const unit = 0;
  // どのテクスチャをアクティブにするか
  gl.activeTexture(gl.TEXTURE0 + unit);
  // どのテクスチャをつかうかをシェーダに教える
  gl.bindTexture(gl.TEXTURE_2D, targetSprite.texture);
  gl.uniform1i(textureLocation, unit);

  /* --------------------------------------------------------------------------------- */
  /* 属性(a_position)にバッファ(positionBuffer)の内容を流し込む */

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  /* 頂点ベクトルの始点（0）から 6 つぶんの頂点を利用してプリミティブを描画 */
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function step() {
  render();
  const targetSprite = sprites[0];
  targetSprite.x += 1;
  targetSprite.setRectangle();
  if( targetSprite.x > 500 ) targetSprite.x = 0;
  requestAnimationFrame(step);
}

const image = new Image();
image.src = "image.png";
image.onload = () => {
  initialize();
  addSprite(image);
  step();
};
