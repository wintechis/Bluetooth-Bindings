import { Content, ProtocolClient, ProtocolHelpers } from '@node-wot/core';
import { Subscription } from 'rxjs/Subscription';
import type { Form, SecurityScheme } from 'wot-thing-description-types';
import { Readable } from 'stream';
import debug from 'debug';
import * as BLELibCore from './bluetooth/Bluetooth_lib';

// If conenction should be closed automatically
let autoDisconnect = true;

export function enableAutoDisconnect() {
  autoDisconnect = true;
}

export function disableAutoDisconnect() {
  autoDisconnect = false;
}

// Create a logger with a specific namespace
const log = debug('binding-Bluetooth');

////// helpers ////////////////////////////////////////////////////////////
type BluetoothFormExt = Form & {
  'wbt:id'?: string;
  datatype?: string;
  'sbo:methodName'?: string;
};

function asBle(form: Form): BluetoothFormExt {
  return form as BluetoothFormExt;
}

function fromBuffer(type: string, buf: Buffer): Content {
  return {
    type,
    body: Readable.from(buf),
    async toBuffer() {
      return buf;
    },
  };
}

function fromReadable(type: string, body: Readable): Content {
  return {
    type,
    body,
    async toBuffer() {
      const chunks: Buffer[] = [];
      for await (const chunk of body) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    },
  };
}

// Deconstructs TD form into BLE bits we need
export const deconstructForm = function (form: Form) {
  const f = asBle(form);
  const deconstructedForm: Record<string, any> = {};

  // Remove gatt://
  deconstructedForm.path = f.href.split('//')[1];

  // DeviceId is mac of device. Add ':'
  // e.g. c0-3c-59-a8-91-06  -> c0:3c:59:a8:91:06
  deconstructedForm.deviceId = deconstructedForm.path.split('/')[0];
  deconstructedForm.deviceId = deconstructedForm.deviceId.toUpperCase();
  deconstructedForm.deviceId = deconstructedForm.deviceId.replaceAll('-', ':');

  // Extract serviceId
  deconstructedForm.serviceId = deconstructedForm.path.split('/')[1];

  // Extract characteristicId
  deconstructedForm.characteristicId = deconstructedForm.path.split('/')[2];

  // Extract operation (e.g., readproperty; writeproperty)
  deconstructedForm.operation = f.op;

  // BLE operation type (e.g., sbo:write, sbo:notify)
  deconstructedForm.ble_operation = f['sbo:methodName'];

  // Content type if present on form
  deconstructedForm.contentType = f.contentType;

  return deconstructedForm;
};

///// client ////////////////////////////////////////////////////////////

export default class BluetoothClient implements ProtocolClient {
  public toString(): string {
    return '[BluetoothClient]';
  }

  /**
   * Reads the value of a resource
   */
  public async readResource(form: Form): Promise<Content> {
    const deconstructedForm = deconstructForm(form);

    await BLELibCore.connect(deconstructedForm.deviceId);
    BLELibCore.touchConnection(deconstructedForm.deviceId);

    log(
      `invoke read operation on characteristic ${deconstructedForm.characteristicId}` +
      ` from service ${deconstructedForm.serviceId} on ${deconstructedForm.deviceId}`
    );

    // Get Characteristic
    const characteristic = await BLELibCore.getCharacteristic(
      deconstructedForm.deviceId,
      deconstructedForm.serviceId,
      deconstructedForm.characteristicId
    );

    // Read Value
    let buffer: Buffer;
    try {
      buffer = await characteristic.readValue();
    } catch (error) {
      console.error(error);
      throw new Error(
        `Error reading from Bluetooth device ${deconstructedForm.characteristicId}`
      );
    }

    if (autoDisconnect) {
      // disconnect on idle (handled inside BLELibCore timers)
      BLELibCore.touchConnection(deconstructedForm.deviceId);
    }

    // Return proper Content (with toBuffer)
    return fromBuffer(
      deconstructedForm.contentType || 'application/x.binary-data-stream',
      buffer
    );
  }

