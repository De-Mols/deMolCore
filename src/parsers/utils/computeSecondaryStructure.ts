import { AtomSpec } from "specs";
import { createInternalLinks } from "./createInternalLinks";
export function computeTopology(atomsarray: Array<AtomSpec>, hbondCutoff: number) {
  createInternalLinks(atomsarray, hbondCutoff);
  const chres = {}; 
  let i: number, il: number, c: string | number, r: number; 
  let atom: AtomSpec, val: string;
  for (i = 0, il = atomsarray.length; i < il; i++) {
    atom = atomsarray[i];
    if (chres[atom.chain] === undefined) chres[atom.chain] = [];
    if (isFinite(atom.hbondDistanceSq)) {
      const other = atom.hbondOther;
      if (chres[other.chain] === undefined) chres[other.chain] = [];
      if (Math.abs(other.resi - atom.resi) === 4) {
        chres[atom.chain][atom.resi] = "h";
      }
    }
  }
  for (c in chres) {
    for (r = 1; r < chres[c].length - 1; r++) {
      const valbefore = chres[c][r - 1];
      const valafter = chres[c][r + 1];
      val = chres[c][r];
      if (valbefore == "h" && valbefore == valafter && val != valbefore) {
        chres[c][r] = valbefore;
      }
    }
  }
  for (i = 0, il = atomsarray.length; i < il; i++) {
    atom = atomsarray[i];
    if (
      isFinite(atom.hbondDistanceSq) &&
      chres[atom.chain][atom.resi] != "h" &&
      atom.ss !== "h"
    ) {
      chres[atom.chain][atom.resi] = "maybesheet";
    }
  }
  for (let i = 0, il = atomsarray.length; i < il; i++) {
    atom = atomsarray[i];
    if (
      isFinite(atom.hbondDistanceSq) &&
      chres[atom.chain][atom.resi] == "maybesheet"
    ) {
      const other = atom.hbondOther;
      const otherval = chres[other.chain][other.resi];
      if (otherval == "maybesheet" || otherval == "s") {
        chres[atom.chain][atom.resi] = "s";
        chres[other.chain][other.resi] = "s";
      }
    }
  }
  for (const c in chres) {
    for (let r = 1; r < chres[c].length - 1; r++) {
      const valbefore = chres[c][r - 1];
      const valafter = chres[c][r + 1];
      val = chres[c][r];
      if (valbefore == "s" && valbefore == valafter && val != valbefore) {
        chres[c][r] = valbefore;
      }
    }
    for (let r = 0; r < chres[c].length; r++) {
      const val = chres[c][r];
      if (val == "h" || val == "s") {
        if (chres[c][r - 1] != val && chres[c][r + 1] != val)
          delete chres[c][r];
      }
    }
  }
  for (i = 0, il = atomsarray.length; i < il; i++) {
    atom = atomsarray[i];
    val = chres[atom.chain][atom.resi];
    delete atom.hbondOther;
    delete atom.hbondDistanceSq;
    if (val === undefined || val === "maybesheet") continue;
    atom.ss = val;
    if (chres[atom.chain][atom.resi - 1] != val) atom.ssbegin = true;
    if (chres[atom.chain][atom.resi + 1] != val) atom.ssend = true;
  }
}
