import {Cube} from './primitive.js';
import {deg2rad} from './mathHelper.js';
import {Camera} from './camera.js';

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
let cameraWorkStep = 0;
let cameraPosition = [0, 0, 0];
let cameraRotateZ = 0;
let rotateAngle = 0;
const rotateRadius = 500;

function step() {
  primitives.forEach(primitive => {
    primitive.clearTransform();
    primitive.setRotateZ(rotZ++);
    primitive.calcTransformMatrix();
  });

  rotateAngle+=0.5;
  const rotateAngleRad = deg2rad(rotateAngle);
  cameraRotateZ = rotateAngle + 90;
  cameraPosition[0] = rotateRadius * Math.cos(rotateAngleRad);
  cameraPosition[2] = -rotateRadius * Math.sin(rotateAngleRad);
  cameraPosition[1] = 300;

  cameraPosition[0] = 500;
  cameraPosition[1] = 500;
  cameraPosition[2] = 0;

  cameraWorkStep += 0.01;

  if(cameraWorkStep > 4.0) {
    cameraWorkStep = 0;
  }

  let targetPrimitive = primitives[Math.floor(cameraWorkStep)];
  //camera.setTransformMatrix(cameraPosition, [0.0, cameraRotateZ, 0.0], [1.0, 1.0, 1.0]);
  camera.setLookAtMatrix(targetPrimitive.position, cameraPosition);

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