  /**
   * Writes a value to a resource
   */
  public async writeResource(form: Form, content?: Content): Promise<void> {
    const deconstructedForm = deconstructForm(form);
    await BLELibCore.connect(deconstructedForm.deviceId);
    BLELibCore.touchConnection(deconstructedForm.deviceId);

    // Convert content -> Buffer
    let buffer: Buffer;
    if (content) {
      // 1) If node-wot gives you a canonical helper, use it
      if (typeof (content as any).toBuffer === 'function') {
        buffer = await (content as any).toBuffer();
      } else {
        // 2) Manually read the body and preserve Buffers as-is
        const chunks: Buffer[] = [];

        for await (const chunk of (content as any).body) {
          if (Buffer.isBuffer(chunk)) {
            chunks.push(chunk); // already a Buffer → keep as-is
          } else if (typeof chunk === 'string') {
            chunks.push(Buffer.from(chunk, 'utf8'));
          } else {
            // covers Uint8Array, Array<number>, etc.
            chunks.push(Buffer.from(chunk as any));
          }
        }

        // If there was exactly one Buffer, just use it directly
        if (chunks.length === 0) {
          buffer = Buffer.alloc(0);
        } else if (chunks.length === 1) {
          buffer = chunks[0];
        } else {
          buffer = Buffer.concat(chunks);
        }
      }
    } else {
      // If content not defined write buffer <00>
      buffer = Buffer.alloc(1);
    }

    // Get Characteristic
    const characteristic = await BLELibCore.getCharacteristic(
      deconstructedForm.deviceId,
      deconstructedForm.serviceId,
      deconstructedForm.characteristicId
    );

    // Select what operation should be executed
    switch (deconstructedForm.ble_operation) {
      case 'sbo:write':
        log(
          `invoke write operation on characteristic ${deconstructedForm.characteristicId}` +
          ` from service ${deconstructedForm.serviceId} on ${deconstructedForm.deviceId}`
        );
        // write value with response
        await characteristic.writeValue(buffer, { offset: 0, type: 'request' });
        break;

      case 'sbo:write-without-response':
        log(
          `invoke write-without-response operation on characteristic ${deconstructedForm.characteristicId}` +
          ` from service ${deconstructedForm.serviceId} on ${deconstructedForm.deviceId}`
        );
        // write value without response
        await characteristic.writeValue(buffer, { offset: 0, type: 'command' });
        break;

      default: {
        throw new Error(
          `[binding-Bluetooth] unknown operation ${deconstructedForm.operation}`
        );
      }
    }

    if (autoDisconnect) {
      BLELibCore.touchConnection(deconstructedForm.deviceId);
    }
  }

  /**
   * Invokes an action (write + trivial response)
   */
  public async invokeResource(form: Form, content?: Content): Promise<Content> {
    await this.writeResource(form, content);
    const s = new Readable();
    s.push(''); // empty text response
    s.push(null);
    const body = ProtocolHelpers.toNodeStream(s as Readable);
    return fromReadable('text/plain', body);
  }

  public async unlinkResource(form: Form): Promise<void> {
    const deconstructedForm = deconstructForm(form);

    log(
      `unsubscribing from characteristic with serviceId ${deconstructedForm.serviceId} characteristicId ` +
      `${deconstructedForm.characteristicId} on ${deconstructedForm.deviceId}`
    );

    const characteristic = await BLELibCore.getCharacteristic(
      deconstructedForm.deviceId,
      deconstructedForm.serviceId,
      deconstructedForm.characteristicId
    );

    await characteristic.stopNotifications();
  }

  /**
   * Subscribe to a "notify" event
   */
  public async subscribeResource(
    form: Form,
    next: (content: Content) => void,
    error?: (error: Error) => void,
    complete?: () => void
  ): Promise<Subscription> {
    const deconstructedForm = deconstructForm(form);
    await BLELibCore.connect(deconstructedForm.deviceId);
    BLELibCore.holdConnection(deconstructedForm.deviceId);

    if (deconstructedForm.ble_operation !== 'sbo:notify') {
      throw new Error(
        `[binding-Bluetooth] operation ${deconstructedForm.ble_operation} is not supported`
      );
    }
    log(
      `subscribing to characteristic with serviceId ${deconstructedForm.serviceId} ` +
      `characteristicId ${deconstructedForm.characteristicId}`
    );

    const characteristic = await BLELibCore.getCharacteristic(
      deconstructedForm.deviceId,
      deconstructedForm.serviceId,
      deconstructedForm.characteristicId
    );

    await characteristic.startNotifications();

    const handler = (buffer: Buffer) => {
      try {
        const s = new Readable();
        s.push(buffer);
        s.push(null);
        const body = ProtocolHelpers.toNodeStream(s as Readable);
        next(
          fromReadable(
            deconstructedForm.contentType || 'application/x.binary-data-stream',
            body
          )
        );
      } catch (e: any) {
        error?.(e);
      }
    };

    characteristic.on('valuechanged', handler);

    // Return a simple core-compatible subscription
    const sub = new Subscription();
    sub.add(() => {
      // detach listener
      characteristic.off?.('valuechanged', handler);
      void characteristic
        .stopNotifications()
        .then(() => {
          BLELibCore.releaseConnection(deconstructedForm.deviceId);
          complete?.();
        })
        .catch((e: any) => {
          BLELibCore.releaseConnection(deconstructedForm.deviceId);
          error?.(e);
        });
    });

    return sub;
  }

  public async start(): Promise<void> {
    // no-op
  }

  public async stop(): Promise<void> {
    // no-op
  }

  async requestThingDescription(uri: string): Promise<Content> {
    throw new Error('requestThingDescription not supported by BluetoothClient');
  }

  public setSecurity(
    _metadata: SecurityScheme[],
    _credentials?: unknown
  ): boolean {
    return false;
  }
}
