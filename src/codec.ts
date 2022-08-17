import {ContentCodec} from '@node-wot/core';
import {DataSchema, DataSchemaValue} from 'wot-typescript-definitions';
const UriTemplate = require('uritemplate');

export class BLEBinaryCodec implements ContentCodec {
  getMediaType(): string {
    return 'application/x.ble-octet-stream';
  }

  bytesToValue(
    bytes: Buffer,
    schema: DataSchema,
    parameters?: {[key: string]: string}
  ): DataSchemaValue {
    let parsed;

    if (schema.type == 'integer') {
      parsed = byte2int(schema, bytes)
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
    let buf: any;
    let hexString: string;

    // Check if pattern is provieded and fill in
    if (typeof schema['bt:pattern'] != 'undefined') {
      // String Pattern:
      if (schema.type == 'string') {
        hexString = fillPattern(schema, dataValue);
        buf = string2byte(hexString);
      }

      console.log('[CODEC]', 'Codec generated value:', hexString);
    }
    // Else create buffer without pattern
    else {
      // Convert to specified type
      switch (schema.type) {
        case 'integer':
          buf = int2byte(schema, dataValue);
          break;
        case 'string':
          buf = string2byte(dataValue);
          break;
      }
    }
    return buf;
  }
}

function byte2int(schema: DataSchema, bytes: Buffer) {
  const bytelength = schema['bt:bytelength'];
  const signed = schema['bt:signed'];
  const byteOrder = schema['bt:byteOrder'];

  let parsed: number;

  if (byteOrder == 'little') {
    if (signed) {
      parsed = bytes.readIntLE(0, bytelength);
    } else {
      parsed = bytes.readUIntLE(0, bytelength);
    }
  } else if (byteOrder == 'big') {
    if (signed) {
      parsed = bytes.readIntBE(0, bytelength);
    } else {
      parsed = bytes.readUIntBE(0, bytelength);
    }
  }

  return parsed;
}

// Converts Integer to Buffer
// Needs bt:bytelength, bt:signed, bt:byteOrder
// Optional bt:scale
function int2byte(schema: DataSchema, dataValue: any) {
  const bytelength = schema['bt:bytelength'];
  const signed = schema['bt:signed'];
  const byteOrder = schema['bt:byteOrder'];
  let scale = schema['bt:scale'];

  if (
    typeof bytelength == 'undefined' ||
    typeof signed == 'undefined' ||
    typeof byteOrder == 'undefined'
  ) {
    throw new Error('Not all parameters are provided!');
  }

  // If scale not provided set to 1
  if (typeof scale == 'undefined') {
    scale = 1;
  }

  let buf = Buffer.alloc(bytelength);
  if (byteOrder == 'little') {
    if (signed) {
      buf.writeIntLE(dataValue, 0, bytelength);
    } else {
      buf.writeUIntLE(dataValue, 0, bytelength);
    }
  } else if (byteOrder == 'big') {
    if (signed) {
      buf.writeIntBE(dataValue, 0, bytelength);
    } else {
      buf.writeUIntBE(dataValue, 0, bytelength);
    }
  }

  return buf;
}

function readPattern() {}

// Function fills in the desired pattern
// return filled in hexString
function fillPattern(schema: DataSchema, dataValue: any) {
  let key: string;
  let params: any;

  // Iterate over provided parameters and convert to hex string
  for ([key, params] of Object.entries(schema['bt:variables'])) {
    // Convert integer values to hex string
    if (params.type == 'integer') {
      let buf = int2byte(params, dataValue[key]);
      // Convert Buffer back to hex
      dataValue[key] = buf.toString('hex');
    }
  }

  //Fill in pattern
  const template = UriTemplate.parse(schema['bt:pattern']);
  // replace dataValue object with filled in pattern
  dataValue = template.expand(dataValue);

  return dataValue;
}

function string2byte(dataValue: string) {
  return Buffer.from(dataValue, 'utf-8');
}
