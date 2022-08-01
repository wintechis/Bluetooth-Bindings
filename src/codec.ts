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

    if (schema.byteOrder == "little") {
      switch (schema.dataFormat) {
        case "int8":
          parsed = bytes.readInt8();
          break;
        case "int16":
          parsed = bytes.readInt16LE();
          break;
        case "int32":
          parsed = bytes.readInt32LE();
          break;
        case "uint8":
          parsed = bytes.readUInt8();
          break;
        case "uint16":
          parsed = bytes.readUInt16LE();
          break;
        case "uint32":
          parsed = bytes.readUInt32LE();
          break;
      }
    } else if (schema.byteOrder == "big") {
      switch (schema.dataFormat) {
        case "int8":
          parsed = bytes.readInt8();
          break;
        case "int16":
          parsed = bytes.readInt16BE();
          break;
        case "int32":
          parsed = bytes.readInt32BE();
          break;
        case "uint8":
          parsed = bytes.readUInt8();
          break;
        case "uint16":
          parsed = bytes.readUInt16BE();
          break;
        case "uint32":
          parsed = bytes.readUInt32BE();
          break;
      }
    } else {
      throw new Error("Byteorder not availavle! Select 'big' or 'little'.");
    }

    return parsed;
  }

  valueToBytes(
    dataValue: unknown,
    schema: DataSchema,
    parameters?: { [key: string]: string }
  ): Buffer {
    console.log(
      "valueToBytes:\n with dataValue:" +
        dataValue +
        "\nschema:" +
        schema +
        "\nparameters:" +
        parameters
    );

    let body = "20";

    return Buffer.from(body, "utf-8");
  }
}
