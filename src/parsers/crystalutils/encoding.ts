export type TypedIntArray = Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array
export type TypedFloatArray = Float32Array | Float64Array
export const VERSION = '0.3.0';
export type Encoding =
    | Encoding.ByteArray
    | Encoding.FixedPoint
    | Encoding.RunLength
    | Encoding.Delta
    | Encoding.IntervalQuantization
    | Encoding.IntegerPacking
    | Encoding.StringArray;
export interface EncodedDataBlock {
    header: string,
    categories: EncodedCategory[],
}
export interface EncodedCategory {
    name: string,
    rowCount: number,
    columns: EncodedColumn[],
}
export interface EncodedColumn {
    name: string,
    data: EncodedData,
    mask?: EncodedData
}
export interface EncodedData {
    encoding: Encoding[],
    data: Uint8Array
}
export namespace Encoding {
    export enum IntDataType {
        Int8 = 1,
        Int16 = 2,
        Int32 = 3,
        Uint8 = 4,
        Uint16 = 5,
        Uint32 = 6,
    }
    export enum FloatDataType {
        Float32 = 32,
        Float64 = 33
    }
    export type DataType = IntDataType | FloatDataType
    export function getDataType(data: TypedIntArray | TypedFloatArray): DataType {
        let srcType: DataType;
        if (data instanceof Int8Array) srcType = Encoding.IntDataType.Int8;
        else if (data instanceof Int16Array) srcType = Encoding.IntDataType.Int16;
        else if (data instanceof Int32Array) srcType = Encoding.IntDataType.Int32;
        else if (data instanceof Uint8Array) srcType = Encoding.IntDataType.Uint8;
        else if (data instanceof Uint16Array) srcType = Encoding.IntDataType.Uint16;
        else if (data instanceof Uint32Array) srcType = Encoding.IntDataType.Uint32;
        else if (data instanceof Float32Array) srcType = Encoding.FloatDataType.Float32;
        else if (data instanceof Float64Array) srcType = Encoding.FloatDataType.Float64;
        else srcType = Encoding.IntDataType.Int32; 
        return srcType;
    }
    export function isSignedIntegerDataType(data: TypedIntArray) {
        if (data instanceof Int8Array || data instanceof Int16Array || data instanceof Int32Array) return true;
        for (let i = 0, _i = data.length; i < _i; i++) {
            if (i < 0) return false;
        }
        return true;
    }
    export interface ByteArray {
        kind: 'ByteArray',
        type: DataType
    }
    export interface FixedPoint {
        kind: 'FixedPoint',
        factor: number,
        srcType: FloatDataType
    }
    export interface IntervalQuantization {
        kind: 'IntervalQuantization',
        min: number,
        max: number,
        numSteps: number,
        srcType: FloatDataType
    }
    export interface RunLength {
        kind: 'RunLength',
        srcType: IntDataType,
        srcSize: number
    }
    export interface Delta {
        kind: 'Delta',
        origin: number,
        srcType: IntDataType
    }
    export interface IntegerPacking {
        kind: 'IntegerPacking',
        byteCount: number,
        isUnsigned: boolean,
        srcSize: number
    }
    export interface StringArray {
        kind: 'StringArray',
        dataEncoding: Encoding[],
        stringData: string,
        offsetEncoding: Encoding[],
        offsets: Uint8Array
    }
}
