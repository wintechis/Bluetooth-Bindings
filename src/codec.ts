import { ContentCodec } from "@node-wot/core";
import { DataSchema, DataSchemaValue } from "wot-typescript-definitions";

const handler_map: any = {
  int8: "readInt",
  int12: "readInt",
  int16: "readInt",
  int24: "readInt",
  int32: "readInt",
  int48: "readInt",
  int64: "readInt",
  int128: "readInt",
  uint2: "readUInt",
  uint4: "readUInt",
  uint8: "readUInt",
  uint12: "readUInt",
  uint16: "readUInt",
  uint24: "readUInt",
  uint32: "readUInt",
  uint48: "readUInt",
  uint64: "readUInt",
  uint128: "readUInt",
  float32: "readFloat",
  float64: "readFloat",
  stringUTF8: "readUTF8",
  stringUTF16: "readUTF16",
};

export class BLEBinaryCodec implements ContentCodec {
  getMediaType(): string {
    return "application/ble+octet-stream";
  }

  bytesToValue(
    bytes: Buffer,
    schema: DataSchema,
    parameters?: { [key: string]: string }
  ): DataSchemaValue {
    let parsed;

    if (schema.type == "integer") {
      const length = bytes.length;

      if (schema.byteOrder == "little") {
        if (schema.signed) {
          parsed = bytes.readIntLE(0, length);
        } else {
          parsed = bytes.readUIntLE(0, length);
        }
      } else if (schema.byteOrder == "big") {
        if (schema.signed) {
          parsed = bytes.readIntBE(0, length);
        } else {
          parsed = bytes.readUIntBE(0, length);
        }
      } else {
        throw new Error("Byteorder not availavle! Select 'big' or 'little'.");
      }
    }
    if (schema.type == "string"){
      parsed = bytes.toString()
    }

    return parsed;
  }

  valueToBytes(
    dataValue: any,
    schema: DataSchema,
    parameters?: { [key: string]: string }
  ): Buffer {
    let hexString;
    
    switch (schema.type) {
      case "integer":
        // Convert to hexstring
        hexString = dataValue.toString(16);
        break;
      case "string":
        hexString = dataValue;
        break;
    }
    return Buffer.from(hexString, "utf-8");
  }
}
