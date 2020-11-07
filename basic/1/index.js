const vertexShaderSource = `
  attribute vec4 a_position;

  void main() {
    gl_Position = a_position;
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  void main() {
    gl_FragColor = vec4(0, 0, 1, 1);
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

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl");

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

/* --------------------------------------------------------------------------------- */
/* positionBuffer に頂点データをセットする */

// WebGLBufferをつくる
const positionBuffer = gl.createBuffer();
// 頂点の属性を持つバッファ(ARRAY_BUFFER)とpositionBufferをつなぐ
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
// 頂点データ
const positions = [
  0, 0,
  0, 0.7,
  0.7, 0,
];

// ARRAY_BUFFER にデータを流し込む
// 手前のbindBufferで紐づけられたpositionBufferに流し込まれる
// bufferData(target, ArrayBuffer, usage)
// STATIC_DRAW はあまり更新される、書き込めるけど読み出せない
//
// こんな感じのデータが書き込まれる
// 0000 0000 0000 0000 0000 0000 3F33 3333 3F33 3333  0000 0000
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

/* --------------------------------------------------------------------------------- */
/* 描画の下準備 */

// ビューポート
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

// 背景のクリア
gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.useProgram(program);

/* --------------------------------------------------------------------------------- */
/* 属性(a_position)にバッファ(positionBuffer)の内容を流し込む */

// a_position 属性のロケーションを取得する
const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
// 属性をONにする（以降の処理でa_positionに値がセットされるようにする）
gl.enableVertexAttribArray(positionAttributeLocation);

// 頂点の属性を持つバッファ(ARRAY_BUFFER)とpositionBufferをつなぐ
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// 現在バインドされているバッファ（positionBuffer）の内容を頂点バッファ（a_position）に流し込む 
// vertexAttribPointer(index, size, type, normalized, stride, offset)
// size: シェーダ1回呼ぶ毎にセットする数値の数
// stride: 0ならすき間なくバッファに頂点情報が詰まっている状態
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

/* 頂点ベクトルの始点（0）から 3 つぶんの頂点を利用してプリミティブを描画 */
gl.drawArrays(gl.TRIANGLES, 0, 3);
