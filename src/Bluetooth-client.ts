import {Content, ProtocolClient, ProtocolHelpers} from '@node-wot/core';
import {Form, SecurityScheme} from '@node-wot/td-tools';
import {BluetoothForm} from './Bluetooth.js';
import {Subscription} from 'rxjs';
import {Readable} from 'stream';

//import {write} from './bluetooth/ble';
import {read, write} from './bluetooth/blast_Bluetooth';
import {getCharacteristic} from './bluetooth/blast_Bluetooth_core';

export default class BluetoothClient implements ProtocolClient {
  public toString(): string {
    return '[BluetoothClient]';
  }

  /**
   * Reads the value of a ressource
   * @param {BluetoothForm} form form of property to read.
   * @returns {Promise} Promise that resolves to the read value.
   */
  public async readResource(form: BluetoothForm): Promise<Content> {
    const deconstructedForm = deconstructForm(form);

    let value: Buffer;
    console.debug(
      '[binding-Bluetooth]',
      `invoking readInt with serviceId ${deconstructedForm.serviceId} characteristicId ${deconstructedForm.characteristicId}`
    );
    value = await read(
      deconstructedForm.deviceId,
      deconstructedForm.serviceId,
      deconstructedForm.characteristicId
    );

    let s = new Readable();
    s.push(value); // string to encode
    s.push(null); // indicates end-of-file; end of the stream
    const body = ProtocolHelpers.toNodeStream(s as Readable);

    return {
      type: form.contentType || 'application/x.ble-octet-stream',
      body: body,
    };
  }

  /**
   * Writes a value to a ressource
   * @param {BluetoothForm} form form of property to write.
   * @param {Content} content content to write to device
   * @returns {Promise} Promise that resolves to the read value.
   */
  public async writeResource(
    form: BluetoothForm,
    content: Content
  ): Promise<void> {
    const deconstructedForm = deconstructForm(form);
    let buffer: Buffer;
    //Convert readableStreamToBuffer
    if (typeof content != 'undefined') {
      const chunks = [];
      for await (const chunk of content.body) {
        chunks.push(chunk as Buffer);
      }
      buffer = Buffer.concat(chunks);
    } else {
      // If content not definied write buffer < 00 >
      buffer = Buffer.alloc(1);
    }

    // Select what operation should be executed
    switch (deconstructedForm.ble_operation) {
      case 'write':
        console.debug(
          '[binding-Bluetooth]',
          `invoking writeWithResponse with value ${buffer.toString()}`
        );
        await write(
          deconstructedForm.deviceId,
          deconstructedForm.serviceId,
          deconstructedForm.characteristicId,
          true,
          buffer
        );
        break;
      case 'write-without-response':
        console.debug(
          '[binding-Bluetooth]',
          `invoking writeWithoutResponse with value ${buffer.toString()}`
        );
        await write(
          deconstructedForm.deviceId,
          deconstructedForm.serviceId,
          deconstructedForm.characteristicId,
          false,
          buffer
        );
        break;
      default: {
        throw new Error(
          `[binding-Bluetooth] unknown operation ${deconstructedForm.operation}`
        );
      }
    }
  }

  /**
   * Invokes an action
   * @param {BluetoothForm} form form of action to invoke.
   * @param {Content} content content to write to device
   * @returns {Promise} Promise that resolves to the read value.
   */
  public async invokeResource(
    form: BluetoothForm,
    content: Content
  ): Promise<Content> {
    // Call writeRessource
    await this.writeResource(form, content);
    // Output will probably not be returned
    let s = new Readable();
    s.push('');
    s.push(null);
    const body = ProtocolHelpers.toNodeStream(s as Readable);
    return {
      type: 'text/plain',
      body: body,
    };
  }

  public async unlinkResource(form: BluetoothForm): Promise<void> {
    const deconstructedForm = deconstructForm(form);

    console.debug(
      '[binding-Bluetooth]',
      `unsubscribing from characteristic with serviceId ${deconstructedForm.serviceId} characteristicId ${deconstructedForm.characteristicId}`
    );

    const characteristic = await getCharacteristic(
      deconstructedForm.deviceId,
      deconstructedForm.serviceId,
      deconstructedForm.characteristicId
    );

    await characteristic.stopNotifications();

    //throw new Error("not implemented");
  }

  /**
   * Subscribe to an "notify" event
   */
  public async subscribeResource(
    form: BluetoothForm,
    next: (content: Content) => void,
    error?: (error: Error) => void,
    complete?: () => void
  ): Promise<Subscription> {
    const deconstructedForm = deconstructForm(form);

    if (deconstructedForm.ble_operation !== 'notify') {
      throw new Error(
        `[binding-Bluetooth] operation ${deconstructedForm.ble_operation} is not supported`
      );
    }
    console.debug(
      '[binding-Bluetooth]',
      `subscribing to characteristic with serviceId ${deconstructedForm.serviceId} characteristicId ${deconstructedForm.characteristicId}`
    );

    const characteristic = await getCharacteristic(
      deconstructedForm.deviceId,
      deconstructedForm.serviceId,
      deconstructedForm.characteristicId
    );

    await characteristic.startNotifications();

    characteristic.on('valuechanged', (buffer: Buffer) => {
      console.debug(
        '[binding-Bluetooth]',
        `event occured on characteristic with serviceId ${deconstructedForm.serviceId} characteristicId ${deconstructedForm.characteristicId}`
      );
      const array = new Uint8Array(buffer);
      // Convert value a DataView to ReadableStream
      let s = new Readable();
      s.push(array);
      s.push(null);
      const body = ProtocolHelpers.toNodeStream(s as Readable);
      const content = {
        type: form.contentType || 'application/x.ble-octet-stream',
        body: body,
      };
      next(content);
    });

    return new Subscription(() => {});
  }

  public async start(): Promise<void> {
    // do nothing
  }

  public async stop(): Promise<void> {
    // do nothing
  }

  public setSecurity(
    metadata: SecurityScheme[],
    credentials?: unknown
  ): boolean {
    return false;
  }
}

/**
 * Deconsructs form in object
 * @param {Form} form form to analyze
 * @returns {Object} Object containing all parameters
 */
export const deconstructForm = function (form: BluetoothForm) {
  const deconstructedForm: Record<string, any> = {};

  // Remove gatt://
  deconstructedForm.path = form.href.split('//')[1];

  // DeviceId is mac of device. Add ':'
  // e.g. c0-3c-59-a8-91-06  -> c0:3c:59:a8:91:06
  deconstructedForm.deviceId = deconstructedForm.path.split('/')[0];
  deconstructedForm.deviceId = deconstructedForm.deviceId.toUpperCase();
  deconstructedForm.deviceId = deconstructedForm.deviceId.replaceAll('-', ':');

  // Extract serviceId
  deconstructedForm.serviceId = deconstructedForm.path.split('/')[1];

  // Extract characteristicId
  deconstructedForm.characteristicId = deconstructedForm.path.split('/')[2];

  // Extract operation -> e.g. readproperty; writeproperty
  deconstructedForm.operation = form.op;

  // Get BLE operation type
  deconstructedForm.ble_operation = form['bt:methodName'];

  return deconstructedForm;
};
