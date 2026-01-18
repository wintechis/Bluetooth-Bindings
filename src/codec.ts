import { ContentCodec } from '@node-wot/core';
import { DataSchema, DataSchemaValue } from 'wot-typescript-definitions';
const UriTemplate = require('uritemplate');
import debug from 'debug';
import { buffer } from 'stream/consumers';

// Create a logger with a specific namespace
const log = debug('binding-Bluetooth');

export class BLEBinaryCodec implements ContentCodec {
  getMediaType(): string {
    return 'application/x.binary-data-stream';
  }

  // Convert bytes to specified value
  bytesToValue(
    bytes: Buffer,
    schema: DataSchema,
    parameters?: { [key: string]: string }
  ): DataSchemaValue {

    if (schema.type == 'object') {
      const objectKeys = Object.keys(schema.properties);

      const resultObject: any = {};

      // Iterate over all elements in object
      for (const key of objectKeys) {
        const localSchema = schema.properties[key];

        if (localSchema.type == 'integer' || localSchema.type == 'number') {
          const value = bit2Number(localSchema, bytes);
          resultObject[key] = value;

        } else if (localSchema.type == 'string') {
          const value = bit2String(localSchema, bytes);
          resultObject[key] = value;
        }
      }
      return resultObject;
    } else {
      if (schema.type == 'integer' || schema.type == 'number') {
        return bit2Number(schema, bytes);
      } else if (schema.type == 'string') {
        return bit2String(schema, bytes);
      } else {
        throw new Error('Datatype not supported by codec');
      }
    }
  }

  // Convert value to bytes
  valueToBytes(
    dataValue: any,
    schema: DataSchema,
    parameters?: { [key: string]: string }
  ): Buffer {
    log('Writing Value:', dataValue);
    let buf: any;
    let hexString: string;
    //console.log(schema);
    //console.log(dataValue);

    // Check if pattern is provieded and fill in
    if (typeof schema['bdo:pattern'] != 'undefined') {
      if (schema.type == 'integer') {
        const hexBuffer = int2byte(schema, dataValue);

        // Split buffer at "{"
        const splitPattern = schema['bdo:pattern'].split('{');
        if (splitPattern.length != 2) {
          throw new Error('To many placeholders for input type!');
        }

        const before = schema['bdo:pattern'].split('{')[0];
        const after = schema['bdo:pattern'].split('}')[1];

        const buf = Buffer.concat([
          hexToBuffer(before),
          hexBuffer,
          hexToBuffer(after),
        ]);

        return buf;
      }
      if (schema.type == 'object') {
        // If string Pattern is provided
        hexString = fillStringPattern(schema, dataValue);
        return hexToBuffer(hexString);
      }
    }
    // Else create buffer without pattern
    else {
      // Convert to specified type
      switch (schema.type) {
        case 'integer':
          buf = int2byte(schema, dataValue);
          break;
        case 'string':
          if (schema.format == 'hex') {
            buf = Buffer.from(dataValue, 'hex');
          } else {
            buf = string2byte(schema, dataValue);
          }
          break;
      }
    }
    return buf;
  }
}

