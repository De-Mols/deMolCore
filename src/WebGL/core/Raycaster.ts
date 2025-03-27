import type { Camera } from '../Camera';
import { Ray, Matrix4, Vector3 } from "../math";
import { Sphere, Cylinder, Triangle } from "../shapes";
const descSort = (a: { distance: number; }, b: { distance: number; }) => {
  return a.distance - b.distance;
};
const viewProjectionMatrix = new Matrix4();
export class Raycaster {
  ray: Ray;
  near: number;
  far: number;
  precision = 0.0001;
  linePrecision = 0.2;
  constructor(origin: Vector3 | undefined, direction: Vector3 | undefined, far?: number, near?: number) {
    this.ray = new Ray(origin, direction);
    if (this.ray.direction.lengthSq() > 0) this.ray.direction.normalize();
    this.near = near || 0;
    this.far = far || Infinity;
  }
  set(origin: Vector3, direction: Vector3): void {
    this.ray.set(origin, direction);
  }
  setFromCamera(coords: { x: any; y: any; z: any; }, camera: Camera): void {
    if (!camera.ortho) {
      this.ray.origin.setFromMatrixPosition(camera.matrixWorld);
      this.ray.direction.set(coords.x, coords.y, coords.z);
      camera.projectionMatrixInverse.getInverse(camera.projectionMatrix);
      viewProjectionMatrix.multiplyMatrices(
        camera.matrixWorld,
        camera.projectionMatrixInverse
      );
      this.ray.direction.applyProjection(viewProjectionMatrix);
      this.ray.direction.sub(this.ray.origin).normalize();
    } else {
      this.ray.origin
        .set(
          coords.x,
          coords.y,
          (camera.near + camera.far) / (camera.near - camera.far)
        )
        .unproject(camera);
      this.ray.direction.set(0, 0, -1).transformDirection(camera.matrixWorld);
    }
  }
  intersectObjects(group: any, objects: string | any[]) {
    const intersects: any[] = [];
    for (let i = 0, l = objects.length; i < l; i++)
      intersectObject(group, objects[i], this, intersects);
    intersects.sort(descSort);
    return intersects;
  }
}
const clamp = (x: number): number => {
  return Math.min(Math.max(x, -1), 1);
};
const sphere = new Sphere();
const cylinder = new Cylinder();
const triangle = new Triangle();
const w_0 = new Vector3(); 
const v1 = new Vector3(); 
const v2 = new Vector3();
const v3 = new Vector3();
const matrixPosition = new Vector3();
export function intersectObject(group: { matrixWorld: Matrix4; }, clickable: { intersectionShape: any; boundingSphere: Sphere | undefined; }, raycaster: Raycaster, intersects: any[]) {
  matrixPosition.getPositionFromMatrix(group.matrixWorld);
  if (clickable.intersectionShape === undefined) return intersects;
  const intersectionShape = clickable.intersectionShape;
  let precision = raycaster.linePrecision;
  precision *= group.matrixWorld.getMaxScaleOnAxis();
  const precisionSq = precision * precision;
  if (
    clickable.boundingSphere !== undefined &&
    clickable.boundingSphere instanceof Sphere
  ) {
    sphere.copy(clickable.boundingSphere);
    sphere.applyMatrix4(group.matrixWorld);
    if (!raycaster.ray.isIntersectionSphere(sphere)) {
      return intersects;
    }
  }
  let i: number,
    il: number,
    norm: Vector3,
    normProj: number,
    cylProj: number,
    rayProj: number,
    distance: number,
    closestDistSq: number,
    denom: number,
    discriminant: number,
    s: number,
    t: number,
    s_c: number,
    t_c: number;
  for (i = 0, il = intersectionShape.triangle.length; i < il; i++) {
    if (intersectionShape.triangle[i] instanceof Triangle) {
      triangle.copy(intersectionShape.triangle[i]);
      triangle.applyMatrix4(group.matrixWorld);
      norm = triangle.getNormal();
      normProj = raycaster.ray.direction.dot(norm);
      if (normProj >= 0) continue;
      w_0.subVectors(triangle.a, raycaster.ray.origin);
      distance = norm.dot(w_0) / normProj;
      if (distance < 0) continue;
      v1.copy(raycaster.ray.direction)
        .multiplyScalar(distance)
        .add(raycaster.ray.origin);
      v1.sub(triangle.a); 
      v2.copy(triangle.b).sub(triangle.a); 
      v3.copy(triangle.c).sub(triangle.a); 
      const b_dot_c = v2.dot(v3);
      const b_sq = v2.lengthSq();
      const c_sq = v3.lengthSq();
      t =
        (b_sq * v1.dot(v3) - b_dot_c * v1.dot(v2)) /
        (b_sq * c_sq - b_dot_c * b_dot_c);
      if (t < 0 || t > 1) continue;
      s = (v1.dot(v2) - t * b_dot_c) / b_sq;
      if (s < 0 || s > 1 || s + t > 1) continue;
      else {
        intersects.push({ clickable: clickable, distance: distance });
      }
    }
  }
  for (i = 0, il = intersectionShape.cylinder.length; i < il; i++) {
    if (intersectionShape.cylinder[i] instanceof Cylinder) {
      cylinder.copy(intersectionShape.cylinder[i]);
      cylinder.applyMatrix4(group.matrixWorld);
      w_0.subVectors(cylinder.c1, raycaster.ray.origin);
      cylProj = w_0.dot(cylinder.direction); 
      rayProj = w_0.dot(raycaster.ray.direction); 
      normProj = clamp(raycaster.ray.direction.dot(cylinder.direction)); 
      denom = 1 - normProj * normProj;
      if (denom === 0.0) continue;
      s_c = (normProj * rayProj - cylProj) / denom;
      t_c = (rayProj - normProj * cylProj) / denom;
      v1.copy(cylinder.direction).multiplyScalar(s_c).add(cylinder.c1); 
      v2.copy(raycaster.ray.direction)
        .multiplyScalar(t_c)
        .add(raycaster.ray.origin); 
      closestDistSq = v3.subVectors(v1, v2).lengthSq();
      const radiusSq = cylinder.radius * cylinder.radius;
      if (closestDistSq <= radiusSq) {
        discriminant =
          (normProj * cylProj - rayProj) * (normProj * cylProj - rayProj) -
          denom * (w_0.lengthSq() - cylProj * cylProj - radiusSq);
        if (discriminant <= 0) t = distance = Math.sqrt(closestDistSq);
        else
          t = distance =
            (rayProj - normProj * cylProj - Math.sqrt(discriminant)) / denom;
        s = normProj * t - cylProj;
        if (s < 0 || s * s > cylinder.lengthSq() || t < 0) continue;
        else intersects.push({ clickable: clickable, distance: distance });
      }
    }
  }
  for (i = 0, il = intersectionShape.line.length; i < il; i += 2) {
    v1.copy(intersectionShape.line[i]);
    v1.applyMatrix4(group.matrixWorld);
    v2.copy(intersectionShape.line[i + 1]);
    v2.applyMatrix4(group.matrixWorld);
    v3.subVectors(v2, v1);
    const connectionLengthSq = v3.lengthSq();
    v3.normalize();
    w_0.subVectors(v1, raycaster.ray.origin);
    const lineProj = w_0.dot(v3);
    rayProj = w_0.dot(raycaster.ray.direction);
    normProj = clamp(raycaster.ray.direction.dot(v3));
    denom = 1 - normProj * normProj;
    if (denom === 0.0) continue;
    s_c = (normProj * rayProj - lineProj) / denom;
    t_c = (rayProj - normProj * lineProj) / denom;
    v1.add(v3.multiplyScalar(s_c)); 
    v2.copy(raycaster.ray.direction)
      .multiplyScalar(t_c)
      .add(raycaster.ray.origin); 
    closestDistSq = v3.subVectors(v2, v1).lengthSq();
    if (closestDistSq < precisionSq && s_c * s_c < connectionLengthSq)
      intersects.push({ clickable: clickable, distance: t_c });
  }
  for (i = 0, il = intersectionShape.sphere.length; i < il; i++) {
    if (intersectionShape.sphere[i] instanceof Sphere) {
      sphere.copy(intersectionShape.sphere[i]);
      sphere.applyMatrix4(group.matrixWorld);
      if (raycaster.ray.isIntersectionSphere(sphere)) {
        v1.subVectors(sphere.center, raycaster.ray.origin);
        const distanceToCenter = v1.dot(raycaster.ray.direction);
        discriminant =
          distanceToCenter * distanceToCenter -
          (v1.lengthSq() - sphere.radius * sphere.radius);
        if (distanceToCenter < 0) return intersects;
        if (discriminant <= 0) distance = distanceToCenter;
        else distance = distanceToCenter - Math.sqrt(discriminant);
        intersects.push({ clickable: clickable, distance: distance });
      }
    }
  }
  return intersects;
}
