import { ParserConfig } from "./ParserConfig";

/** 
 * This parses the ChemDoodle json file format. Although this is registered
 * for the json file extension, other chemical json file formats exist that
 * this can not parse. Check which one you have and do not assume that
 * .json can be parsed
 * 
 * @param {string} str
 * @param {ParserConfig} options
 * @category Parsers
*/

export function StructureParser(str: string, options: ParserConfig) {
  const atoms: any[][] & Record<string, any> = [[]];
  if (typeof str === "string") {
    str = JSON.parse(str);
  }
  const molecules = (str as any).m;
  const atomsInFile = molecules[0].a;
  const bondsInFile = molecules[0].b;
  const styles = molecules[0].s;
  const parseStyle =
    options !== undefined && options.parseStyle !== undefined
      ? options.parseStyle
      : styles !== undefined;

  const offset = atoms[atoms.length - 1].length;

  for (let i = 0; i < atomsInFile.length; i++) {
    const currentAtom = atomsInFile[i];
    const atom: Record<string, any> = {};
    atom.id = currentAtom.i;
    atom.x = currentAtom.x;
    atom.y = currentAtom.y;
    atom.z = currentAtom.z || 0;

    atom.bonds = [];
    atom.bondOrder = [];

    const elem = currentAtom.l || "C";
    atom.elem = elem[0].toUpperCase() + elem.substring(1).toLowerCase();

    atom.serial = atoms[atoms.length - 1].length;
    if (parseStyle) {
      atom.style = styles[currentAtom.s || 0];
    }
    atoms[atoms.length - 1].push(atom);
  }
  for (let i = 0; i < bondsInFile.length; i++) {
    const currentBond = bondsInFile[i];
    const beginIndex = currentBond.b + offset;
    const endIndex = currentBond.e + offset;
    const bondOrder = currentBond.o || 1;

    const firstAtom = atoms[atoms.length - 1][beginIndex];
    const secondAtom = atoms[atoms.length - 1][endIndex];

    firstAtom.bonds.push(endIndex);
    firstAtom.bondOrder.push(bondOrder);
    secondAtom.bonds.push(beginIndex);
    secondAtom.bondOrder.push(bondOrder);
  }
  return atoms;
}
