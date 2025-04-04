import type { Matrix4 } from '../math';
import { Vector3 } from '../math';
const vector = new Vector3()
export class Cylinder {
  c1: Vector3
  c2: Vector3
  direction: Vector3
  radius: number
  constructor(c1:Vector3 = new Vector3(), c2:Vector3 = new Vector3(), radius:number = 0) {
    this.c1 = c1;
    this.c2 = c2;
    this.radius = radius;
    this.direction = new Vector3()
      .subVectors(this.c2, this.c1)
      .normalize();
  }
  copy(cylinder:Cylinder):Cylinder {
    this.c1.copy(cylinder.c1);
    this.c2.copy(cylinder.c2);
    this.direction.copy(cylinder.direction);
    this.radius = cylinder.radius;
    return this;
  }
  lengthSq():number { 
    return vector.subVectors(this.c2, this.c1).lengthSq();
  }
  applyMatrix4(matrix:Matrix4):Cylinder {
    this.direction.add(this.c1).applyMatrix4(matrix);
    this.c1.applyMatrix4(matrix);
    this.c2.applyMatrix4(matrix);
    this.direction.sub(this.c1).normalize();
    this.radius = this.radius * matrix.getMaxScaleOnAxis();
    return this;
  }
}
