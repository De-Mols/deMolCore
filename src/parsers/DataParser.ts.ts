import { ParserConfig } from "./ParserConfig";
import { base64ToArray, inflateString } from "../utilities";
import { MMTFobj } from "./MacromolecularFormat"
import { computeSecondaryStructure } from "./utils/computeSecondaryStructure";
import { processSymmetries } from "./utils/processSymmetries";
import { Category } from "./crystalutils/category";
import { AtomSpec } from "specs";
import { assignPDBBonds } from "./utils/assignPDBBonds";
import { Matrix4 } from "../WebGL";
import { isEmpty } from "./utils/isEmpty";

declare let MMTF: MMTFobj;


class Connectivity {
  C: Record<string, Record<string, Record<string, number>>> = {};

  constructor(comp_bond) {
    if (comp_bond) {
      const ids = comp_bond.getField('comp_id');
      const a1s = comp_bond.getField('atom_id_1');
      const a2s = comp_bond.getField('atom_id_2');
      const orders = comp_bond.getField('value_order');

      for (let i = 0; i < ids.length; i++) {
        const resn = ids[i];
        const a1 = a1s[i];
        const a2 = a2s[i];
        const oname = orders[i];
        let o = 1;
        if (oname == 'doub') o = 2;
        else if (oname == 'trip') o = 3;

        if (this.C[resn] == undefined) {
          this.C[resn] = {};
        }
        if (this.C[resn][a1] == undefined) {
          this.C[resn][a1] = {};
        }
        if (this.C[resn][a2] == undefined) {
          this.C[resn][a2] = {};
        }
        this.C[resn][a1][a2] = o;
        this.C[resn][a2][a1] = o;
      }
    }
  }

  order(resn: string, atom1: string, atom2: string): number {
    if (this.C[resn] !== undefined) {
      if (this.C[resn][atom1] !== undefined) {
        if (this.C[resn][atom1][atom2] !== undefined) {
          return this.C[resn][atom1][atom2];
        }
      }
    }
    return 0;
  }
}

class StructConn {
  public C: [[string,number,string,string],[string,number,string,string],number][] = []; //chain,resi,resn,atomn

  constructor(struct_conn) {
    if(struct_conn) {
      const types = struct_conn.getField('conn_type_id');
      const chain1 = struct_conn.getField('ptnr1_label_asym_id');
      const resi1 = struct_conn.getField('ptnr1_label_seq_id');
      const resn1 = struct_conn.getField('ptnr1_label_comp_id');
      const a1 = struct_conn.getField('ptnr1_label_atom_id');
      const chain2 = struct_conn.getField('ptnr2_label_asym_id');
      const resi2 = struct_conn.getField('ptnr2_label_seq_id');
      const resn2 = struct_conn.getField('ptnr2_label_comp_id');
      const a2 = struct_conn.getField('ptnr2_label_atom_id');
      const bo = struct_conn.getField('pdbx_value_order');

      for(let i = 0; i < types.length; i++) {
        if(types[i] == 'disulf' || types[i] == 'covale') { //metal too?
          const o = bo ? (bo[i] == "" ? 1: parseInt(bo[i])) : 1;
          this.C.push([[chain1[i],resi1[i],resn1[i],a1[i]],[chain2[i],resi2[i],resn2[i],a2[i]],o]);
        }
      }

    }
  }
}

class Residues {
  R: Record<string, Record<number, Record<string, Array<AtomSpec>>>> = {}; //chain, resid, resn (redundant), atom list
  constructor() {

  }

  add(a: AtomSpec) {
    if (this.R[a.lchain] == undefined) this.R[a.lchain] = {};
    if (this.R[a.lchain][a.lresi] == undefined) this.R[a.lchain][a.lresi] = {};
    if (this.R[a.lchain][a.lresi][a.lresn] == undefined) this.R[a.lchain][a.lresi][a.lresn] = [];
    this.R[a.lchain][a.lresi][a.lresn].push(a);
    this.R[a.lchain][a.lresi][a.lresn][a.atom] = a; //look up by atom name
  }

