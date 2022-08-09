import {ContentCodec} from '@node-wot/core';
import {DataSchema, DataSchemaValue} from 'wot-typescript-definitions';
const UriTemplate = require('uritemplate');

const handler_map: any = {
  int8: 'readInt',
  int12: 'readInt',
  int16: 'readInt',
  int24: 'readInt',
  int32: 'readInt',
  int48: 'readInt',
  int64: 'readInt',
  int128: 'readInt',
  uint2: 'readUInt',
  uint4: 'readUInt',
  uint8: 'readUInt',
  uint12: 'readUInt',
  uint16: 'readUInt',
  uint24: 'readUInt',
  uint32: 'readUInt',
  uint48: 'readUInt',
  uint64: 'readUInt',
  uint128: 'readUInt',
  float32: 'readFloat',
  float64: 'readFloat',
  stringUTF8: 'readUTF8',
  stringUTF16: 'readUTF16',
};

export class BLEBinaryCodec implements ContentCodec {
  getMediaType(): string {
    return 'application/ble+octet-stream';
  }

  bytesToValue(
    bytes: Buffer,
    schema: DataSchema,
    parameters?: {[key: string]: string}
  ): DataSchemaValue {
    let parsed;

    if (schema.type == 'integer') {
      const length = bytes.length/8;

      // Limit of JS
      if (length > 5){
        throw new Error("Integer is too big!");
      }

      if (schema.byteOrder == 'little') {
        if (schema.signed) {
          parsed = bytes.readIntLE(0, length);
        } else {
          parsed = bytes.readUIntLE(0, length);
        }
      } else if (schema.byteOrder == 'big') {
        if (schema.signed) {
          parsed = bytes.readIntBE(0, length);
        } else {
          parsed = bytes.readUIntBE(0, length);
        }
      } else {
        throw new Error("Byteorder not available! Select 'big' or 'little'.");
      }
    }
    if (schema.type == 'string') {
      parsed = bytes.toString();
    }

    return parsed;
  }

  valueToBytes(
    dataValue: any,
    schema: DataSchema,
    parameters?: {[key: string]: string}
  ): Buffer {
    let hexString;

    // Check if pattern is provieded
    if (typeof schema['bt:pattern'] != 'undefined') {
      // Check type of parameters
      let key: string;
      let params: any;
      for ([key, params] of Object.entries(schema['bt:variables'])) {
        switch (params.type) {
          case 'integer':
            // Convert to hex
            dataValue[key] = dataValue[key].toString(16);
            // Check if bytelength is provided
            if (params['bt:fixedByteLength']) {
              // Check if current byte length smaller than bt:fixedByteLength
              if (dataValue[key].length / 2 < params['bt:fixedByteLength']) {
                // Add 0 until fixed length is met
                while (
                  dataValue[key].length / 2 !=
                  params['bt:fixedByteLength']
                ) {
                  dataValue[key] = '0' + dataValue[key];
                }
              }
            }
            break;
          case 'string':
            // Do nothing in case of string
            break;
        }
      }

      //Fill in pattern
      const template = UriTemplate.parse(schema['bt:pattern']);
      // replace dataValue object with filled in pattern
      dataValue = template.expand(dataValue);

      console.log("[CODEC]",'Codec generated value:', dataValue);
    }

    // Convert to specified type
    switch (schema.type) {
      case 'integer':
        // Convert to hexstring
        hexString = dataValue.toString(16);
        break;
      case 'string':
        hexString = dataValue;
        break;
    }
    return Buffer.from(hexString, 'utf-8');
  }
}
