import { ParserConfig } from "parsers/ParserConfig";
import { Matrix3, conversionMatrix3, Vector3 } from "../../WebGL";
import { AtomSpec, Cryst } from "specs";
export function processSymmetries(
  copyMatrices: string[] | any[],
  atoms: AtomSpec[],
  options: ParserConfig,
  cryst: Omit<Cryst, "origin" | "size" | "unit" | "matrix4" | "matrix">
) {
  const dontDuplicate = !options.duplicateAssemblyAtoms;
  const end = atoms.length;
  let offset = end;
  let modifiedIdentity = -1;
  let conversionMatrix = null;
  let toFrac = null;
  if ((options.normalizeAssembly || options.wrapAtoms) && cryst) {
    conversionMatrix = conversionMatrix3(
      cryst.a,
      cryst.b,
      cryst.c,
      cryst.alpha,
      cryst.beta,
      cryst.gamma
    );
    toFrac = new Matrix3();
    toFrac.getInverse3(conversionMatrix);
  }
  const getAdjustment = function (v: Vector3) {
    const c = v.clone().applyMatrix3(toFrac);
    const coord = [c.x, c.y, c.z];
    const adjustment = [0.0, 0.0, 0.0];
    for (let i = 0; i < 3; i++) {
      while (coord[i] < -0.001) {
        coord[i] += 1.0;
        adjustment[i] += 1.0;
      }
      while (coord[i] > 1.001) {
        coord[i] -= 1.0;
        adjustment[i] -= 1.0;
      }
    }
    const adjustmentVec = new Vector3(
      adjustment[0],
      adjustment[1],
      adjustment[2]
    );
    adjustmentVec.applyMatrix3(conversionMatrix);
    return adjustmentVec;
  };
  if (options.normalizeAssembly && cryst) {
    for (let t = 0; t < copyMatrices.length; t++) {
      const center = new Vector3(0, 0, 0);
      for (let n = 0; n < end; n++) {
        const xyz = new Vector3(atoms[n].x, atoms[n].y, atoms[n].z);
        xyz.applyMatrix4(copyMatrices[t]);
        center.add(xyz);
      }
      center.divideScalar(end);
      const adjustmentVec = getAdjustment(center);
      if (
        copyMatrices[t].isNearlyIdentity() &&
        adjustmentVec.lengthSq() > 0.001
      ) {
        modifiedIdentity = t; 
      }
      copyMatrices[t].translate(adjustmentVec);
    }
  }
  if (!dontDuplicate) {
    for (let n = 0; n < end; n++) {
      atoms[n].sym = -1; 
    }
    for (let t = 0; t < copyMatrices.length; t++) {
      if (!copyMatrices[t].isNearlyIdentity() && modifiedIdentity != t) {
        const xyz = new Vector3();
        for (let n = 0; n < end; n++) {
          const bondsArr: number[] = [];
          for (let l = 0; l < atoms[n].bonds.length; l++) {
            bondsArr.push(atoms[n].bonds[l] + offset);
          }
          xyz.set(atoms[n].x, atoms[n].y, atoms[n].z);
          xyz.applyMatrix4(copyMatrices[t]);
          if (options.wrapAtoms && cryst) {
            const adjustment = getAdjustment(xyz);
            xyz.add(adjustment);
          }
          const newAtom: Record<string, unknown> = {};
          for (const i in atoms[n]) {
            newAtom[i] = atoms[n][i];
          }
          newAtom.x = xyz.x;
          newAtom.y = xyz.y;
          newAtom.z = xyz.z;
          newAtom.bonds = bondsArr;
          newAtom.sym = t; 
          newAtom.index = atoms.length;
          atoms.push(newAtom);
        }
        offset = atoms.length;
      } else {
        for (let n = 0; n < end; n++) {
          atoms[n].sym = t;
        }
      }
    }
    if (options.wrapAtoms && cryst) {
      const xyz = new Vector3();
      for (let n = 0; n < end; n++) {
        xyz.set(atoms[n].x, atoms[n].y, atoms[n].z);
        const adjustment = getAdjustment(xyz);
        xyz.add(adjustment);
        atoms[n].x = xyz.x;
        atoms[n].y = xyz.y;
        atoms[n].z = xyz.z;
      }
    }
    if (modifiedIdentity >= 0) {
      const xyz = new Vector3();
      for (let n = 0; n < end; n++) {
        xyz.set(atoms[n].x, atoms[n].y, atoms[n].z);
        xyz.applyMatrix4(copyMatrices[modifiedIdentity]);
        atoms[n].x = xyz.x;
        atoms[n].y = xyz.y;
        atoms[n].z = xyz.z;
      }
    }
    (copyMatrices as any).length = 0;
  } else if (copyMatrices.length > 1) {
    for (let t = 0; t < atoms.length; t++) {
      const symmetries: Vector3[] = [];
      for (let l = 0; l < copyMatrices.length; l++) {
        if (!copyMatrices[l].isNearlyIdentity()) {
          const newXYZ = new Vector3();
          newXYZ.set(atoms[t].x, atoms[t].y, atoms[t].z);
          newXYZ.applyMatrix4(copyMatrices[l]);
          symmetries.push(newXYZ);
        }
      }
      atoms[t].symmetries = symmetries;
    }
  }
}
