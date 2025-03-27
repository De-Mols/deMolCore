import { ParserConfig } from './ParserConfig';
import { DensityFormat } from "./DensityFormat";
import { LocationParser } from "./LocationParser";
import { CoordinatesFormat } from "./CoordinatesFormat";
import { StructureDataFormat } from "./StructureDataFormat";
import { StructureParser } from "./StructureParser";
import { ChargeParser } from "./ChargeParser";
import { MoleculeFormat } from "./MoleculeFormat";
import { ProteinFormat } from "./ProteinFormat";
import { ChargedProteinFormat } from "./ChargedProteinFormat";
import { MMTFparser } from "./MacromolecularFormat";
import { TopologyFormat } from "./TopologyFormat";
import { PositionParser } from "./PositionParser";
import { TrajectoryFormat } from "./TrajectoryFormat";
import {DataParserTs} from "./DataParser.ts";

export { bondLength, setBondLength } from './utils/bondLength';

export const Parsers = {
  vasp: DensityFormat,
  VASP: DensityFormat,
  cube: LocationParser,
  CUBE: LocationParser,
  xyz: CoordinatesFormat,
  XYZ: CoordinatesFormat,
  sdf: StructureDataFormat,
  SDF: StructureDataFormat,
  json: StructureParser,
  cdjson: StructureParser,
  CDJSON: StructureParser,
  mcif: ChargeParser,
  cif: ChargeParser,
  CIF: ChargeParser,
  mol2: MoleculeFormat,
  MOL2: MoleculeFormat,
  pdb: ProteinFormat,
  PDB: ProteinFormat,
  pdbqt: ProteinFormat,
  PDBQT: ProteinFormat,
  pqr: ChargedProteinFormat,
  PQR: ChargedProteinFormat,
  mmtf:MMTFparser, //need to avoid name collision
  MMTF:MMTFparser,
  prmtop: TopologyFormat,
  PRMTOP: TopologyFormat,
  gro: PositionParser,
  GRO: PositionParser,
  lammpstrj: TrajectoryFormat,
  LAMMPSTRJ: TrajectoryFormat,
  bcif: DataParserTs,
  BCIF: DataParserTs
} as Record<string, (str: string, options: ParserConfig) => any>;
