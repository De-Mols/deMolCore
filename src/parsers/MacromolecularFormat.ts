import { base64ToArray } from "../utilities";
import { Matrix4 } from "../WebGL";
import { ParserConfig } from "./ParserConfig";
import { computeSecondaryStructure } from "./utils/computeSecondaryStructure";
import { processSymmetries } from "./utils/processSymmetries";

export interface MMTFobj {
    decode(data: Uint8Array | ArrayBuffer): any;
    decodeMsgpack(data: Uint8Array | ArrayBuffer): any;
}
declare let MacromolecularFormat: MMTFobj;

const fromCharCode = function (charCodeArray: any) {
    return String.fromCharCode.apply(null, charCodeArray).replace(/\0/g, '');
};

const convertSS = function (val: number | boolean) {
    if (val == 0 || val == 2 || val == 4) return 'h';
    if (val == 3) return 's';
    return 'c';
};

const mmtfHETATMtypes = new Set([
    "D-SACCHARIDE",
    "D-SACCHARIDE 1,4 AND 1,4 LINKING",
    "D-SACCHARIDE 1,4 AND 1,6 LINKING",
    "L-SACCHARIDE",
    "L-SACCHARIDE 1,4 AND 1,4 LINKING",
    "L-SACCHARIDE 1,4 AND 1,6 LINKING",
    "NON-POLYMER",
    "OTHER",
    "PEPTIDE-LIKE",
    "SACCHARIDE"]);

