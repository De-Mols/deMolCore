import { Vector3, Matrix4 } from "../WebGL";
import { assignBonds } from "./utils/assignBonds";
import { anumToSymbol } from "./utils/anumToSymbol";
import { ParserConfig } from "./ParserConfig";
import { AtomSpec, Cryst } from "specs";
import { BOHR_TO_ANGSTROM, ANGSTROM_TO_BOHR } from '../constants';

/**
 * @param {string}
 *            str
 * @param {ParserConfig}
 *            options
 * @category Parsers
 */
export function LocationParser(str: string, options: ParserConfig) {
  options = options || {};
  const atoms: Array<AtomSpec[]> & { modelData?: unknown } = [[]];
  let lines = str.split(/\r?\n/);
  const assignbonds =
    options.assignBonds === undefined ? true : options.assignBonds;

  if (lines.length < 6) return atoms;

  let lineArr = lines[2].replace(/^\s+/, "").replace(/\s+/g, " ").split(" ");

  const natoms = Math.abs(parseFloat(lineArr[0]));

  const cryst: Omit<Cryst, "a" | "b" | "c" | "alpha" | "beta" | "gamma"> = {
    origin: undefined,
    size: undefined,
    unit: undefined,
    matrix4: undefined,
    matrix: undefined,
  };

  const origin = (cryst.origin = new Vector3(
    parseFloat(lineArr[1]),
    parseFloat(lineArr[2]),
    parseFloat(lineArr[3])
  ));

  lineArr = lines[3].replace(/^\s+/, "").replace(/\s+/g, " ").split(" ");
  lineArr = lines[3].replace(/^\s+/, "").replace(/\s+/g, " ").split(" ");

  const convFactor = (lineArr[0] as any) > 0 ? BOHR_TO_ANGSTROM : ANGSTROM_TO_BOHR;
  origin.multiplyScalar(convFactor);

  const nX = Math.abs(lineArr[0] as any);
  const xVec = new Vector3(
    parseFloat(lineArr[1]),
    parseFloat(lineArr[2]),
    parseFloat(lineArr[3])
  ).multiplyScalar(convFactor);

  lineArr = lines[4].replace(/^\s+/, "").replace(/\s+/g, " ").split(" ");
  const nY = Math.abs(lineArr[0] as any);
  const yVec = new Vector3(
    parseFloat(lineArr[1]),
    parseFloat(lineArr[2]),
    parseFloat(lineArr[3])
  ).multiplyScalar(convFactor);

  lineArr = lines[5].replace(/^\s+/, "").replace(/\s+/g, " ").split(" ");
  const nZ = Math.abs(lineArr[0] as any);
  const zVec = new Vector3(
    parseFloat(lineArr[1]),
    parseFloat(lineArr[2]),
    parseFloat(lineArr[3])
  ).multiplyScalar(convFactor);

  cryst.size = { x: nX, y: nY, z: nZ };
  cryst.unit = new Vector3(xVec.x, yVec.y, zVec.z);

  if (
    xVec.y != 0 ||
    xVec.z != 0 ||
    yVec.x != 0 ||
    yVec.z != 0 ||
    zVec.x != 0 ||
    zVec.y != 0
  ) {
    cryst.matrix4 = new Matrix4(
      xVec.x,
      yVec.x,
      zVec.x,
      0,
      xVec.y,
      yVec.y,
      zVec.y,
      0,
      xVec.z,
      yVec.z,
      zVec.z,
      0,
      0,
      0,
      0,
      1
    );
    const t = new Matrix4().makeTranslation(origin.x, origin.y, origin.z);
    cryst.matrix4 = cryst.matrix4.multiplyMatrices(t, cryst.matrix4);
    cryst.matrix = cryst.matrix4.matrix3FromTopLeft();
    cryst.origin = new Vector3(0, 0, 0);
    cryst.unit = new Vector3(1, 1, 1);
  }

  atoms.modelData = [{ cryst: cryst }];

  lines = lines.splice(6, natoms);

  const start = atoms[atoms.length - 1].length;
  const end = start + lines.length;

  for (let i = start; i < end; ++i) {
    const atom: Record<string, any> = {};
    atom.serial = i;
    const line = lines[i - start];
    const tokens = line.replace(/^\s+/, "").replace(/\s+/g, " ").split(" ");
    atom.elem = anumToSymbol[tokens[0]];
    atom.x = parseFloat(tokens[2]) * convFactor;
    atom.y = parseFloat(tokens[3]) * convFactor;
    atom.z = parseFloat(tokens[4]) * convFactor;

    atom.hetflag = true;
    atom.bonds = [];
    atom.bondOrder = [];
    atom.properties = {};
    atoms[atoms.length - 1].push(atom);
  }

  if (assignbonds) {
    for (let i = 0; i < atoms.length; i++) assignBonds(atoms[i], options);
  }
  return atoms;
}
