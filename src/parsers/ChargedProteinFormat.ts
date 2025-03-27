import { ParserConfig } from "./ParserConfig";
import { assignPDBBonds } from "./utils/assignPDBBonds";
import { computeSecondaryStructure } from "./utils/computeSecondaryStructure";


/**
 * Parse a pqr file from str and create atoms. A pqr file is assumed to be a whitespace delimited ProteinFormat with charge and radius fields.
 * 
 * @param {string}
 *            str
 * @param {ParserConfig}
 *            options - noSecondaryStructure (do not compute ss)
 * @category Parsers 
*/

export function ChargedProteinFormat(str: string, options: ParserConfig) {
      const atoms: any[][] & Record<string, any> = [[]];
      const computeStruct = !options.noSecondaryStructure;
      atoms.modelData = [{symmetries:[]}];
      const serialToIndex: number[] = []; // map from pdb serial to index in atoms
      const lines = str.split(/\r?\n|\r/);
      let line: string | string[];
      for (let i = 0; i < lines.length; i++) {
          line = lines[i].replace(/^\s*/, ''); // remove indent
          const recordName = line.substring(0, 6);
          
          if (recordName.indexOf("END") == 0) {
              if (options.multimodel) {
                  if (!options.onemol)
                      atoms.push([]);
                  continue;
              }
              else {
                  break;
              }
          }
          else if (recordName == 'ATOM  ' || recordName == 'HETATM') {
              var hetflag: boolean;
              const serial = parseInt(line.substring(6, 11));
              const atom = line.substring(12, 16).replace(/ /g, "");
              const resn = line.substring(17, 20).trim();
              const chain = line.substring(21, 22);
              const resi = parseInt(line.substring(22, 26));
              const vals = line.substring(30).trim().split(/\s+/);
              const x = parseFloat(vals[0]);
              const y = parseFloat(vals[1]);
              const z = parseFloat(vals[2]);
              const charge = parseFloat(vals[3]);
              const radius = parseFloat(vals[4]);

              let elem = atom[0];
              if (atom.length > 1 && atom[1].toUpperCase() != atom[1]) {
                  elem = atom.substring(0, 2);
              }

              if (line[0] == 'H')
                  hetflag = true;
              else
                  hetflag = false;
              serialToIndex[serial] = atoms[atoms.length-1].length;
              atoms[atoms.length-1].push({
                  'resn' : resn,
                  'x' : x,
                  'y' : y,
                  'z' : z,
                  'elem' : elem,
                  'hetflag' : hetflag,
                  'chain' : chain,
                  'resi' : resi,
                  'serial' : serial,
                  'atom' : atom,
                  'bonds' : [],
                  'ss' : 'c',
                  'bondOrder' : [],
                  'properties' : {
                      'charge' : charge,
                      'partialCharge' : charge,
                      'radius' : radius
                  },
                  'pdbline' : line
              });
          } else if (recordName == 'CONECT') {
              const from = parseInt(line.substring(6, 11));
              const fromAtom = atoms[atoms.length-1][serialToIndex[from]];
              for (let j = 0; j < 4; j++) {
                  const to = parseInt(line.substring([ 11, 16, 21, 26 ][j], [ 11, 16, 21, 26 ][j] + 5));
                  const toAtom = atoms[atoms.length-1][serialToIndex[to]];
                  if (fromAtom !== undefined && toAtom !== undefined) {
                      fromAtom.bonds.push(serialToIndex[to]);
                      fromAtom.bondOrder.push(1);
                  }
              }
          }
      }

      for (let i = 0; i < atoms.length; i++) {
          assignPDBBonds(atoms[i],options);
          if (computeStruct)
              computeSecondaryStructure(atoms[i],options.hbondCutoff);
      }
      
      return atoms;
  };