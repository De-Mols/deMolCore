import { ParserConfig } from "./ParserConfig";

const SYBYLtoElem:any = {
  'C.1': 'C',
  'C1': 'C',
  'C.2': 'C',
  'C2': 'C',
  'C.3': 'C',
  'C3': 'C',  
  'C.ar': 'C',
  'Car': 'C',
  'C.cat': 'C',
  'Ccat': 'C',
  'H.spc' :'H',
  'Hspc':'H',
  'H.t3p':'H',
  'Ht3p': 'H',
  'N.1':'N',
  'N1':'N',
  'N.2':'N',
  'N2':'N',
  'N.3':'N',
  'N3':'N',
  'N.4':'N',
  'N4':'N',
  'N.am':'N',
  'Nam':'N',
  'N.ar':'N',
  'Nar':'N',
  'N.p13':'N',
  'Np13':'N',    
  'O.2':'O',
  'O2':'O',
  'O.3':'O',
  'O3':'O',
  'O.co2':'O',
  'Oco2':'O',
  'O.spc':'O',
  'Ospc':'O',    
  'O.t3p':'O',
  'Ot3p':'O',  
  'P.3':'P',
  'P3':'P',
  'S.2':'S',
  'S2':'S',  
  'S.3':'S',
  'S3':'S',  
  'S.o':'S',
  'So':'S',  
  'S.o2':'S',
  'So2':'S'
};


/**
 * @param {string}
 *            str
 * @param {ParserConfig}
 *            options
 * @category Parsers
*/

export function MoleculeFormat(str: string, options: ParserConfig) {
  const atoms: any[][] & Record<string,any> = [[]];
  let noH = false;
  if (typeof options.keepH !== "undefined") noH = !options.keepH;


  const mol_pos = str.search(/@<TRIPOS>MOLECULE/);
  const atom_pos = str.search(/@<TRIPOS>ATOM/);

  if (mol_pos == -1 || atom_pos == -1) return atoms;

  const lines = str.substring(mol_pos).split(/\r?\n|\r/);
  while (lines.length > 0) {
    const serialToIndex: number[] = [];
    let tokens = lines[2].replace(/^\s+/, "").replace(/\s+/g, " ").split(" ");
    const natoms = parseInt(tokens[0]);
    let nbonds = 0;

    if (tokens.length > 1) nbonds = parseInt(tokens[1]);

    let offset = 4;
    var i: number;
    for (i = 3; i < lines.length; i++) {
      if (lines[i] == "@<TRIPOS>ATOM") {
        offset = i + 1;
        break;
      }
    }

    const start = atoms[atoms.length - 1].length;
    const end = start + natoms;
    var line: string;
    for (i = start; i < end; i++) {
      line = lines[offset++];
      tokens = line.replace(/^\s+/, "").replace(/\s+/g, " ").split(" ");
      const atom: Record<string, any> = {};
      let elem = tokens[5];
      if(SYBYLtoElem[elem] !== undefined) {        
        elem = SYBYLtoElem[elem];
      } else {
        elem = elem.split(".")[0];
        elem = elem[0].toUpperCase() + elem.substring(1).toLowerCase();
      }

      atom.atom = tokens[1];
      atom.elem = elem;
        
      if (atom.elem == "H" && noH) {
      } else {
        const index = atoms[atoms.length - 1].length;
        const serial = parseInt(tokens[0]);
        atom.serial = serial;

        atom.x = parseFloat(tokens[2]);
        atom.y = parseFloat(tokens[3]);
        atom.z = parseFloat(tokens[4]);
        atom.atom = tokens[5];
        const charge = parseFloat(tokens[8]);

        atom.index = index;
        atom.bonds = [];
        atom.bondOrder = [];
        atom.properties = {
          charge: charge,
          partialCharge: charge,
        };
        serialToIndex[serial] = index;

        atoms[atoms.length - 1].push(atom);
      }
    }

    let bonds_found = false;
    while (offset < lines.length) {
      if (lines[offset++] == "@<TRIPOS>BOND") {
        bonds_found = true;
        break;
      }
    }

    if (bonds_found && nbonds) {
      for (i = 0; i < nbonds; i++) {
        line = lines[offset++];

        tokens = line.replace(/^\s+/, "").replace(/\s+/g, " ").split(" ");
        const from = parseInt(tokens[1]);
        const fromAtom = atoms[atoms.length - 1][serialToIndex[from]];
        const to = parseInt(tokens[2]);
        const toAtom = atoms[atoms.length - 1][serialToIndex[to]];

        let order = parseInt(tokens[3]);
        if (isNaN(order)) order = 1;

        if (fromAtom !== undefined && toAtom !== undefined) {
          fromAtom.bonds.push(serialToIndex[to]);
          fromAtom.bondOrder.push(order);
          toAtom.bonds.push(serialToIndex[from]);
          toAtom.bondOrder.push(order);
        }
      }
    }
    if (options.multimodel) {
      if (!options.onemol) atoms.push([]);
      lines.splice(0, offset);
      str = lines.join("\n");
      continue;
    } else {
      break;
    }
  }
  return atoms;
}
