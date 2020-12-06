import {Mat4, Vec3} from './matrix.js';
import {deg2rad} from './mathHelper.js';

export class Plane {
  constructor(x, y, z, width, height) {
    this.position = [x, y, z];
    this.width = width;
    this.height = height;
    this.vertexes = [];
    this.setXYPlaneVertexes();
  }

  setXYPlaneVertexes() {
    this.vertexes = Plane.xyPlaneVertexes(this.position[0], this.position[1], this.position[2], this.width, this.height);
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

export class Cube {
  constructor(x, y, z, width, height, depth) {
    this.position = [x, y, z];
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
      Mat4.translate(-this.position[0], -this.position[1], 0),
      Mat4.rotateZ(deg2rad(deg)),
      Mat4.translate(this.position[0], this.position[1], 0),
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
      ...Plane.xyPlaneVertexes(this.position[0] - center[0], this.position[1] - center[1], this.position[2] - center[2], this.width, this.height, true),
      ...Plane.zyPlaneVertexes(this.position[0] + center[0], this.position[1] - center[1], this.position[2] - center[2], this.height, this.depth, true),
      ...Plane.xyPlaneVertexes(this.position[0] - center[0], this.position[1] - center[1], this.position[2] + center[2], this.width, this.height, false),
      ...Plane.zyPlaneVertexes(this.position[0] - center[0], this.position[1] - center[1], this.position[2] - center[2], this.height, this.depth, false),
      ...Plane.xzPlaneVertexes(this.position[0] - center[0], this.position[1] + center[1], this.position[2] - center[2], this.width, this.depth, true),
      ...Plane.xzPlaneVertexes(this.position[0] - center[0], this.position[1] - center[1], this.position[2] - center[2], this.width, this.depth, false),
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
