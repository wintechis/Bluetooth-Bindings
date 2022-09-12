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

    else if (schema.type == 'string') {
      parsed = byte2string(schema, bytes);
    }

    // Used if scale leads to float number, instead of int
    else if (schema.type == "number"){
      parsed = byte2int(schema, bytes);
    } else{
      throw new Error('Datatype not supported by codec');
    }
    return parsed;
  }

  // Convert value to bytes
  valueToBytes(
    dataValue: any,
    schema: DataSchema,
    parameters?: {[key: string]: string}
  ): Buffer {
    let buf: Buffer;
    let hexString: string;

    // Check if pattern is provieded and fill in
    if (typeof schema['bdo:pattern'] != 'undefined') {
      // String Pattern
      if (schema.type == 'string') {
        hexString = fillStringPattern(schema, dataValue);
        buf = string2byte(schema, hexString);
      }

      //console.log('[CODEC]', 'Codec generated value:', hexString);
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
  const bytelength = schema['bdo:bytelength'];
  const signed = schema['bdo:signed'] || false;
  const byteOrder = schema['bdo:byteOrder'] || 'little';
  const scale = schema['bdo:scale'] || 1;
  const offset = schema['bdo:offset'] || 0;
  
  if (typeof bytelength == 'undefined') {
    throw new Error('Not all parameters are provided!');
  }

  let parsed: number;

  if (byteOrder == 'little') {
    if (signed) {
      parsed = bytes.readIntLE(offset, bytelength);
    } else {
      parsed = bytes.readUIntLE(offset, bytelength);
    }
  } else if (byteOrder == 'big') {
    if (signed) {
      parsed = bytes.readIntBE(offset, bytelength);
    } else {
      parsed = bytes.readUIntBE(offset, bytelength);
    }
  }

  parsed = parsed * scale;

  return parsed;
}

/**
 * Converts integer to bytes.
 * @param {DataSchema} schema schema of executed property, action or event.
 * @param {Buffer} bytes received byte value.
 * @return {Integer} converted byte value.
 */
function int2byte(schema: DataSchema, dataValue: number) {
  const bytelength = schema['bdo:bytelength'];
  const signed = schema['bdo:signed'] || false;
  const byteOrder = schema['bdo:byteOrder'] || 'little';
  const scale = schema['bdo:scale'] || 1;
  const offset = schema['bdo:offset'] || 0;

  if (typeof bytelength == 'undefined') {
    throw new Error('Not all parameters are provided!');
  }

  // Apply scale
  dataValue = dataValue * scale;

  let buf = Buffer.alloc(bytelength);
  if (byteOrder == 'little') {
    if (signed) {
      buf.writeIntLE(dataValue, offset, bytelength);
    } else {
      buf.writeUIntLE(dataValue, offset, bytelength);
    }
  } else if (byteOrder == 'big') {
    if (signed) {
      buf.writeIntBE(dataValue, offset, bytelength);
    } else {
      buf.writeUIntBE(dataValue, offset, bytelength);
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
  for ([key, params] of Object.entries(schema['bdo:variables'])) {
    // Convert integer values to hex string
    if (params.type == 'integer') {
      let buf = int2byte(params, dataValue[key]);
      // Convert Buffer back to hex
      dataValue[key] = buf.toString('hex');
    }
  }

  //Fill in pattern
  const template = UriTemplate.parse(schema['bdo:pattern']);
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

// Convert buffer to string
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
