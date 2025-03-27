import { ParserConfig } from "./ParserConfig";
import { getSinglePDB } from "./utils/getSinglePDB";

/**
 * Parse pdb file from str and create atoms if computeStruct is true will always perform secondary structure analysis, 
 * otherwise only do analysis of SHEET/HELIX comments are missing
 * 
 * @param {string} str
 * @param {ParserConfig} options - keepH (do not strip hydrogens), noSecondaryStructure,
 *            assignbonds (default true, calculate implicit bonds)
 *            (do not compute ss), altLoc (which alternate location to select, if present; '*' to load all)
 * @category Parsers
 * 
*/

export function ProteinFormat(str: string, options: ParserConfig) {
  options = options || {};
  const atoms: any[] & Record<string, any> = [];
  const sslookup = {};
  atoms.modelData = [];
  let lines: any = str.split(/\r?\n|\r/);
  while (lines.length > 0) {
    const pdbinfo = getSinglePDB(lines, options, sslookup);
    const modelatoms = pdbinfo[0];
    const modelData = pdbinfo[1];
    lines = pdbinfo[2];

    if (modelatoms.length == 0) {
      continue;
    }
    if (options.multimodel && options.onemol && atoms.length > 0) {
      const inc = atoms[0].length;
      for (let i = 0; i < modelatoms.length; i++) {
        const atom = modelatoms[i];
        atom.index = i;
        for (let b = 0; b < atom.bonds.length; b++) {
          atom.bonds[b] += inc;
        }
        atoms[0].push(atom);
      }
    } else {
      atoms.modelData.push(modelData);
      atoms.push(modelatoms);
    }

    if (!options.multimodel) {
      break;
    }
  }

  return atoms;
}
