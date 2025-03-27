import { CC, Color, ColorSpec } from "./colors";
export abstract class GradientType {
  gradient?: string;
  abstract valueToHex(value: number, range?: number[]): number;
  abstract range(): number[] | null;
}
export function normalizeValue(
  lo: number,
  hi: number,
  val: number
): { lo: number; hi: number; val: number } {
  if (hi >= lo) {
    if (val < lo) val = lo;
    if (val > hi) val = hi;
    return { lo: lo, hi: hi, val: val };
  } else {
    if (val > lo) val = lo;
    if (val < hi) val = hi;
    val = lo - val + hi;
    return { lo: hi, hi: lo, val: val };
  }
}
export type GradientSpec = {
  gradient?: string;
  min?: number;
  max?: number;
  prop?: string;
  mid?: number;
  colors?: Array<ColorSpec>;
  map?: Record<string, unknown>
};
export function getGradient(grad: GradientSpec|GradientType): GradientType {
  if (grad instanceof GradientType) {
    return grad;
  } else if (grad.gradient !== undefined && builtinGradients[grad.gradient]
  ) {
    const min = grad.min === undefined ? -1 : grad.min;
    const max = grad.max === undefined ? 1 : grad.max;
    if (grad.mid === undefined) {
      if (grad.colors === undefined) {
        return new builtinGradients[grad.gradient](min, max);
      } else {
        return new builtinGradients[grad.gradient](min, max, grad.colors);
      }
    } else {
      return new builtinGradients[grad.gradient](min, max, grad.mid);
    }
  } else if(typeof(grad.gradient) == "string" && grad.gradient.startsWith('linear_')) {
    const colors = grad.gradient.split('_');
    colors.shift();
    const min = grad.min === undefined ? -1 : grad.min;
    const max = grad.max === undefined ? 1 : grad.max;    
    return new CustomLinear(min,max,colors);
  }
  return grad as GradientType;
}
export class RWB extends GradientType {
  gradient = "RWB";
  min: number;
  max: number;
  mid?: number;
  mult: number;
  constructor(min?: number | [number, number], max?: number, mid?: number) {
    super();
    this.mult = 1.0;
    this.mid = mid;
    this.min = min as number;
    this.max = max;
    if (typeof max == "undefined" && Array.isArray(min) && min.length >= 2) {
      this.max = min[1];
      this.min = min[0];
    } else if (!!min && !!max && !Array.isArray(min)) {
      this.min = min;
      this.max = max;
    }
  }
  range() {
    if (typeof this.min != "undefined" && typeof this.max != "undefined") {
      return [this.min, this.max] as [number, number];
    }
    return null;
  }
  valueToHex(val: number, range?: number[]) {
    let lo: number, hi: number;
    val = this.mult * val; 
    if (range) {
      lo = range[0];
      hi = range[1];
    } else {
      lo = this.min;
      hi = this.max;
    }
    if (val === undefined) return 0xffffff;
    const norm = normalizeValue(lo, hi, val);
    lo = norm.lo;
    hi = norm.hi;
    val = norm.val;
    let middle = (hi + lo) / 2;
    if (range && typeof range[2] != "undefined") middle = range[2];
    else if (typeof this.mid != "undefined")
      middle = this.mid; 
    else middle = (lo + hi) / 2;
    let scale: number, color: number;
    if (val < middle) {
      scale = Math.floor(255 * Math.sqrt((val - lo) / (middle - lo)));
      color = 0xff0000 + 0x100 * scale + scale;
      return color;
    } else if (val > middle) {
      scale = Math.floor(255 * Math.sqrt(1 - (val - middle) / (hi - middle)));
      color = 0x10000 * scale + 0x100 * scale + 0xff;
      return color;
    } else {
      return 0xffffff;
    }
  }
}
export class ROYGB extends GradientType {
  gradient = "ROYGB";
  mult: number;
  max?: number;
  min?: number;
  constructor(min?: number, max?: number) {
    super();
    this.mult = 1.0;
    this.min = min;
    this.max = max;
    if (typeof max == "undefined" && Array.isArray(min) && min.length >= 2) {
      this.max = min[1];
      this.min = min[0];
    } else if (!!min && !!max && !Array.isArray(min)) {
      this.min = min;
      this.max = max;
    }
  }
  valueToHex(val: number, range?: any[]) {
    let lo: number, hi: number;
    val = this.mult * val;
    if (range) {
      lo = range[0];
      hi = range[1];
    } else {
      lo = this.min!;
      hi = this.max!;
    }
    if (typeof val == "undefined") return 0xffffff;
    const norm = normalizeValue(lo, hi, val);
    lo = norm.lo;
    hi = norm.hi;
    val = norm.val;
    const mid = (lo + hi) / 2;
    const q1 = (lo + mid) / 2;
    const q3 = (mid + hi) / 2;
    let scale: number, color: number;
    if (val < q1) {
      scale = Math.floor(255 * Math.sqrt((val - lo) / (q1 - lo)));
      color = 0xff0000 + 0x100 * scale + 0;
      return color;
    } else if (val < mid) {
      scale = Math.floor(255 * Math.sqrt(1 - (val - q1) / (mid - q1)));
      color = 0x010000 * scale + 0xff00 + 0x0;
      return color;
    } else if (val < q3) {
      scale = Math.floor(255 * Math.sqrt((val - mid) / (q3 - mid)));
      color = 0x000000 + 0xff00 + 0x1 * scale;
      return color;
    } else {
      scale = Math.floor(255 * Math.sqrt(1 - (val - q3) / (hi - q3)));
      color = 0x000000 + 0x0100 * scale + 0xff;
      return color;
    }
  }
  range() {
    if (typeof this.min != "undefined" && typeof this.max != "undefined") {
      return [this.min, this.max] as [number, number];
    }
    return null;
  }
}
export class Sinebow extends GradientType {
  gradient = "Sinebow";
  mult: number;
  max: number;
  min: number;
  constructor(min: number, max: number) {
    super();
    this.mult = 1.0;
    this.min = min;
    this.max = max;
    if (typeof max == "undefined" && Array.isArray(min) && min.length >= 2) {
      this.max = min[1];
      this.min = min[0];
    }
    if (max < min) {
      this.mult = -1.0;
      this.min *= -1.0;
      this.max *= -1.0;
    }
  }
  valueToHex(val: number, range?: any[]) {
    let lo: number, hi: number;
    val = this.mult * val;
    if (range) {
      lo = range[0];
      hi = range[1];
    } else {
      lo = this.min;
      hi = this.max;
    }
    if (typeof val == "undefined") return 0xffffff;
    const norm = Gradient.normalizeValue(lo, hi, val);
    lo = norm.lo;
    hi = norm.hi;
    val = norm.val;
    const scale = (val - lo) / (hi - lo);
    const h = (5 * scale) / 6.0 + 0.5;
    let r = Math.sin(Math.PI * h);
    r *= r * 255;
    let g = Math.sin(Math.PI * (h + 1 / 3.0));
    g *= g * 255;
    let b = Math.sin(Math.PI * (h + 2 / 3.0));
    b *= b * 255;
    return (
      0x10000 * Math.floor(r) + 0x100 * Math.floor(b) + 0x1 * Math.floor(g)
    );
  }
  range() {
    if (typeof this.min != "undefined" && typeof this.max != "undefined") {
      return [this.min, this.max] as [number, number];
    }
    return null;
  }
}
export class CustomLinear extends GradientType {
  gradient = "linear";
  min: number;
  max: number;
  colors = new Array<Color>();
  constructor(min: any, max: any, colors?: any) {
    super();
    let carr: Array<any>;
    if (Array.isArray(min) && min.length >= 2) {
      this.max = min[1] as number;
      this.min = min[0] as number;
      carr = max;
    } else {
      this.min = min as number;
      this.max = max as number;
      carr = colors;
    }
    if (carr) {
      for (const c of carr) {
        this.colors.push(CC.color(c));
      }
    } else {
      this.colors.push(CC.color(0));
    }
  }
  range() {
    if (typeof this.min != "undefined" && typeof this.max != "undefined") {
      return [this.min, this.max] as [number, number];
    }
    return null;
  }
  valueToHex(val: number, range?: any[]) {
    let lo: number, hi: number;
    if (range) {
      lo = range[0];
      hi = range[1];
    } else {
      lo = this.min;
      hi = this.max;
    }
    if (val === undefined) return 0xffffff;
    const norm = normalizeValue(lo, hi, val);
    lo = norm.lo;
    hi = norm.hi;
    val = norm.val;
    const nsteps = this.colors.length;
    const stepsize = (hi - lo) / nsteps;
    const startpos = Math.min(Math.floor((val - lo) / stepsize), nsteps - 1);
    const endpos = Math.min(startpos + 1, nsteps - 1);
    const frac = (val - lo - (startpos * stepsize)) / stepsize;
    const startcol = this.colors[startpos];
    const endcol = this.colors[endpos];
    const col = new Color(startcol.r + frac * (endcol.r - startcol.r),
      startcol.g + frac * (endcol.g - startcol.g),
      startcol.b + frac * (endcol.b - startcol.b));
    return col.getHex();
  }
}
 export const builtinGradients  = {
  "rwb": RWB,
  "RWB": RWB,
  "roygb": ROYGB,
  "ROYGB": ROYGB,
  "sinebow": Sinebow,
  "linear": CustomLinear
};
export class Gradient extends GradientType {
  static RWB = RWB;
  static ROYGB = ROYGB;
  static Sinebow = Sinebow;
  static CustomLinear = CustomLinear;
  static builtinGradients = builtinGradients;
  static normalizeValue = normalizeValue;
  static getGradient = getGradient;
  valueToHex(_value: number, _range?: number[]): number { return 0; }
  range(): [number, number] | null { return null; }
}
