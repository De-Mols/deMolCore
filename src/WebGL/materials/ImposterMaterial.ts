import { Coloring } from "./../constants/Coloring";
import { Shading } from "./../constants/Shading";
import { Color } from "../../colors";
import { Vector3 } from "../math";
import { Material } from "./Material";
export class ImposterMaterial extends Material {
  combine: any;
  morphTargets: any;
  morphNormals: any;
  color = new Color(0xffffff);
  ambient = new Color(0xfffff);
  emissive = new Color(0x000000);
  imposter = true;
  wrapAround = false;
  wrapRGB = new Vector3(1, 1, 1);
  map = undefined;
  lightMap = null;
  specularMap = null;
  envMap = null;
  reflectivity = 1;
  refractionRatio = 0.98;
  fog = true;
  wireframe = false;
  wireframeLinewidth = 1;
  wireframeLinecap = "round";
  wireframeLinejoin = "round";
  shading = Shading.SmoothShading;
  shaderID = null as string | null;
  vertexColors = Coloring.NoColors;
  skinning = false;
  constructor(parameters?: any) {
    super();
    this.setValues(parameters);
  }
  clone<T extends this>(material: T = new ImposterMaterial() as T): T {
    super.clone.call(this, material);
    material.color.copy(this.color);
    material.ambient.copy(this.ambient);
    material.emissive.copy(this.emissive);
    material.wrapAround = this.wrapAround;
    material.wrapRGB.copy(this.wrapRGB);
    material.map = this.map;
    material.lightMap = this.lightMap;
    material.specularMap = this.specularMap;
    material.envMap = this.envMap;
    material.combine = this.combine;
    material.reflectivity = this.reflectivity;
    material.refractionRatio = this.refractionRatio;
    material.fog = this.fog;
    material.shading = this.shading;
    material.shaderID = this.shaderID;
    material.vertexColors = this.vertexColors;
    material.skinning = this.skinning;
    material.morphTargets = this.morphTargets;
    material.morphNormals = this.morphNormals;
    return material;
  }
}
