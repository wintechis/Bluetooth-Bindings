import { Content, ProtocolClient } from '@node-wot/core';
import type { Form, SecurityScheme } from 'wot-thing-description-types';
import { Readable } from 'stream';
import debug from 'debug';
import * as BLELibCore from './bluetooth/Bluetooth_lib';

const log = debug('binding-Bluetooth-GAP');

// --- Helper Functions ---

function fromObject(data: any): Content {
  const json = JSON.stringify(data);
  return {
    type: 'application/json',
    body: Readable.from(json),
    async toBuffer() {
      return Buffer.from(json);
    },
  };
}

// Add this function here:
function fromBuffer(type: string, buf: Buffer): Content {
  return {
    type,
    body: Readable.from(buf),
    async toBuffer() {
      return buf;
    },
  };
}

// --- Class Definition ---

export default class BluetoothGapClient implements ProtocolClient {
  public toString(): string {
    return '[BluetoothGapClient]';
  }

  public async readResource(form: Form): Promise<Content> {
    // Parse URL
    // Expected formats: 
    // - gap://<mac>
    // - gap://<mac>/manufacturerData           (Auto-select first)
    // - gap://<mac>/manufacturerData/<id>      (Select specific)
    const path = form.href.split('//')[1]; 
    const parts = path.split('/');
    
    let deviceId = parts[0];
    let resource = parts[1] ?? "manufacturerData";
    const companyIdStr = parts[2]; // Optional

    deviceId = deviceId.toUpperCase().replaceAll('-', ':');

    if (resource !== 'manufacturerData') {
      throw new Error(`[BluetoothGapClient] Only 'manufacturerData' is supported.`);
    }

    log(`invoke read GAP on ${deviceId}`);

    // Fetch all data
    const dataEntries = await BLELibCore.getDeviceManufacturerData(deviceId);

    if (dataEntries.length === 0) {
      throw new Error(`No manufacturer data found on ${deviceId}`);
    }

    // LOGIC: Auto-select or Specific Select
    let selectedEntry;

    if (companyIdStr) {
      // Case A: ID specified in URL (e.g. 0x0499)
      const companyId = companyIdStr.startsWith('0x') 
        ? parseInt(companyIdStr, 16) 
        : parseInt(companyIdStr, 10);
        
      selectedEntry = dataEntries.find(e => e.companyId === companyId);
      if (!selectedEntry) {
        throw new Error(`Company ID ${companyIdStr} not found in advertisements.`);
      }
    } else {
      // Case B: No ID specified -> Auto-select the first one
      selectedEntry = dataEntries[0];
      log(`Auto-selected Manufacturer ID: 0x${selectedEntry.companyId.toString(16)}`);
    }

    // Return Data based on Content-Type
    // If the TD expects binary (for the Codec), return the Buffer directly.
    // If the TD expects JSON (debugging), return the simplified object.
    
    if (form.contentType === 'application/json') {
       // Return the simplified object info if JSON is requested
       return fromObject(selectedEntry);
    } else {
       // Default / Binary: Return the RAW BUFFER so the Codec can parse it
       return fromBuffer(
         form.contentType || 'application/x.binary-data-stream', 
         selectedEntry.data
       );
    }
  }

  public async writeResource(form: Form, content?: Content): Promise<void> {
    throw new Error('Method not implemented for GAP.');
  }

  public async invokeResource(form: Form, content?: Content): Promise<Content> {
    throw new Error('Method not implemented for GAP.');
  }

  public async unlinkResource(form: Form): Promise<void> {
    throw new Error('Method not implemented for GAP.');
  }

  public async subscribeResource(
    form: Form,
    next: (content: Content) => void,
    error?: (error: Error) => void,
    complete?: () => void
  ): Promise<any> {
    throw new Error('Subscribe not yet implemented for GAP.');
  }

  public async start(): Promise<void> {
    // no-op
  }

  public async stop(): Promise<void> {
    // no-op
  }

  public setSecurity(_metadata: SecurityScheme[], _credentials?: unknown): boolean {
    return false;
  }

  // --- ADDED THIS METHOD TO FIX ERROR 1 & 2 ---
  public async requestThingDescription(uri: string): Promise<Content> {
     throw new Error('requestThingDescription not supported by BluetoothGapClient');
  }
}