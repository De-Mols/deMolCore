import {
  SpriteAlignment,
  Texture,
  SpriteMaterial,
  Sprite,
  Vector2,
  Material,
} from "./WebGL";
import { Gradient } from "./Gradient";
import { Color, CC, ColorSpec } from "./colors";
import {XYZ} from "./WebGL/math"
import { WHITE_RGB, LABEL_CANVAS_WIDTH } from './constants';

export let LabelCount = 0;
function roundRect(ctx: CanvasRenderingContext2D, x: any, y: any, w: number, h: number, r: number, drawBorder: boolean) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  if (drawBorder) ctx.stroke();
}
function getColor(style: any, stylealpha?: any, init?: any) {
  let ret = init;
  if (typeof style != "undefined") {
    if (style instanceof Color) ret = style.scaled();
    else {
      ret = CC.color(style);
      if (typeof ret.scaled != "undefined") {
        ret = ret.scaled(); 
      }
    }
  }
  if (typeof stylealpha != "undefined") {
    ret.a = parseFloat(stylealpha);
  }
  return ret;
}
export interface LabelSpec {
  font?: string;
  fontSize?: number;
  fontColor?: ColorSpec;
  fontOpacity?: number;
  borderThickness?: number;
  borderColor?: ColorSpec;
  borderOpacity?: number;
  backgroundColor?: ColorSpec;
  backgroundOpacity?: number;
  position?: XYZ;
  screenOffset?: Vector2;
  inFront?: boolean;
  showBackground?: boolean;
  useScreen?: boolean;
  backgroundImage?: any;
  alignment?: string | Vector2;
  frame?: number;
}
export class Label {
  id: number;
  stylespec: any;
  canvas: HTMLCanvasElement;
  context: any;
  sprite: Sprite;
  text: any;
  frame: any;
  constructor(text: string, parameters: LabelSpec) {
    this.id = LabelCount++;
    this.stylespec = parameters || {};
    this.canvas = document.createElement("canvas");
    this.canvas.width = LABEL_CANVAS_WIDTH;
    this.canvas.height = 35;
    this.context = this.canvas.getContext("2d");
    this.sprite = new Sprite();
    this.text = text;
    this.frame = this.stylespec.frame;
  }
  getStyle() {
    return this.stylespec;
  }
  public hide() {
    if(this.sprite) {
      this.sprite.visible = false;
    }
  }
  public show() {
    if(this.sprite) {
      this.sprite.visible = true;
    }
  }
  setContext() {
    const style = this.stylespec;
    const useScreen =
      typeof style.useScreen == "undefined" ? false : style.useScreen;
    let showBackground = style.showBackground;
    if (showBackground === "0" || showBackground === "false")
      showBackground = false;
    if (typeof showBackground == "undefined") showBackground = true; 
    const font = style.font ? style.font : "sans-serif";
    const fontSize = parseInt(style.fontSize) ? parseInt(style.fontSize) : 18;
    const fontColor = getColor(style.fontColor, style.fontOpacity, {
      r: WHITE_RGB.r,
      g: WHITE_RGB.g,
      b: WHITE_RGB.b,
      a: 1.0,
    });
    const padding = style.padding ? style.padding : 4;
    let borderThickness = style.borderThickness ? style.borderThickness : 0;
    const backgroundColor = getColor(
      style.backgroundColor,
      style.backgroundOpacity,
      {
        r: 0,
        g: 0,
        b: 0,
        a: 1.0,
      }
    );
    const borderColor = getColor(
      style.borderColor,
      style.borderOpacity,
      backgroundColor
    );
    const position = style.position
      ? style.position
      : {
        x: -10,
        y: 1,
        z: 1,
      };
    let inFront = style.inFront !== undefined ? style.inFront : true;
    if (inFront === "false" || inFront === "0") inFront = false;
    let spriteAlignment = style.alignment || SpriteAlignment.topLeft;
    if (
      typeof spriteAlignment == "string" &&
      spriteAlignment in SpriteAlignment
    ) {
      spriteAlignment = (SpriteAlignment as any)[spriteAlignment] ;
    }
    let bold = "";
    if (style.bold) bold = "bold ";
    this.context.font = bold + fontSize + "px  " + font;
    const metrics = this.context.measureText(this.text);
    const textWidth = metrics.width;
    if (!showBackground) borderThickness = 0;
    let width = textWidth + 2.5 * borderThickness + 2 * padding;
    let height = fontSize * 1.25 + 2 * borderThickness + 2 * padding; 
    if (style.backgroundImage) {
      var img = style.backgroundImage;
      const w = style.backgroundWidth ? style.backgroundWidth : img.width;
      const h = style.backgroundHeight ? style.backgroundHeight : img.height;
      if (w > width) width = w;
      if (h > height) height = h;
    }
    this.canvas.width = width;
    this.canvas.height = height;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    bold = "";
    if (style.bold) bold = "bold ";
    this.context.font = bold + fontSize + "px  " + font;
    this.context.fillStyle =
      "rgba(" +
      backgroundColor.r +
      "," +
      backgroundColor.g +
      "," +
      backgroundColor.b +
      "," +
      backgroundColor.a +
      ")";
    this.context.strokeStyle =
      "rgba(" +
      borderColor.r +
      "," +
      borderColor.g +
      "," +
      borderColor.b +
      "," +
      borderColor.a +
      ")";
    if (style.backgroundGradient) {
      const gradient = this.context.createLinearGradient(
        0,
        height / 2,
        width,
        height / 2
      );
      const g = Gradient.getGradient(style.backgroundGradient);
      const minmax = g.range();
      let min = -1;
      let max = 1;
      if (minmax) {
        min = minmax[0];
        max = minmax[1];
      }
      const d = max - min;
      for (let i = 0; i < 1.01; i += 0.1) {
        const c = getColor(g.valueToHex(min + d * i));
        const cname = "rgba(" + c.r + "," + c.g + "," + c.b + "," + c.a + ")";
        gradient.addColorStop(i, cname);
      }
      this.context.fillStyle = gradient;
    }
    this.context.lineWidth = borderThickness;
    if (showBackground) {
      roundRect(
        this.context,
        borderThickness,
        borderThickness,
        width - 2 * borderThickness,
        height - 2 * borderThickness,
        6,
        borderThickness > 0
      );
    }
    if (style.backgroundImage) {
      this.context.drawImage(img, 0, 0, width, height);
    }
    this.context.fillStyle =
      "rgba(" +
      fontColor.r +
      "," +
      fontColor.g +
      "," +
      fontColor.b +
      "," +
      fontColor.a +
      ")";
    this.context.fillText(
      this.text,
      borderThickness + padding,
      fontSize + borderThickness + padding,
      textWidth
    );
    const texture = new Texture(this.canvas);
    texture.needsUpdate = true;
    this.sprite.material = new SpriteMaterial({
      map: texture,
      useScreenCoordinates: useScreen,
      alignment: spriteAlignment,
      depthTest: !inFront,
      screenOffset: style.screenOffset || null,
    }) as Material;
    this.sprite.scale.set(1, 1, 1);
    this.sprite.position.set(position.x, position.y, position.z);
  }
  dispose() {
    if (this.sprite.material.map !== undefined)
      this.sprite.material.map.dispose();
    if (this.sprite.material !== undefined) this.sprite.material.dispose();
  }
}