  private geta([ch,resi,resn,aname]: [string,number,string,string]) {
    if(this.R[ch] !== undefined &&
      this.R[ch][resi] !== undefined &&
      this.R[ch][resi][resn] !== undefined) {
        return this.R[ch][resi][resn][aname];
      }
    return undefined;
  }

  setBonds(C: Connectivity, SC: StructConn) {
    for(const ch in this.R) {
      for(const resi in this.R[ch]) {
        for(const resn in this.R[ch][resi]) {
          const atoms = this.R[ch][resi][resn];
          for(let i = 0; i < atoms.length; i++) {
            for(let j = i+1; j < atoms.length; j++) {
              const a1 = atoms[i];
              const a2 = atoms[j];
              let bo = C.order(resn,a1.atom,a2.atom);
              if(a1.altLoc != a2.altLoc && a1.altLoc != "" && a2.altLoc != "") {
                bo = 0; 
              }
              if(bo > 0) {
                a1.bonds.push(a2.index);
                a2.bonds.push(a1.index);
                a1.bondOrder.push(bo);
                a2.bondOrder.push(bo);
              }
            }
          }
        }
      }
    }

    for(const conn of SC.C) {
      const a1 = conn[0];
      const a2 = conn[1];
      const bo = conn[2];
      const atom1 = this.geta(a1);
      const atom2 = this.geta(a2);
      if(atom1 != undefined && atom2 != undefined) {
        atom1.bonds.push(atom2.index);
        atom2.bonds.push(atom1.index);
        atom1.bondOrder.push(bo);
        atom2.bondOrder.push(bo);      
      }
    }

  }
}


