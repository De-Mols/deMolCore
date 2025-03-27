import { ParserConfig } from "./ParserConfig";

const parseV2000 = function (lines: any, options: ParserConfig) {
  const atoms: any & Record<string, any> = [[]];
  let noH = false;
  if (typeof options.keepH !== "undefined") noH = !options.keepH;

  while (lines.length > 0) {
    if (lines.length < 4) break;
    const atomCount = parseInt(lines[3].substring(0, 3));
    if (isNaN(atomCount) || atomCount <= 0) break;
    const bondCount = parseInt(lines[3].substring(3, 6));
    let offset = 4;
    if (lines.length < 4 + atomCount + bondCount) break;

    const serialToIndex: number[] = [];
    const start = atoms[atoms.length - 1].length;
    const end = start + atomCount;
    var i: number, line: string;
    for (i = start; i < end; i++, offset++) {
      line = lines[offset];
      const atom: Record<string, any> = {};
      const elem = line.substring(31, 34).replace(/ /g, "");
      atom.atom = atom.elem =
        elem[0].toUpperCase() + elem.substring(1).toLowerCase();

      if (atom.elem !== "H" || !noH) {
        atom.serial = i;
        serialToIndex[i] = atoms[atoms.length - 1].length;
        atom.x = parseFloat(line.substring(0, 10));
        atom.y = parseFloat(line.substring(10, 20));
        atom.z = parseFloat(line.substring(20, 30));
        atom.hetflag = true;
        atom.bonds = [];
        atom.bondOrder = [];
        atom.properties = {};
        atom.index = atoms[atoms.length - 1].length;
        atoms[atoms.length - 1].push(atom);
      }
    }

    for (i = 0; i < bondCount; i++, offset++) {
      line = lines[offset];
      const from = serialToIndex[parseInt(line.substring(0, 3)) - 1 + start];
      const to = serialToIndex[parseInt(line.substring(3, 6)) - 1 + start];
      const order = parseFloat(line.substring(6));
      if (typeof from != "undefined" && typeof to != "undefined") {
        atoms[atoms.length - 1][from].bonds.push(to);
        atoms[atoms.length - 1][from].bondOrder.push(order);
        atoms[atoms.length - 1][to].bonds.push(from);
        atoms[atoms.length - 1][to].bondOrder.push(order);
      }
    }
    if (options.multimodel) {
      if (!options.onemol) atoms.push([]);
      while (lines[offset] !== "$$$$" && offset < lines.length) offset++;
      lines.splice(0, ++offset);
    } else {
      break;
    }
  }
  return atoms;
};

/**
 * @param {!Array.<string>} lines
 * @param {ParserConfig} options
 * @returns {!Array.<!Array<!Object>>}
*/

const parseV3000 = function (lines: any, options: ParserConfig) {
  const atoms: any[][] & Record<string, any> = [[]];
  let noH = false;
  if (typeof options.keepH !== "undefined") noH = !options.keepH;

  while (lines.length > 0) {
    if (lines.length < 8) break;

    if (!lines[4].startsWith("M  V30 BEGIN CTAB")) break;
    if (!lines[5].startsWith("M  V30 COUNTS") || lines[5].length < 14) break;

    const counts = lines[5].substring(13).match(/\S+/g);

    if (counts.length < 2) break;

    const atomCount = parseInt(counts[0]);
    if (isNaN(atomCount) || atomCount <= 0) break;
    const bondCount = parseInt(counts[1]);
    let offset = 7;

    if (lines.length < 8 + atomCount + bondCount)
      break;

    const serialToIndex: number[] = [];
    const start = atoms[atoms.length - 1].length;
    const end = start + atomCount;
    var i: number, line: string;
    for (i = start; i < end; i++, offset++) {
      line = lines[offset];
      const atomParts = line.substring(6).match(/\S+/g);
      if (atomParts!.length > 4) {
        const atom: Record<string, any> = {};
        const elem = atomParts![1].replace(/ /g, "");
        atom.atom = atom.elem =
          elem[0].toUpperCase() + elem.substring(1).toLowerCase();

        if (atom.elem !== "H" || !noH) {
          atom.serial = i;
          serialToIndex[i] = atoms[atoms.length - 1].length;
          atom.x = parseFloat(atomParts![2]);
          atom.y = parseFloat(atomParts![3]);
          atom.z = parseFloat(atomParts![4]);
          atom.hetflag = true;
          atom.bonds = [];
          atom.bondOrder = [];
          atom.properties = {};
          atom.index = atoms[atoms.length - 1].length;
          atoms[atoms.length - 1].push(atom);
        }
      }
    }

    if (lines[offset] === "M  V30 END ATOM") offset++;
    else break;

    if (bondCount !== 0 && lines[offset] === "M  V30 BEGIN BOND") offset++;
    else break;

    for (i = 0; i < bondCount; i++, offset++) {
      line = lines[offset];
      const bondParts = line.substring(6).match(/\S+/g);
      if (bondParts!.length > 3) {
        const from = serialToIndex[parseInt(bondParts![2]) - 1 + start];
        const to = serialToIndex[parseInt(bondParts![3]) - 1 + start];
        const order = parseFloat(bondParts![1]);
        if (typeof from != "undefined" && typeof to != "undefined") {
          atoms[atoms.length - 1][from].bonds.push(to);
          atoms[atoms.length - 1][from].bondOrder.push(order);
          atoms[atoms.length - 1][to].bonds.push(from);
          atoms[atoms.length - 1][to].bondOrder.push(order);
        }
      }
    }
    if (options.multimodel) {
      if (!options.onemol) {
        atoms.push([]);
      }
      while (lines[offset] !== "$$$$" && offset < lines.length) {
        offset++;
      }
      lines.splice(0, ++offset);
    } else {
      break;
    }
  }
  return atoms;
};

/**
 * @param {string}
 *            str
 * @param {ParserConfig}
 *            options
 * @category Parsers
*/

export function StructureDataFormat(str: string, options: ParserConfig) {
  let molformat = "V2000";
  const lines = str.split(/\r?\n|\r/);
  if (lines.length > 3 && lines[3].length > 38) {
    molformat = lines[3].substring(34, 39);
  }
  if (molformat === "V2000") {
    return parseV2000(lines, options);
  } else if (molformat === "V3000") {
    return parseV3000(lines, options);
  }
  return [['']];
}
