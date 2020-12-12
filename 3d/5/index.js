import {Cube} from './primitive.js';
import {deg2rad} from './mathHelper.js';
import {Camera} from './camera.js';
import {Vec3} from './matrix.js';

const vertexShaderSource = `
  attribute vec4 a_position;
  attribute vec4 a_color;
  attribute vec3 a_normal;

  uniform vec3 u_light;
  uniform vec3 u_view_position;
  uniform mat4 u_camera_matrix;
  uniform mat4 u_matrix;

  varying vec4 v_color;
  varying vec3 v_normal;
  varying vec3 v_surfaceToLight;
  varying vec3 v_surfaceToView;

  void main() {
    vec4 position = u_camera_matrix * u_matrix * a_position;
    gl_Position = position;

    v_color = a_color;
    v_normal = mat3(u_matrix) * a_normal;

    v_surfaceToLight = u_light - (u_matrix * a_position).xyz;
    v_surfaceToView = u_view_position - (u_matrix * a_position).xyz;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform float u_shininess;
  uniform float u_inner_limit;
  uniform float u_outer_limit;
  uniform vec3 v_light_direction;

  varying vec4 v_color;
  varying vec3 v_normal;
  varying vec3 v_surfaceToLight;
  varying vec3 v_surfaceToView;

  void main() {
    vec3 normal = normalize(v_normal);
    vec3 surfaceToLight = normalize(v_surfaceToLight);
    vec3 reflectionVec  = normalize(v_surfaceToLight + v_surfaceToView);
    float lightEfficience = dot(surfaceToLight, -v_light_direction);

    // x = u_inner_limit, y = 0
    // x = u_outer_limit, y = 1
    // 条件で直線の式（ y = ax + b ) に当てはめて解くと、 u_inner_limit ~ u_outer_limit 間に
    // ぼかしをかける係数を計算できる。
    float inLight = clamp((lightEfficience - u_inner_limit) / (u_outer_limit - u_inner_limit), 0.0, 1.0);

    float light = inLight * dot(normal, surfaceToLight);
    float specular = inLight * pow(dot(normal, reflectionVec), u_shininess);

    gl_FragColor = v_color;

    gl_FragColor.rgb *= light;
    gl_FragColor.rgb += specular;
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
let normalLocation;
let lightLocation;
let viewPositionLocation;
let shininessLocation;
let lightInnerLimitLocation;
let lightOuterLimitLocation;
let lightDirectionLocation;
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

  normalLocation = gl.getAttribLocation(program, "a_normal");
  vertexColorAttributeLocation = gl.getAttribLocation(program, "a_color");
  positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  cameraMatrixLocation = gl.getUniformLocation(program, "u_camera_matrix");
  matrixLocation = gl.getUniformLocation(program, "u_matrix");
  lightLocation = gl.getUniformLocation(program, "u_light");
  viewPositionLocation = gl.getUniformLocation(program, "u_view_position");
  shininessLocation = gl.getUniformLocation(program, "u_shininess");

  lightInnerLimitLocation = gl.getUniformLocation(program, "u_inner_limit");
  lightOuterLimitLocation = gl.getUniformLocation(program, "u_outer_limit");
  lightDirectionLocation = gl.getUniformLocation(program, "v_light_direction");
}

function uploadVertex() {
  const normalBuffer = gl.createBuffer();
  const normals = new Float32Array(primitives.map( primitive => primitive.normals ).flat());
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(normalLocation);
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

  const positionBuffer = gl.createBuffer();
  const vertexes = new Float32Array(primitives.map( primitive => primitive.vertexes ).flat());
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexes, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  const colorBuffer = gl.createBuffer();
  const colors = new Float32Array(primitives.map( primitive => primitive.vertexColors ).flat());
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(vertexColorAttributeLocation);
  gl.vertexAttribPointer(vertexColorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
}

function setLight(x, y, z) {
  gl.uniform3fv(lightLocation, new Float32Array([x, y, z]));
}

function setViewPosition(x, y, z) {
  gl.uniform3fv(viewPositionLocation, new Float32Array([x, y, z]));
}

function setShininess(shininess) {
  gl.uniform1f(shininessLocation, shininess);
}

function setSpotLight(direction, limitInner, limitOuter) {
  gl.uniform1f(lightInnerLimitLocation, limitInner);
  gl.uniform1f(lightOuterLimitLocation, limitOuter);
  gl.uniform3fv(lightDirectionLocation, new Float32Array(direction));
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
const rotateRadius = 300;

function step() {
  primitives.forEach(primitive => {
    primitive.clearTransform();
    primitive.setRotateZ(rotZ);
    primitive.calcTransformMatrix();
  });

  rotateAngle+=2;
  const rotateAngleRad = deg2rad(rotateAngle);

  cameraPosition[0] = 500;
  cameraPosition[1] = 500;
  cameraPosition[2] = 0;

  let targetPrimitive = primitives[0];
  camera.setLookAtMatrix(targetPrimitive.position, cameraPosition);

  render(camera);
  requestAnimationFrame(step);
}

initialize();

const cube = new Cube(0, 0, 0, 250, 50, 250);
primitives.push(cube);

camera.setTransformMatrix([0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [1.0, 1.0, 1.0]);
setShininess(30);
setLight(0, 100, 0);
setSpotLight(Vec3.normalize([0, -1, 0]), 0.5, 0.9);

uploadVertex();
step();