/** 
 * @param bindata - binary UInt8Array buffer or a base64 encoded string
 * @param ParserOptionsSpec
 * @category Parsers
*/
export function DataParserTs(bindata: any, options: ParserConfig) {

  const noH = !options.keepH; // suppress hydrogens by default
  const selAltLoc = options.altLoc ? options.altLoc : 'A'; //default alternate location to select if present
  const computeStruct = !options.noComputeSecondaryStructure;
  const noAssembly = !options.doAssembly; // don't assemble by default
  const assignbonds =
    options.assignBonds === undefined ? true : options.assignBonds;

  if (typeof (bindata) == "string") {
    try {
      bindata = base64ToArray(bindata);
    } catch (error) {
      const encoder = new TextEncoder();
      bindata = encoder.encode(bindata);
    }
  } else {
    bindata = new Uint8Array(bindata);
  }

  let bcifData = MMTF.decodeMsgpack(bindata);
  if (bcifData == 31) {
    bindata = inflateString(bindata, false);
    bcifData = MMTF.decodeMsgpack(bindata);
  }

  const atoms: any[][] & Record<string, any> = [];
  const modelData: any[] = atoms.modelData = [];


  let numModels = bcifData.dataBlocks.length;
  if (numModels == 0) return atoms;
  if (!options.multimodel) numModels = 1; //first only



  for (let m = 0; m < numModels; m++) {
    const startm = atoms.length;
    const serialToIndex: [number, number][] = [];
    modelData.push({ symmetries: [] });
    atoms.push([]);

    const block = bcifData.dataBlocks[m];
    const cats = Object.create(null);
    for (const cat of block.categories) {
      cats[cat.name.substr(1)] = Category(cat);
    }


    const sslookup = {}; //chain to residue range
    const sshelix = cats.struct_conf;
    if (sshelix) {
      const htypes = sshelix.getField('conf_type_id');
      const hchain = sshelix.getField('beg_label_asym_id');
      const hstart = sshelix.getField('beg_label_seq_id');
      const hend = sshelix.getField('end_label_seq_id');

      for (let i = 0; i < htypes.length; i++) {
        if (htypes[i].startsWith('H')) {
          const ch = hchain[i];
          const startResi = hstart[i];
          const endResi = hend[i];
          if (!(ch in sslookup)) {
            sslookup[ch] = {};
          }
          sslookup[ch][startResi] = "h1";
          for (let res = startResi + 1; res < endResi; res++) {
            sslookup[ch][res] = "h";
          }
          sslookup[ch][endResi] = "h2";
        }
      }
    }

    const sssheet = cats.struct_sheet_range;
    if (sssheet) {
      const sids = sssheet.getField('id');
      const schain = sssheet.getField('beg_label_asym_id');
      const sstart = sssheet.getField('beg_label_seq_id');
      const send = sssheet.getField('end_label_seq_id');

      for (let i = 0; i < sids.length; i++) {
        const ch = schain[i];
        const startResi = sstart[i];
        const endResi = send[i];
        if (!(ch in sslookup)) {
          sslookup[ch] = {};
        }
        sslookup[ch][startResi] = "s1";
        for (let res = startResi + 1; res < endResi; res++) {
          sslookup[ch][res] = "s";
        }
        sslookup[ch][endResi] = "s2";

      }
    }

    const structops = cats.pdbx_struct_oper_list;
    const opids = structops.getField('id');
    if (opids && !noAssembly) {
      const matrix11 = structops.getField('matrix[1][1]');
      const matrix12 = structops.getField('matrix[1][2]');
      const matrix13 = structops.getField('matrix[1][3]');
      const matrix21 = structops.getField('matrix[2][1]');
      const matrix22 = structops.getField('matrix[2][2]');
      const matrix23 = structops.getField('matrix[2][3]');
      const matrix31 = structops.getField('matrix[3][1]');
      const matrix32 = structops.getField('matrix[3][2]');
      const matrix33 = structops.getField('matrix[3][3]');
      const vector1 = structops.getField('vector[1]');
      const vector2 = structops.getField('vector[2]');
      const vector3 = structops.getField('vector[3]');

      for (let i = 0; i < opids.length; i++) {
        const matrix = new Matrix4(
          matrix11[i],
          matrix12[i],
          matrix13[i],
          vector1[i],
          matrix21[i],
          matrix22[i],
          matrix23[i],
          vector2[i],
          matrix31[i],
          matrix32[i],
          matrix33[i],
          vector3[i]
        );
        modelData[modelData.length - 1].symmetries.push(matrix);
      }
    }

    const connect = new Connectivity(cats.chem_comp_bond);
    let residues = new Residues();
    const sconnect = new StructConn(cats.struct_conn);

    const asites = cats.atom_site;
    const atomCount = asites.rowCount;
    const group_pdb = asites.getField('group_PDB')
    const cartn_x = asites.getField('Cartn_x');
    const cartn_y = asites.getField('Cartn_y');
    const cartn_z = asites.getField('Cartn_z');
    const auth_asym_id = asites.getField('auth_asym_id');
    const label_asym_id = asites.getField('label_asym_id');
    const auth_seq_id = asites.getField('auth_seq_id');
    const label_seq_id = asites.getField('label_seq_id');
    const auth_comp_id = asites.getField('auth_comp_id');
    const label_comp_id = asites.getField('label_comp_id');
    const auth_atom_id = asites.getField('auth_atom_id');
    const label_atom_id = asites.getField('label_atom_id');
    const type_symbol = asites.getField('type_symbol');
    const bfactors = asites.getField("B_iso_or_equiv");
    const serials = asites.getField('id');
    const icodes = asites.getField('label_alt_id');
    const modelnums = asites.getField('pdbx_PDB_model_num');
    let curmodel = modelnums ? modelnums[0] : 0;

    for (let i = 0; i < atomCount; i++) {
      if (group_pdb !== undefined &&
        group_pdb[i] === "TER"
      )
        continue;

      if (modelnums && modelnums[i] != curmodel) {
        curmodel = modelnums[i];
        if (options.multimodel) {
          if (!options.onemol) {
            atoms.push([]);
            modelData.push(modelData[modelData.length - 1]);
            curmodel = modelnums[i];
            residues.setBonds(connect, sconnect);
            residues = new Residues();
          }
        } else {
          break;
        }
      }

      const atom: AtomSpec = {};
      atom.x = cartn_x[i];
      atom.y = cartn_y[i];
      atom.z = cartn_z[i];

      atom.chain = auth_asym_id
        ? auth_asym_id[i]
        : label_asym_id
          ? label_asym_id[i]
          : undefined;
      atom.lchain = label_asym_id
        ? label_asym_id[i]
        : undefined;
      atom.resi = auth_seq_id
        ? auth_seq_id[i]
        : label_seq_id
          ? label_seq_id[i]
          : undefined;
      atom.lresi = label_seq_id
        ? label_seq_id[i]
        : undefined;
      atom.resn = auth_comp_id
        ? auth_comp_id[i].trim()
        : label_comp_id
          ? label_comp_id[i].trim()
          : undefined;
      atom.lresn = label_comp_id ? label_comp_id[i].trim() : undefined;
      atom.atom = auth_atom_id
        ? auth_atom_id[i].replace(/"/gm, "")
        : label_atom_id
          ? label_atom_id[i].replace(/"/gm, "")
          : undefined;

      atom.icode = icodes ? icodes[i] : undefined;
      atom.altLoc = atom.icode;
      atom.hetflag =
        !group_pdb ||
        group_pdb[i] === "HETA" ||
        group_pdb[i] === "HETATM";
      let elem = "X";
      if (type_symbol) {
        elem = type_symbol[i].replace(/\(?\+?\d+.*/, "");
      }

      atom.elem = elem[0].toUpperCase() + elem.substring(1, 2).toLowerCase();
      if (bfactors) atom.b = bfactors[i];

      if (noH && atom.elem == 'H') {
        continue;
      }
      if (atom.altLoc != '' && atom.altLoc != selAltLoc && selAltLoc != '*') {
        continue;
      }

      atom.bonds = [];
      atom.ss = "c";
      atom.serial = serials[i];
      atom.model = curmodel;
      atom.bondOrder = [];
      atom.properties = {};
      atom.index = atoms[atoms.length - 1].length;
      serialToIndex[atom.serial] = [atoms.length, atom.index];
      atoms[atoms.length - 1].push(atom);
      residues.add(atom);

    }

    residues.setBonds(connect, sconnect);
    if (!isEmpty(sslookup)) {
      for (let mi = startm; mi < atoms.length; mi++) {
        const matoms = atoms[mi];
        for (let i = 0; i < matoms.length; i++) {
          const atom = matoms[i];
          if (atom === undefined) continue;
          if (atom.lchain in sslookup && atom.lresi in sslookup[atom.lchain]) {
            const code = sslookup[atom.lchain][atom.lresi];
            atom.ss = code[0];
            if (code.length > 1) {
              if (code[1] == "1") atom.ssbegin = true;
              else if (code[1] == "2") atom.ssend = true;
            }
          }
        }
      }
    }

    if (options.multimodel && m < numModels - 1) {
      if (!options.onemol) {
        atoms.push([]);
        modelData.push({ symmetries: [] });
      }
    }
  }

  for (let i = 0; i < atoms.length; i++) {
    if (
      assignbonds &&
      !(options.duplicateAssemblyAtoms && !options.dontConnectDuplicatedAtoms)
    ) {
      assignPDBBonds(atoms[i], options);
    }

    if (computeStruct) {
      computeSecondaryStructure(atoms[i], options.hbondCutoff);
    }

    processSymmetries(
      modelData[i].symmetries,
      atoms[i],
      options,
      modelData[i].cryst
    );
    if (
      options.duplicateAssemblyAtoms &&
      !options.dontConnectDuplicatedAtoms &&
      assignbonds
    )
      assignPDBBonds(atoms[i], options);
  }
  return atoms;

};