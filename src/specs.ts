 import { Matrix4, Vector3 } from "WebGL";
import { AtomStyleSpec, BondStyle, Model3D } from "./Model3D";
import { Viewer3D } from "./Viewer3D";
import { ColorSpec } from "./colors";
export interface AtomSpec {
  resn?: string;
  lresn?: string;
  x?: number;
  y?: number;
  z?: number;
  color?: ColorSpec;
  surfaceColor?: ColorSpec;
  elem?: string;
  hetflag?: boolean;
  chain?: string;
  lchain?: string;
  resi?: number;
  lresi?: number; 
  icode?: string;
  rescode?: string;
  serial?: number;
  index?: number;
  atom?: string;
  bonds?: number[];
  ss?: string;
  ssbegin?: boolean;
  ssend?: boolean;
  singleBonds?: boolean;
  bondOrder?: number[];
  properties?: Record<string, any>;
  b?: number;
  pdbline?: string;
  clickable?: boolean;
  callback?: (atom: AtomSpec, viewer: Viewer3D) => void;
  hoverable?: boolean;
  hover_callback?: (atom: AtomSpec, viewer: Viewer3D) => void;
  unhover_callback?: (atom: AtomSpec, viewer: Viewer3D) => void;
  invert?: boolean;
  style?: AtomStyleSpec;
  bondStyles?: BondStyle[];
  intersectionShape?: any;
  capDrawn?: boolean;
  model?: number;
  contextMenuEnabled?: boolean;
  hbondDistanceSq?: number;
  hbondOther?: any;
  altLoc?: string;
  reschain?: number;
  uMat?: Record<string, number>;
  symmetries?: Vector3[];
  sym?: any;
  dx?: number;
  dy?: number;
  dz?: number;
}
export interface AtomSelectionSpec
  extends Omit<AtomSpec, "bonds" | "model" | "index" | "resi"> {
  model?: Model3D | number | Model3D[] | number[];
  frame?: number;
  index?: number | number[];
  bonds?: number;
  resi?: number | SelectionRange | (number | SelectionRange)[];
  predicate?: (atom: AtomSpec) => boolean;
  invert?: boolean;
  byres?: boolean;
  expand?: number | string;
  within?: WithinSelectionSpec;
  and?: AtomSelectionSpec[] & { __cached_results?: any };
  or?: AtomSelectionSpec[] & { __cached_results?: any };
  not?: AtomSelectionSpec;
  contextMenuEnabled?: boolean;
}
export interface WithinSelectionSpec {
  distance?: number;
  invert?: boolean;
  sel?: AtomSelectionSpec;
}
export type Cryst = {
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
  origin: Vector3;
  size: { x: number; y: number; z: number };
  unit: Vector3;
  matrix4: Matrix4;
  matrix: unknown;
};
export type SelectionRange = `${number}-${number}`;
