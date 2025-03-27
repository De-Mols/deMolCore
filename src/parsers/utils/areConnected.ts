import { AtomSpec } from "specs";
import { connectionLength } from "./connectionLength";
import { ParserConfig } from "parsers/ParserConfig";
const cations = new Set(["Na","K","Ca","Mg","Mn","Sr"]);
export function areConnected(atom1: AtomSpec, atom2: AtomSpec, options: ParserConfig) {
  if(options && options.unboundCations && (cations.has(atom1.elem) || cations.has(atom2.elem))) {
    return false;
  }
  let maxsq = connectionLength(atom1.elem) + connectionLength(atom2.elem);
  maxsq += 0.25; 
  maxsq *= maxsq;
  let xdiff = atom1.x - atom2.x;
  xdiff *= xdiff;
  if (xdiff > maxsq) return false;
  let ydiff = atom1.y - atom2.y;
  ydiff *= ydiff;
  if (ydiff > maxsq) return false;
  let zdiff = atom1.z - atom2.z;
  zdiff *= zdiff;
  if (zdiff > maxsq) return false;
  const distSquared = xdiff + ydiff + zdiff;
  if (
    isNaN(distSquared) ||
    distSquared < 0.5 ||
    distSquared > maxsq ||
    (atom1.altLoc !== atom2.altLoc && atom1.altLoc.trim() !== "" && atom2.altLoc.trim() !== "")
  )
    return false;
  return true;
}
