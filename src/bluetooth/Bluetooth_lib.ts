/**
 * Functions for advanced bluetooth operations
 */

import * as BLELibCore from './Bluetooth_core_lib';

import {deconstructForm} from '../Bluetooth-client';

// object to store connection details
export let connection_established_obj: Record<string, any> = {};


/**
 * Reads data from Bluetooth device using the gatt protocol.
 * @param {BluetoothDevice.id} id identifier of the device to read from.
 * @param {BluetoothServiceUUID} serviceUUID identifier of the service.
 * @param {BluetoothCharacteristicUUID} characteristicUUID identifier of the characteristic.
 * @return {Promise} representation of the complete request with response.
 */
export const read = async function (
  id: string,
  serviceUUID: string,
  characteristicUUID: string
) {
  const characteristic: any = await BLELibCore.getCharacteristic(
    id,
    serviceUUID,
    characteristicUUID
  );
  try {
    console.debug(
      '[binding-Bluetooth]',
      `Invoke ReadValue on characteristic ${characteristicUUID}` +
        ` from service ${serviceUUID}`,
      'Bluetooth',
      id
    );
    const buffer: Buffer = await characteristic.readValue();
    console.debug(
      '[binding-Bluetooth]',
      `Finished ReadValue on characteristic ${characteristicUUID}` +
        ` from service ${serviceUUID}}`,
      'Bluetooth',
      id
    );

    return buffer;
  } catch (error) {
    console.error(error);
    throw new Error(`Error reading from Bluetooth device ${id}`);
  }
};

/**
 * Writes data to Bluetooth device using the gatt protocol.
 * @param {BluetoothDevice.id} id identifier of the device to read from.
 * @param {BluetoothServiceUUID} serviceUUID identifier of the service.
 * @param {BluetoothCharacteristicUUID} characteristicUUID identifier of the characteristic.
 * @param {Boolean} withResponse type of operation
 * @param {Buffer} value value to write
 * @return {Promise} representation of the complete request with response.
 * @public
 */
export const write = async function (
  id: string,
  serviceUUID: string,
  characteristicUUID: string,
  withResponse: boolean,
  value: Buffer
) {
  const characteristic: any = await BLELibCore.getCharacteristic(
    id,
    serviceUUID,
    characteristicUUID
  );
  if (!characteristic) {
    return;
  }

  try {
    if (withResponse) {
      console.debug(
        '[binding-Bluetooth]',
        'Invoke WriteValueWithResponse on characteristic ' +
          `${characteristicUUID}}`,
        'Bluetooth',
        id
      );
      await characteristic.writeValue(value, {offset: 0, type: 'request'});
      console.debug(
        '[binding-Bluetooth]',
        'Finished WriteValueWithResponse on characteristic ' +
          `${characteristicUUID}}`,
        'Bluetooth',
        id
      );
    } else {
      console.debug(
        '[binding-Bluetooth]',
        'Invoke WriteValueWithoutResponse on characteristic ' +
          `${characteristicUUID}}`,
        'Bluetooth',
        id
      );
      await characteristic.writeValue(value, {offset: 0, type: 'command'});
      console.debug(
        '[binding-Bluetooth]',
        'Finished WriteValueWithoutResponse on characteristic ' +
          `${characteristicUUID}}`,
        'Bluetooth',
        id
      );
    }
  } catch (error) {
    const errorMsg =
      'Error writing to Bluetooth device.\nMake sure the device is compatible with the connected block.';
    console.error(error);
    throw new Error(errorMsg);
  }
};

/**
 * Connects ta a selected device based on a Thing object.
 * @param {object} Thing Thing instance of device.
 */
export const connectThing = async function (Thing: any) {
  // Get MAC of Thing
  const mac = extractMac(Thing)

  // Check if discovery is active
  if(await BLELibCore.getAdapterStatus() === false){
    BLELibCore.startScan()
  }

  // Connect
  await BLELibCore.connect(mac)

};

/**
 * Disconnects from a selected device based on a Thing object.
 * @param {object} Thing Thing instance of device.
 */
export const disconnectThing = async function (Thing: any) {
  // Get Mac of Thing
  const mac = extractMac(Thing);
  await disconnectByMac(mac);
};

/**
 * Disconnects from a selected device based on a mac address.
 * @param {string} id identifier of the device to read from.
 */

 export const disconnectByMac = async function (id: string) {
  // Check if Thing is connected
  // get device
  if (id in connection_established_obj) {
    // disconnect
    const device = connection_established_obj[id][0];
    await device.disconnect();
    console.debug('[binding-Bluetooth]', 'Disconnecting from Device:', id);

    // remove from arrays
    delete connection_established_obj[id];
  }
};

/**
 * Disconnects from all connected devices.
 */
 export const disconnectAll = async function () {
  for (const [key, value] of Object.entries(connection_established_obj)) {
    console.debug('[binding-Bluetooth]', 'Disconnecting from Device:', key);
    await value[0].disconnect();
  }

  // Remove all items from connected_devices
  for (const key in connection_established_obj) {
    delete connection_established_obj[key];
  }
};

/**
 * Disconnects from all connected devices and stops all operations by node-ble.
 * Needed to exit programm after execution.
 */
export const close = async function () {
  await disconnectAll();
  BLELibCore.destroy();
};

/**
 * Extract a mac address from a Thing instance.
 * @param {object} Thing Thing instance of device.
 * @returns {string} MAC of device
 */
const extractMac = function (Thing: any) {
  // Get MAC of device
  let mac: string = '';
  for (const [key, value] of Object.entries(Thing.properties)) {
    let element = Thing.properties[`${key}`];
    let form = element.forms[0];
    let deconstructedForm = deconstructForm(form);
    mac = deconstructedForm.deviceId;
    break;
  }

  if (mac === '') {
    for (const [key, value] of Object.entries(Thing.actions)) {
      let element = Thing.properties[`${key}`];
      let form = element.forms[0];
      let deconstructedForm = deconstructForm(form);
      mac = deconstructedForm.deviceId;
      break;
    }
  }

  if (mac === '') {
    for (const [key, value] of Object.entries(Thing.events)) {
      let element = Thing.properties[`${key}`];
      let form = element.forms[0];
      let deconstructedForm = deconstructForm(form);
      mac = deconstructedForm.deviceId;
      break;
    }
  }

  return mac;
};
