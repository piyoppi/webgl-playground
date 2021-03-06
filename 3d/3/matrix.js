export class Mat4 {
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

  static inverse(mat) {
    const a11 = mat[0];
    const a12 = mat[1];
    const a13 = mat[2];
    const a14 = mat[3];
    const a21 = mat[4];
    const a22 = mat[5];
    const a23 = mat[6];
    const a24 = mat[7];
    const a31 = mat[8];
    const a32 = mat[9];
    const a33 = mat[10];
    const a34 = mat[11];
    const a41 = mat[12];
    const a42 = mat[13];
    const a43 = mat[14];
    const a44 = mat[15];

    const det =
      a11 * a22 * a33 * a44
      + a11 * a23 * a34 * a42
      + a11 * a24 * a32 * a43
      - a11 * a24 * a33 * a42
      - a11 * a23 * a32 * a44
      - a11 * a22 * a34 * a43
      - a12 * a21 * a33 * a44
      - a13 * a21 * a34 * a42
      - a14 * a21 * a32 * a43
      + a14 * a21 * a33 * a42
      + a13 * a21 * a32 * a44
      + a12 * a21 * a34 * a43
      + a12 * a23 * a31 * a44
      + a13 * a24 * a31 * a42
      + a14 * a22 * a31 * a43
      - a14 * a23 * a31 * a42
      - a13 * a22 * a31 * a44
      - a12 * a24 * a31 * a43
      - a12 * a23 * a34 * a41
      - a13 * a24 * a32 * a41
      - a14 * a22 * a33 * a41
      + a14 * a23 * a32 * a41
      + a13 * a22 * a34 * a41
      + a12 * a24 * a33 * a41;

    return [
      (a22 * a33 * a44 + a23 * a34 * a42 + a24 * a32 * a43 - a24 * a33 * a42 - a23 * a32 * a44 - a22 * a34 * a43) / det,
      (-a12 * a33 * a44 - a13 * a34 * a42 - a14 * a32 * a43 + a14 * a33 * a42 + a13 * a32 * a44 + a12 * a34 * a43) / det,
      (a12 * a23 * a44 + a13 * a24 * a42 + a14 * a22 * a43 - a14 * a23 * a42 - a13 * a22 * a44 - a12 * a24 * a43) / det,
      (-a12 * a23 * a34 - a13 * a24 * a32 - a14 * a22 * a33 + a14 * a23 * a32 + a13 * a22 * a34 + a12 * a24 * a33) / det,
      (-a21 * a33 * a44 - a23 * a34 * a41 - a24 * a31 * a43 + a24 * a33 * a41 + a23 * a31 * a44 + a21 * a34 * a43) / det,
      (a11 * a33 * a44 + a13 * a34 * a41 + a14 * a31 * a43 - a14 * a33 * a41 - a13 * a31 * a44 - a11 * a34 * a43) / det,
      (-a11 * a23 * a44 - a13 * a24 * a41 - a14 * a21 * a43 + a14 * a23 * a41 + a13 * a21 * a44 + a11 * a24 * a43) / det,
      (a11 * a23 * a34 + a13 * a24 * a31 + a14 * a21 * a33 - a14 * a23 * a31 - a13 * a21 * a34 - a11 * a24 * a33) / det,
      (a21 * a32 * a44 + a22 * a34 * a41 + a24 * a31 * a42 - a24 * a32 * a41 - a22 * a31 * a44 - a21 * a34 * a42) / det,
      (-a11 * a32 * a44 - a12 * a34 * a41 - a14 * a31 * a42 + a14 * a32 * a41 + a12 * a31 * a44 + a11 * a34 * a42) / det,
      (a11 * a22 * a44 + a12 * a24 * a41 + a14 * a21 * a42 - a14 * a22 * a41 - a12 * a21 * a44 - a11 * a24 * a42) / det,
      (-a11 * a22 * a34 - a12 * a24 * a31 - a14 * a21 * a32 + a14 * a22 * a31 + a12 * a21 * a34 + a11 * a24 * a32) / det,
      (-a21 * a32 * a43 - a22 * a33 * a41 - a23 * a31 * a42 + a23 * a32 * a41 + a22 * a31 * a43 + a21 * a33 * a42) / det,
      (a11 * a32 * a43 + a12 * a33 * a41 + a13 * a31 * a42 - a13 * a32 * a41 - a12 * a31 * a43 - a11 * a33 * a42) / det,
      (-a11 * a22 * a43 - a12 * a23 * a41 - a13 * a21 * a42 + a13 * a22 * a41 + a12 * a21 * a43 + a11 * a23 * a42) / det,
      (a11 * a22 * a33 + a12 * a23 * a31 + a13 * a21 * a32 - a13 * a22 * a31 - a12 * a21 * a33 - a11 * a23 * a32) / det
    ];
  }

  static lookAt(targetPosition, cameraPosition) {
    const cameraZAxis = Vec3.normalize([
      cameraPosition[0] - targetPosition[0],
      cameraPosition[1] - targetPosition[1],
      cameraPosition[2] - targetPosition[2]
    ]);
    const cameraXAxis = Vec3.cross([0, 1, 0], cameraZAxis);
    const cameraYAxis = Vec3.cross(cameraZAxis, cameraXAxis);

    const lookAtMat = [
      ...cameraXAxis, 0,
      ...cameraYAxis, 0,
      ...cameraZAxis, 0,
      ...cameraPosition, 1
    ];

    return lookAtMat;
  }

  static perspective(fov, aspect, near, far) {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    const rangeInv = 1.0 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  }

  static perspective2(top, bottom, left, right, near, far) {
    return [
      (2 * near) / (right - left), 0, 0, 0,
      0, (2 * near) / (top - bottom), 0, 0,
      (right + left) / (right - left), (top + bottom) / (top - bottom), -(far + near) / (far - near), -1,
      0, 0, -(2 * far * near) / (far - near), 0
    ];
  }
}

export class Vec3 {
  static normalize(vec) {
    const len = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
    return len > 0.0001 ? [vec[0] / len, vec[1] / len, vec[2] / len] : [0, 0, 0];
  }

  static cross(a, b) {
    return [
      a[1] * b[2] - b[1] * a[2],
      a[2] * b[0] - b[2] * a[0],
      a[0] * b[1] - b[0] * a[1]
    ];
  }
}

export class Mat1 {
  static mul4(a, b) {
    return [
      a[ 0] * b[0] + a[ 1] * b[1] + a[ 2] * b[2] + a[ 3] * b[3],
      a[ 4] * b[0] + a[ 5] * b[1] + a[ 6] * b[2] + a[ 7] * b[3],
      a[ 8] * b[0] + a[ 9] * b[1] + a[10] * b[2] + a[11] * b[3],
      a[12] * b[0] + a[13] * b[1] + a[14] * b[2] + a[15] * b[3],
    ];
  }
}