function bit2Number(schema: DataSchema, bytes: Buffer) {
  const signed = schema['bdo:signed'] || false;
  const scale = schema['bdo:scale'] || 1;
  const valueAdd = schema['bdo:valueAdd'] || 0;

  // Prepare the buffer
  const newBuffer = sliceBuffer(schema, bytes)

  // Determine how many bytes we need to read
  const byteLength = newBuffer.length;
  const bitLength = byteLength * 8;

  let rawValue = 0;

  if (byteLength <= 6) {
    rawValue = newBuffer.readUIntBE(0, byteLength);
  } else {
    // Fallback for 64-bit (reads as BigInt then converts to Number, precision loss possible > 53 bits)
    rawValue = Number(newBuffer.readBigUInt64BE(0));
  }

  // Shift right by (TotalBitsInBytes - ActualBitLength)
  const shift = (byteLength * 8) - bitLength;

  rawValue = rawValue / Math.pow(2, shift);

  // Handle Signed Integers
  if (signed) {
    // Check if the MSB (Sign Bit) is 1
    const signBitMask = Math.pow(2, bitLength - 1);

    if (rawValue >= signBitMask) {
      // Calculate negative value: Value - (2^BitLength)
      rawValue = rawValue - Math.pow(2, bitLength);
    }
  }

  // Apply Scaling and Offset
  return (rawValue * scale) + valueAdd;
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

  const valueAdd = schema['bdo:valueAdd'] || 0;

  if (typeof bytelength == 'undefined') {
    throw new Error('Not all parameters are provided!');
  }

  let parsed: any;

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

  // Apply Addition
  parsed = parsed + valueAdd;

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

function readPattern(schema: DataSchema, bytes: Buffer) {
  // Get name of variables in template
  let template = schema['bdo:pattern'];
  let variables = schema['bdo:variables'];

  // Find Names and positions of variables
  let open_pos = [];
  let close_pos = [];
  for (let i = 0; i < template.length; i++) {
    if (template[i] == '{') {
      open_pos.push(i);
    }
    if (template[i] == '}') {
      close_pos.push(i);
    }
  }
  let variable_name_list = [];
  if (open_pos.length == close_pos.length) {
    for (let i = 0; i < open_pos.length; i++) {
      variable_name_list.push(
        template.substring(open_pos[i] + 1, close_pos[i])
      );
    }
  } else {
    throw Error('number of "{" not equal to "}" in pattern');
  }

  // replace variabel with actual length placeholder
  for (let i = 0; i < variable_name_list.length; i++) {
    let var_name = variable_name_list[i];
    let byteleng = variables[var_name]['bdo:bytelength'];
    template = template.replace(
      '{' + var_name + '}',
      '[' + 'X'.repeat((byteleng - 1) * 2) + ']'
    );
  }

  // Get start and end positions of relevant parts
  let start_vals = [];
  let stop_vals = [];
  for (let i = 0; i < template.length; i++) {
    if (template[i] == '[') {
      start_vals.push(i);
    }
    if (template[i] == ']') {
      stop_vals.push(i);
    }
  }

  // Slice Buffer
  let res = [];
  for (let i = 0; i < start_vals.length; i++) {
    res.push(bytes.subarray(start_vals[i] / 2, (stop_vals[i] + 1) / 2));
  }

  return [variable_name_list, res];
}

// Function fills in the desired pattern
// return filled in hexString
function fillStringPattern(schema: DataSchema, dataValue: any) {
  let key: string;
  let params: any;
  // Iterate over provided parameters and convert to hex string
  for ([key, params] of Object.entries(schema.properties)) {
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

function bit2String(schema: DataSchema, bytes: Buffer) {
  const bitOffset = schema['bdo:bitOffset'] || 0;
  const bitLength = schema['bdo:bitLength'];

  const newBuffer = sliceBits(bytes, bitOffset, bitLength);

  let value = "";
  if (typeof schema.format == 'undefined') {
    value = newBuffer.toString('utf-8');
  } else if (schema.format == 'hex') {
    value = newBuffer.toString('hex');
  }
  return value;
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

function hexToBuffer(hex: string) {
  return Buffer.from(hex, 'hex');
}

////////////////////////////////////////////
/**
 * Slices specific bits from a buffer, handling Endianness correctly.
 * Returns a new Buffer containing the isolated value, Right-Aligned (LSB).
 * 
 * @param buffer - Source buffer
 * @param bitOffset - Start bit position
 * @param bitLength - Length of bits to read
 * @param byteOrder - 'little' or 'big' (default 'big')
 */
function sliceBits(buffer: Buffer, bitOffset: number, bitLength: number, byteOrder: 'little' | 'big' = 'big'): Buffer {
  // 1. Determine the boundaries of the data in bytes
  const startByte = Math.floor(bitOffset / 8);
  const endBit = bitOffset + bitLength;
  const endByte = Math.ceil(endBit / 8);

  // 2. Read the raw bytes into a BigInt to handle shifting across boundaries
  // We use BigInt to ensure we don't lose precision on 64-bit integers
  let rawValue = 0n;
  const bytesToRead = endByte - startByte;

  if (byteOrder === 'little') {
    // Little Endian: Read bytes from LSB to MSB
    for (let i = 0; i < bytesToRead; i++) {
      const idx = startByte + i;
      if (idx < buffer.length) {
        rawValue |= BigInt(buffer[idx]) << BigInt(i * 8);
      }
    }
    // Shift away the bits before the offset (LSB side)
    const localBitOffset = BigInt(bitOffset % 8);
    rawValue = rawValue >> localBitOffset;
  } else {
    // Big Endian: Read bytes from MSB to LSB
    for (let i = 0; i < bytesToRead; i++) {
      const idx = startByte + i;
      if (idx < buffer.length) {
        rawValue = (rawValue << 8n) | BigInt(buffer[idx]);
      }
    }
    // Align BE: Calculate how many "unused" bits are at the right and shift them off
    const totalBitsRead = bytesToRead * 8;
    const bitsToShift = BigInt(totalBitsRead - (bitLength + (bitOffset % 8)));
    rawValue = rawValue >> bitsToShift;
  }

  // 3. Mask the value to ensure we only have the requested bitLength
  const mask = (1n << BigInt(bitLength)) - 1n;
  rawValue &= mask;

  // 4. Write the result into a new Buffer (Normalized to Big Endian)
  // We make the new buffer just large enough to hold the bits
  const resultBytes = Math.ceil(bitLength / 8);
  const resultBuffer = Buffer.alloc(resultBytes);

  // Write BigInt to Buffer (Big Endian allows standard readUIntBE later)
  for (let i = 0; i < resultBytes; i++) {
    // Extract the byte: (Value >> (8 * (Length - 1 - i))) & 0xFF
    const shift = BigInt((resultBytes - 1 - i) * 8);
    resultBuffer[i] = Number((rawValue >> shift) & 0xFFn);
  }

  return resultBuffer;
}


////////////////////////////////////////////////////7
type BitFragment = {
  bitOffset: number;
  bitLength: number;
  byteOrder?: 'little' | 'big';
};

function sliceFragmentedBits(buffer: Buffer, fragments: BitFragment[]): Buffer {
  let combinedValue = 0n;
  let totalBitLength = 0;

  for (const frag of fragments) {
    // 1. Read the value of this specific fragment
    const fragValue = readBitsAsBigInt(
      buffer,
      frag.bitOffset,
      frag.bitLength,
      frag.byteOrder || 'big'
    );

    // 2. Shift the existing total to the left to make room for the new fragment
    combinedValue = (combinedValue << BigInt(frag.bitLength));

    // 3. Merge the new fragment
    combinedValue = combinedValue | fragValue;

    totalBitLength += frag.bitLength;
  }

  // 4. Convert the final merged BigInt to a Buffer
  return bigIntToBuffer(combinedValue, totalBitLength);
}

function bigIntToBuffer(value: bigint, bitLength: number): Buffer {
  const byteSize = Math.ceil(bitLength / 8);
  const buffer = Buffer.alloc(byteSize);
  for (let i = 0; i < byteSize; i++) {
    const shift = BigInt((byteSize - 1 - i) * 8);
    buffer[i] = Number((value >> shift) & 0xFFn);
  }
  return buffer;
}

function readBitsAsBigInt(
  buffer: Buffer,
  bitOffset: number,
  bitLength: number,
  byteOrder: 'little' | 'big' = 'big'
): bigint {
  const startByte = Math.floor(bitOffset / 8);
  const endByte = Math.ceil((bitOffset + bitLength) / 8);
  const bytesToRead = endByte - startByte;

  let rawValue = 0n;

  if (byteOrder === 'little') {
    for (let i = 0; i < bytesToRead; i++) {
      const idx = startByte + i;
      if (idx < buffer.length) {
        rawValue |= BigInt(buffer[idx]) << BigInt(i * 8);
      }
    }
    // Adjust for offset
    rawValue = rawValue >> BigInt(bitOffset % 8);
  } else {
    for (let i = 0; i < bytesToRead; i++) {
      const idx = startByte + i;
      if (idx < buffer.length) {
        rawValue = (rawValue << 8n) | BigInt(buffer[idx]);
      }
    }
    // Adjust for offset
    const totalBitsRead = bytesToRead * 8;
    const bitsToShift = BigInt(totalBitsRead - (bitLength + (bitOffset % 8)));
    rawValue = rawValue >> bitsToShift;
  }

  // Mask
  const mask = (1n << BigInt(bitLength)) - 1n;
  return rawValue & mask;
}


// Function to decide which sliceing method to use.
function sliceBuffer(schema: any, bytes: Buffer) {
  const byteOrder = schema['bdo:byteOrder'] || 'little';

  // Handle multiple entries
  if (Array.isArray(schema["bdo:bitOffset"])) {
    const args = [];
    for (let i = 0; i < schema["bdo:bitOffset"].length; i++) {
      args.push({ "bitOffset": schema["bdo:bitOffset"][i], "bitLength": schema["bdo:bitLength"][i], "byteOrder": byteOrder})
    }
    const newBuffer = sliceFragmentedBits(bytes, args);
    return newBuffer;

  }
  // Handle single entries
  const bitLength = schema['bdo:bitLength'];
  const bitOffset = schema['bdo:bitOffset'] || 0;

  const newBuffer = sliceBits(bytes, bitOffset, bitLength, byteOrder);
  return newBuffer;
}