/** 
 * @param bindata - binary UInt8Array buffer or a base64 encoded string
 * @param ParserOptionsSpec
 * @category Parsers
*/
export function MMTFparser(bindata: any, options: ParserConfig) {

    const noH = !options.keepH;
    const selAltLoc = options.altLoc ? options.altLoc : 'A';
    const ignoreStruct = !!options.noSecondaryStructure;
    const computeStruct = !options.noComputeSecondaryStructure;
    const noAssembly = !options.doAssembly; // don't assemble by default
    const assemblyIndex = options.assemblyIndex ? options.assemblyIndex : 0;

    if (typeof (bindata) == "string") {
        bindata = base64ToArray(bindata);
    } else {
        bindata = new Uint8Array(bindata);
    }

    const mmtfData = MacromolecularFormat.decode(bindata);

    const atoms: any[][] & Record<string, any> = [[]];
    const modelData: any[] = atoms.modelData = [];

    let chainIndex = 0;
    let groupIndex = 0;
    let atomIndex = 0;

    const secStructList = mmtfData.secStructList;
    const bFactorList = mmtfData.bFactorList;
    const altLocList = mmtfData.altLocList;
    const occupancyList = mmtfData.occupancyList;
    const bondAtomList = mmtfData.bondAtomList;
    const bondOrderList = mmtfData.bondOrderList;

    let numModels = mmtfData.numModels;
    if (numModels == 0) return atoms;
    if (!options.multimodel) numModels = 1; //first only
    let i: number, j: number, k: number, kl: number, m: number, n: number;



    const symmetries: Matrix4[] = [];
    if (!noAssembly && mmtfData.bioAssemblyList && mmtfData.bioAssemblyList.length > 0) {
        const transforms = mmtfData.bioAssemblyList[assemblyIndex].transformList;
        for (i = 0, n = transforms.length; i < n; i++) {
            const matrix = new Matrix4(transforms[i].matrix);
            matrix.transpose();
            symmetries.push(matrix);
        }
    }
    let unitCell = null as Record<string, number> | null;
    if (mmtfData.unitCell) {
        const u = mmtfData.unitCell;
        unitCell = { 'a': u[0], 'b': u[1], 'c': u[2], 'alpha': u[3], 'beta': u[4], 'gamma': u[5] };
    }

    const chainIsPolymer: boolean[] = [];
    mmtfData.entityList.forEach((entity: { chainIndexList: any[]; type: string; }) => {
        entity.chainIndexList.forEach(ch => {
            chainIsPolymer[ch] = entity.type == "polymer";
        });
    });
    let bondAtomListStart = 0;
    for (m = 0; m < numModels; m++) {
        const modelChainCount = mmtfData.chainsPerModel[m];
        const matoms = atoms[atoms.length - 1];
        const serialToIndex: number[] = [];

        modelData.push({ symmetries: symmetries, cryst: unitCell });
        for (i = 0; i < modelChainCount; ++i) {

            const chainGroupCount = mmtfData.groupsPerChain[chainIndex];
            let chainId = fromCharCode(
                mmtfData.chainIdList.subarray(chainIndex * 4, chainIndex * 4 + 4)
            );
            if (mmtfData.chainNameList) {
                chainId = fromCharCode(
                    mmtfData.chainNameList.subarray(chainIndex * 4, chainIndex * 4 + 4)
                );
            }

            const startGroup = groupIndex;
            let prevSS = '';
            for (j = 0; j < chainGroupCount; ++j) {

                const groupData = mmtfData.groupList[mmtfData.groupTypeList[groupIndex]];
                const groupAtomCount = groupData.atomNameList.length;
                let secStruct = 0;
                let secStructBegin = false;
                let secStructEnd = false;

                if (secStructList) {
                    secStruct = secStructList[groupIndex];
                    const sscode = convertSS(secStruct);
                    if (groupIndex == 0 || sscode != prevSS) {
                        secStructBegin = true;
                    }
                    prevSS = sscode;
                    const nextgroup = groupIndex + 1;
                    if (nextgroup >= secStructList.length || convertSS(secStructList[nextgroup] != sscode)) {
                        secStructEnd = true;
                    }
                }
                const groupId = mmtfData.groupIdList[groupIndex];
                const groupName = groupData.groupName;
                const groupType = groupData.chemCompType;
                const startAtom = atomIndex;
                const isHETATM = mmtfHETATMtypes.has(groupType) || !chainIsPolymer[chainIndex];

                for (k = 0; k < groupAtomCount; ++k) {

                    const element = groupData.elementList[k];
                    if (noH && element == 'H') {
                        atomIndex += 1;
                        continue;
                    }

                    let bFactor = '';
                    if (bFactorList) {
                        bFactor = bFactorList[atomIndex];
                    }
                    let altLoc = '';
                    if (altLocList && altLocList[atomIndex]) { //not zero
                        altLoc = String.fromCharCode(altLocList[atomIndex]);
                    }
                    let occupancy = '';
                    if (occupancyList) {
                        occupancy = occupancyList[atomIndex];
                    }

                    if (altLoc != '' && altLoc != selAltLoc && selAltLoc != '*') {
                        atomIndex += 1;
                        continue;
                    }

                    const atomId = mmtfData.atomIdList[atomIndex];
                    const atomName = groupData.atomNameList[k];
                    let atomCharge = 0;
                    if (groupData.atomChargeList) atomCharge = groupData.atomChargeList[k];
                    const xCoord = mmtfData.xCoordList[atomIndex];
                    const yCoord = mmtfData.yCoordList[atomIndex];
                    const zCoord = mmtfData.zCoordList[atomIndex];

                    serialToIndex[atomIndex] = matoms.length;
                    matoms.push({
                        'resn': groupName,
                        'x': xCoord,
                        'y': yCoord,
                        'z': zCoord,
                        'elem': element,
                        'hetflag': isHETATM,
                        'chain': chainId,
                        'resi': groupId,
                        'icode': altLoc,
                        'rescode': groupId + (altLoc != ' ' ? "^" + altLoc : ""), // combo
                        'serial': atomId,
                        'altLoc': altLoc,
                        'index': atomIndex,
                        'atom': atomName,
                        'bonds': [],
                        'ss': convertSS(secStruct),
                        'ssbegin': secStructBegin,
                        'ssend': secStructEnd,
                        'bondOrder': [],
                        'properties': { charge: atomCharge, occupancy: occupancy },
                        'b': bFactor,
                    });

                    atomIndex += 1;
                }

                const groupBondAtomList = groupData.bondAtomList;
                for (k = 0, kl = groupData.bondOrderList.length; k < kl; ++k) {
                    const atomIndex1 = startAtom + groupBondAtomList[k * 2];
                    const atomIndex2 = startAtom + groupBondAtomList[k * 2 + 1];
                    const bondOrder = groupData.bondOrderList[k];

                    const i1 = serialToIndex[atomIndex1];
                    const i2 = serialToIndex[atomIndex2];
                    const a1 = matoms[i1];
                    const a2 = matoms[i2];
                    if (a1 && a2) {
                        a1.bonds.push(i2);
                        a1.bondOrder.push(bondOrder);
                        a2.bonds.push(i1);
                        a2.bondOrder.push(bondOrder);
                    }
                }

                groupIndex += 1;
            }

            groupIndex = startGroup;
            for (j = 0; j < chainGroupCount; ++j) {

                groupIndex += 1;

            }

            chainIndex += 1;
        }


        if (bondAtomList) {
            for (let k = bondAtomListStart, kl = bondAtomList.length; k < kl; k += 2) {
                const atomIndex1 = bondAtomList[k];
                const atomIndex2 = bondAtomList[k + 1];
                const bondOrder = bondOrderList ? bondOrderList[k / 2] : 1;

                if (atomIndex1 >= atomIndex) {
                    bondAtomListStart = k;
                    break;
                }
                const i1 = serialToIndex[atomIndex1];
                const i2 = serialToIndex[atomIndex2];
                const a1 = matoms[i1];
                const a2 = matoms[i2];
                if (a1 && a2) {
                    a1.bonds.push(i2);
                    a1.bondOrder.push(bondOrder);
                    a2.bonds.push(i1);
                    a2.bondOrder.push(bondOrder);
                }
            }
        }

        if (options.multimodel) {
            if (!options.onemol) atoms.push([]);
        }
    }

    if (!noAssembly) {
        for (let n = 0; n < atoms.length; n++) {
            processSymmetries(modelData[n].symmetries, atoms[n], options, modelData[n].cryst);
        }
    }

    if (computeStruct && !ignoreStruct) {
        computeSecondaryStructure(atoms as any, options.hbondCutoff);
    }

    return atoms;
};