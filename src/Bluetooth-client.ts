import {Content, ProtocolClient, ProtocolHelpers} from '@node-wot/core';
import {Form, SecurityScheme} from '@node-wot/td-tools';
import {BluetoothForm} from './Bluetooth.js';
import {Subscription} from 'rxjs';
import {Readable} from 'stream';
import * as BLELibCore from './bluetooth/Bluetooth_lib';

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

    let buffer: Buffer;
    console.debug(
      '[binding-Bluetooth]',
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
    try {
      buffer = await characteristic.readValue();
    } catch (error) {
      console.error(error);
      throw new Error(
        `Error reading from Bluetooth device ${deconstructedForm.characteristicId}`
      );
    }

    // Convert to readable
    let s = new Readable();
    s.push(buffer);
    s.push(null);
    const body = ProtocolHelpers.toNodeStream(s as Readable);

    return {
      type: form.contentType || 'application/x.binary-data-stream',
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

    // Get Characteristic
    const characteristic = await BLELibCore.getCharacteristic(
      deconstructedForm.deviceId,
      deconstructedForm.serviceId,
      deconstructedForm.characteristicId
    );

    // Select what operation should be executed
    switch (deconstructedForm.ble_operation) {
      case 'sbo:write':
        console.debug(
          '[binding-Bluetooth]',
          `invoke write operation on characteristic ${deconstructedForm.characteristicId}` +
            `from service ${deconstructedForm.serviceId} on ${deconstructedForm.deviceId}`
        );

        // write value with response
        await characteristic.writeValue(buffer, {offset: 0, type: 'request'});
        break;

      case 'sbo:write-without-response':
        console.debug(
          '[binding-Bluetooth]',
          `invoke write-without-response operation on characteristic ${deconstructedForm.characteristicId}` +
            `from service ${deconstructedForm.serviceId} on ${deconstructedForm.deviceId}`
        );

        // write value without response
        await characteristic.writeValue(buffer, {offset: 0, type: 'command'});
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
      `unsubscribing from characteristic with serviceId ${deconstructedForm.serviceId} characteristicId 
      ${deconstructedForm.characteristicId} on ${deconstructedForm.deviceId}`
    );

    const characteristic = await BLELibCore.getCharacteristic(
      deconstructedForm.deviceId,
      deconstructedForm.serviceId,
      deconstructedForm.characteristicId
    );

    await characteristic.stopNotifications();
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

    if (deconstructedForm.ble_operation !== 'sbo:notify') {
      throw new Error(
        `[binding-Bluetooth] operation ${deconstructedForm.ble_operation} is not supported`
      );
    }
    console.debug(
      '[binding-Bluetooth]',
      `subscribing to characteristic with serviceId ${deconstructedForm.serviceId} characteristicId ${deconstructedForm.characteristicId}`
    );

    const characteristic = await BLELibCore.getCharacteristic(
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
        type: form.contentType || 'application/x.binary-data-stream',
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
  deconstructedForm.ble_operation = form['sbo:methodName'];

  return deconstructedForm;
};
