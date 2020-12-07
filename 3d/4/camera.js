import {deg2rad} from './mathHelper.js';
import {Mat4, Vec3} from './matrix.js';

export class Camera {
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

  setLookAtMatrix(target, pos) {
    const transformes = [
      Mat4.inverse(Mat4.lookAt(target, pos)),
      Mat4.perspective(deg2rad(50), this.width / this.height, 1, 2000)
    ];

    this.matrix = new Float32Array(Mat4.mulAll(transformes));
  }
}

