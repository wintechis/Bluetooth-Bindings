import {ContentCodec} from '@node-wot/core';
import {DataSchema, DataSchemaValue} from 'wot-typescript-definitions';
const UriTemplate = require('uritemplate');

export class BLEBinaryCodec implements ContentCodec {
  getMediaType(): string {
    return 'application/x.ble-octet-stream';
  }

  // Convert bytes to specified value
  bytesToValue(
    bytes: Buffer,
    schema: DataSchema,
    parameters?: {[key: string]: string}
  ): DataSchemaValue {
    let parsed;

    if (schema.type == 'integer') {
      parsed = byte2int(schema, bytes);
    }

    if (schema.type == 'string') {
      parsed = byte2string(schema, bytes);
    }
    return parsed;
  }

  // Convert value to bytes
  valueToBytes(
    dataValue: any,
    schema: DataSchema,
    parameters?: {[key: string]: string}
  ): Buffer {
    let buf: any;
    let hexString: string;

    // Check if pattern is provieded and fill in
    if (typeof schema['bt:pattern'] != 'undefined') {
      // String Pattern
      if (schema.type == 'string') {
        hexString = fillStringPattern(schema, dataValue);
        buf = string2byte(schema, hexString);
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
          buf = string2byte(schema, dataValue);
          break;
      }
    }
    return buf;
  }
}

/**
 * Converts bytes to integer.
 * @param {DataSchema} schema schema of executed property, action or event.
 * @param {Buffer} bytes received byte value.
 * @return {Integer} converted byte value.
 */
function byte2int(schema: DataSchema, bytes: Buffer) {
  const bytelength = schema['bt:bytelength'];
  const signed = schema['bt:signed'];
  const byteOrder = schema['bt:byteOrder'] || "little"; 

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

/**
 * Converts integer to bytes.
 * @param {DataSchema} schema schema of executed property, action or event.
 * @param {Buffer} bytes received byte value.
 * @return {Integer} converted byte value.
 */
function int2byte(schema: DataSchema, dataValue: number) {
  const bytelength = schema['bt:bytelength'];
  const signed = schema['bt:signed'];
  const byteOrder = schema['bt:byteOrder'] || "little"; 
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

  // Apply scale
  dataValue = dataValue * scale;

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
function fillStringPattern(schema: DataSchema, dataValue: any) {
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

// Convert string to buffer
function string2byte(schema: DataSchema, dataValue: string) {
  let buf;
  if (typeof schema.format == 'undefined') {
    buf = Buffer.from(dataValue, 'utf-8');
  } else if (schema.format == 'hex') {
    buf = Buffer.from(dataValue, 'hex');
  }
  return buf;
}

function byte2string(schema: DataSchema, bytes: Buffer) {
  let value;
  if (typeof schema.format == 'undefined') {
    value = bytes.toString('utf-8');
  } else if (schema.format == 'hex') {
    value = bytes.toString('hex');
  }
  return value;
}
// TODO
// scale?
// readpattern
