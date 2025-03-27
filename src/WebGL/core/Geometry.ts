import type { Material } from './../materials/Material';
import { LineBasicMaterial } from '../materials/LineBasicMaterial';
import { EventDispatcher } from "./EventDispatcher";
import { Vector3 } from "../math";
import { CC, Color } from "../../colors";
import { AtomSpec } from 'specs';
const BUFFERSIZE = 65535; 
export class GeometryGroup {
  id: number;
  vertexArray: Float32Array | null = null;
  colorArray: Float32Array | null = null;
  normalArray: Float32Array | null = null;
  radiusArray: Float32Array | null = null;
  faceArray: Uint16Array | null = null;
  lineArray: Uint16Array | null = null;
  atomArray: Array<AtomSpec> = Array<AtomSpec>();
  vertices: number = 0;
  faceidx: number = 0;
  lineidx: number = 0;
  __inittedArrays = false;
  useOffset: unknown;
  constructor(id = 0) {
    this.id = id;
  }
  public setColor(color: Color | number): void {
    const v = this.vertexArray;
    const c = this.colorArray;
    if (!v) throw new Error("vertex array not initialized");
    if (!c) throw new Error("color array not initialized");
    const col = CC.color(color);
    for (let i = 0; i < v.length; i += 3) {
      c[i] = col.r;
      c[i + 1] = col.g;
      c[i + 2] = col.b;
    }
  }
  setColors(setcolor: (x: number, y: number, z: number) => Color | number): void {
    const v = this.vertexArray;
    const c = this.colorArray;
    if (!v) throw new Error("vertex array not initialized");
    if (!c) throw new Error("color array not initialized");
    if (v.length != c.length) {
      console.log("Cannot re-color geometry group due to mismatched lengths.");
      return;
    }
    for (let i = 0; i < v.length; i += 3) {
      let col = setcolor(v[i], v[i + 1], v[i + 2]);
      if (!(col instanceof Color)) {
        col = CC.color(col);
      }
      c[i] = col.r;
      c[i + 1] = col.g;
      c[i + 2] = col.b;
    }
  }
  getNumVertices(): number {
    return this.vertices;
  }
  getVertices() {
    return this.vertexArray;
  }
  getCentroid() {
    if (!this.vertexArray) throw new Error("vertex array not initialized");
    const centroid = new Vector3();
    let offset: number, x: number, y: number, z: number;
    for (let i = 0; i < this.vertices; ++i) {
      offset = i * 3;
      x = this.vertexArray[offset];
      y = this.vertexArray[offset + 1];
      z = this.vertexArray[offset + 2];
      centroid.x += x;
      centroid.y += y;
      centroid.z += z;
    }
    centroid.divideScalar(this.vertices);
    return centroid;
  }
  setNormals(): void {
    const faces = this.faceArray;
    const verts = this.vertexArray;
    const norms = this.normalArray;
    if (!this.vertices || !this.faceidx) return;
    if (!faces) throw new Error("face array not initialized");
    if (!verts) throw new Error("vertex array not initialized");
    if (!norms) throw new Error("normal array not initialized");
    let a: number,
      b: number,
      c: number,
      vA: Vector3,
      vB: Vector3,
      vC: Vector3,
      norm: { normalize: () => void; x: number; y: number; z: number; };
    for (let i = 0; i < faces.length / 3; ++i) {
      a = faces[i * 3] * 3;
      b = faces[i * 3 + 1] * 3;
      c = faces[i * 3 + 2] * 3;
      vA = new Vector3(verts[a], verts[a + 1], verts[a + 2]);
      vB = new Vector3(verts[b], verts[b + 1], verts[b + 2]);
      vC = new Vector3(verts[c], verts[c + 1], verts[c + 2]);
      vA.subVectors(vA, vB);
      vC.subVectors(vC, vB);
      vC.cross(vA);
      norm = vC;
      norm.normalize();
      norms[a] += norm.x;
      norms[b] += norm.x;
      norms[c] += norm.x;
      norms[a + 1] += norm.y;
      norms[b + 1] += norm.y;
      norms[c + 1] += norm.y;
      norms[a + 2] += norm.z;
      norms[b + 2] += norm.z;
      norms[c + 2] += norm.z;
    }
  }
  setLineIndices() {
    if (!this.faceidx) return;
    if (
      this.lineArray &&
      this.lineArray.length == this.faceidx * 2 &&
      this.lineidx == this.faceidx * 2
    )
      return; 
    const faceArr = this.faceArray,
      lineArr = (this.lineArray = new Uint16Array(this.faceidx * 2));
    this.lineidx = this.faceidx * 2;
    if (!faceArr) throw new Error("face array not initialized");
    for (let i = 0; i < this.faceidx / 3; ++i) {
      const faceoffset = i * 3;
      const lineoffset = faceoffset * 2;
      const a = faceArr[faceoffset],
        b = faceArr[faceoffset + 1],
        c = faceArr[faceoffset + 2];
      lineArr[lineoffset] = a;
      lineArr[lineoffset + 1] = b;
      lineArr[lineoffset + 2] = a;
      lineArr[lineoffset + 3] = c;
      lineArr[lineoffset + 4] = b;
      lineArr[lineoffset + 5] = c;
    }
  }
  vrml(indent: string, material?: Material) {
    let ret = "";
    ret +=
      indent +
      "Shape {\n" +
      indent +
      " appearance Appearance {\n" +
      indent +
      "  material Material {\n" +
      indent +
      "   diffuseColor " +
      material?.color?.r +
      " " +
      material?.color?.g +
      " " +
      material?.color?.b +
      "\n";
    if (material.wireframe && this.colorArray) {
      const c = this.colorArray;
      ret += indent + "    emissiveColor " + c[0] + " " + c[1] + " " + c[2] + "\n";
    }
    if (material?.transparent) {
      ret += indent + "   transparency " + (1.0 - material.opacity) + "\n";
    }
    ret += indent + "  }\n"; 
    ret += indent + " }\n"; 
    const oldindent = indent;
    indent += " "; 
    if (material instanceof LineBasicMaterial || material.wireframe) {
      ret +=
        indent +
        "geometry IndexedLineSet {\n" +
        indent +
        " colorPerVertex TRUE\n" +
        indent +
        " coord Coordinate {\n" +
        indent +
        "  point [\n";
      let x: string | number, y: string | number, z: string | number;
      for (let i = 0; i < this.vertices; ++i) {
        const offset = i * 3;
        x = this.vertexArray?.[offset];
        y = this.vertexArray?.[offset + 1];
        z = this.vertexArray?.[offset + 2];
        ret += indent + "   " + x + " " + y + " " + z + ",\n";
      }
      ret += indent + "  ]\n";
      ret += indent + " }\n"; 
      if (this.colorArray && !material.wireframe) {
        ret += indent + " color Color {\n" + indent + "  color [\n";
        for (let i = 0; i < this.vertices; ++i) {
          const offset = i * 3;
          x = this.colorArray[offset];
          y = this.colorArray[offset + 1];
          z = this.colorArray[offset + 2];
          ret += indent + "   " + x + " " + y + " " + z + ",\n";
        }
        ret += indent + "  ]\n";
        ret += indent + " }\n"; 
      }
      ret += indent + " coordIndex [\n";
      if(material.wireframe && this.faceArray) {
        for (let i = 0; i < this.faceidx; i += 3) {
          x = this.faceArray?.[i];
          y = this.faceArray?.[i + 1];
          z = this.faceArray?.[i + 2];
          ret += indent + "  " + x + ", " + y + ", " + z + ", -1,\n";
        }
      }  else {
        for (let i = 0; i < this.vertices-1; i += 2) {
          ret += indent + "  " + i + ", " + (i + 1) + ", -1,\n";
        }
      }
      ret += indent + " ]\n";
      ret += indent + "}\n"; 
    } else {
      ret +=
        indent +
        "geometry IndexedFaceSet {\n" +
        indent +
        " colorPerVertex TRUE\n" +
        indent +
        " normalPerVertex TRUE\n" +
        indent +
        " solid FALSE\n";
      ret += indent + " coord Coordinate {\n" + indent + "  point [\n";
      let x: string | number, y: string | number, z: string | number;
      for (let i = 0; i < this.vertices; ++i) {
        const offset = i * 3;
        x = this.vertexArray?.[offset];
        y = this.vertexArray?.[offset + 1];
        z = this.vertexArray?.[offset + 2];
        ret += indent + "   " + x + " " + y + " " + z + ",\n";
      }
      ret += indent + "  ]\n";
      ret += indent + " }\n"; 
      ret += indent + " normal Normal {\n" + indent + "  vector [\n";
      for (let i = 0; i < this.vertices; ++i) {
        const offset = i * 3;
        x = this.normalArray?.[offset];
        y = this.normalArray?.[offset + 1];
        z = this.normalArray?.[offset + 2];
        ret += indent + "   " + x + " " + y + " " + z + ",\n";
      }
      ret += indent + "  ]\n";
      ret += indent + " }\n"; 
      if (this.colorArray) {
        ret += indent + " color Color {\n" + indent + "  color [\n";
        for (let i = 0; i < this.vertices; ++i) {
          const offset = i * 3;
          x = this.colorArray[offset];
          y = this.colorArray[offset + 1];
          z = this.colorArray[offset + 2];
          ret += indent + "   " + x + " " + y + " " + z + ",\n";
        }
        ret += indent + "  ]\n";
        ret += indent + " }\n"; 
      }
      ret += indent + " coordIndex [\n";
      for (let i = 0; i < this.faceidx; i += 3) {
        x = this.faceArray?.[i];
        y = this.faceArray?.[i + 1];
        z = this.faceArray?.[i + 2];
        ret += indent + "  " + x + ", " + y + ", " + z + ", -1,\n";
      }
      ret += indent + " ]\n"; 
      ret += indent + "}\n"; 
    }
    ret += oldindent + "}"; 
    return ret;
  }
  truncateArrayBuffers(mesh = true, reallocatemem = false) {
    const vertexArr = this.vertexArray,
      colorArr = this.colorArray,
      normalArr = this.normalArray,
      faceArr = this.faceArray,
      lineArr = this.lineArray,
      radiusArr = this.radiusArray;
    this.vertexArray = vertexArr?.subarray(0, this.vertices * 3) || null;
    this.colorArray = colorArr?.subarray(0, this.vertices * 3) || null;
    if (mesh) {
      this.normalArray = normalArr?.subarray(0, this.vertices * 3) || null;
      this.faceArray = faceArr?.subarray(0, this.faceidx) || null;
      if (this.lineidx > 0)
        this.lineArray = lineArr?.subarray(0, this.lineidx) || null;
      else this.lineArray = new Uint16Array(0);
    } else {
      this.normalArray = new Float32Array(0);
      this.faceArray = new Uint16Array(0);
      this.lineArray = new Uint16Array(0);
    }
    if (radiusArr) {
      this.radiusArray = radiusArr.subarray(0, this.vertices);
    }
    if (reallocatemem) {
      if (this.normalArray)
        this.normalArray = new Float32Array(this.normalArray);
      if (this.faceArray) this.faceArray = new Uint16Array(this.faceArray);
      if (this.lineArray) this.lineArray = new Uint16Array(this.lineArray);
      if (this.vertexArray)
        this.vertexArray = new Float32Array(this.vertexArray);
      if (this.colorArray) this.colorArray = new Float32Array(this.colorArray);
      if (this.radiusArray)
        this.radiusArray = new Float32Array(this.radiusArray);
    }
    this.__inittedArrays = true;
  }
}
export class Geometry extends EventDispatcher {
  id: number;
  name: string = "";
  hasTangents: boolean =  false;
  dynamic: boolean = true; 
  radii: boolean;
  mesh: boolean;
  offset: boolean;
  verticesNeedUpdate: boolean = false;
  elementsNeedUpdate: boolean = false;
  normalsNeedUpdate: boolean = false;
  colorsNeedUpdate: boolean = false;
  buffersNeedUpdate: boolean = false;
  imposter: boolean = false;
  instanced: boolean = false;
  geometryGroups: GeometryGroup[] = [];
  groups: number = 0;
  sphereGeometry?: Geometry;
  drawnCaps?: any;
  constructor(mesh = false, radii = false, offset = false) {
    super();
    this.id = GeometryIDCount++;
    this.mesh = mesh; 
    this.radii = radii;
    this.offset = offset; 
  }
  updateGeoGroup(addVertices = 0): GeometryGroup {
    let retGroup =
      this.groups > 0 ? this.geometryGroups[this.groups - 1] : null;
    if (
      !retGroup ||
      retGroup.vertices + addVertices > (retGroup?.vertexArray?.length || 0) / 3
    )
      retGroup = this.addGeoGroup();
    return retGroup;
  }
  vrml(indent: string, material?: Material): string {
    let ret = "";
    const len = this.geometryGroups.length;
    for (let g = 0; g < len; g++) {
      const geoGroup = this.geometryGroups[g];
      ret += geoGroup.vrml(indent, material) + ",\n";
    }
    return ret;
  }
  addGeoGroup() {
    const ret = new GeometryGroup(this.geometryGroups.length);
    this.geometryGroups.push(ret);
    this.groups = this.geometryGroups.length;
    ret.vertexArray = new Float32Array(BUFFERSIZE * 3);
    ret.colorArray = new Float32Array(BUFFERSIZE * 3);
    if (this.mesh) {
      ret.normalArray = new Float32Array(BUFFERSIZE * 3);
      ret.faceArray = new Uint16Array(BUFFERSIZE * 6);
      ret.lineArray = new Uint16Array(BUFFERSIZE * 6);
    }
    if (this.radii) {
      ret.radiusArray = new Float32Array(BUFFERSIZE);
    }
    ret.useOffset = this.offset;
    return ret;
  }
  setUpNormals(...args: Parameters<GeometryGroup["setNormals"]>) {
    for (let g = 0; g < this.groups; g++) {
      const geoGroup = this.geometryGroups[g];
      geoGroup.setNormals(...args);
    }
  }
  setColors(...setcolor: Parameters<GeometryGroup["setColors"]>): void {
    const len = this.geometryGroups.length;
    for (let g = 0; g < len; g++) {
      const geoGroup = this.geometryGroups[g];
      geoGroup.setColors(...setcolor);
    }
  }
  setColor(...setcolor: Parameters<GeometryGroup["setColor"]>): void {
    const len = this.geometryGroups.length;
    for (let g = 0; g < len; g++) {
      const geoGroup = this.geometryGroups[g];
      geoGroup.setColor(...setcolor);
    }
  }
  setUpWireframe(...lineIndexArgs: Parameters<GeometryGroup["setLineIndices"]>) {
    for (let g = 0; g < this.groups; g++) {
      const geoGroup = this.geometryGroups[g];
      geoGroup.setLineIndices(...lineIndexArgs);
    }
  }
  initTypedArrays() {
    for (let g = 0; g < this.groups; g++) {
      const group = this.geometryGroups[g];
      if (group.__inittedArrays === true) continue;
      group.truncateArrayBuffers(this.mesh, false);
    }
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
  get vertices (): number {
    let vertices = 0;
    for (let g = 0; g < this.groups; g++)
      vertices += this.geometryGroups[g].vertices;
    return vertices;
  }
}
export let GeometryIDCount = 0;
