/**
 * Functions for advanced bluetooth operations
 */

import {getCharacteristic, destroy} from './blast_Bluetooth_core';

import {deconstructForm} from '../Bluetooth-client';

export let stay_connected_arr: Record<string, string> = {};

export let cons: Record<string, any> = {}; 


/**
 * Read functionality
 */

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
  const characteristic: any = await getCharacteristic(
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
        ` from service ${serviceUUID} - value: ${buffer.toString()}`,
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
 * Write functionality
 */

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
  const characteristic: any = await getCharacteristic(
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
          `${characteristicUUID} with value ${value.toString()}`,
        'Bluetooth',
        id
      );
      await characteristic.writeValue(value, {offset: 0, type: 'request'});
      console.debug(
        '[binding-Bluetooth]',
        'Finished WriteValueWithResponse on characteristic ' +
          `${characteristicUUID} with value ${value.toString()}`,
        'Bluetooth',
        id
      );
    } else {
      console.debug(
        '[binding-Bluetooth]',
        'Invoke WriteValueWithoutResponse on characteristic ' +
          `${characteristicUUID} with value ${value.toString()}`,
        'Bluetooth',
        id
      );
      await characteristic.writeValue(value, {offset: 0, type: 'command'});
      console.debug(
        '[binding-Bluetooth]',
        'Finished WriteValueWithoutResponse on characteristic ' +
          `${characteristicUUID} with value ${value.toString()}`,
        'Bluetooth',
        id
      );
    }
    /*
    // Disconnect
    if (!(id in stay_connected_arr))
    {
      await disconnectByMac(id);
    } */
  } catch (error) {
    const errorMsg =
      'Error writing to Bluetooth device.\nMake sure the device is compatible with the connected block.';
    console.error(error);
    throw new Error(errorMsg);
  }
};

/**
 * Reads a Thing Description from a Bluetooth device.
 * The TD should be located in under the WoT Service.
 * @param {BluetoothDevice.id} id identifier of the device to read from.
 * @returns {string} Uri of the Thing Description.
 */
export const get_td_from_device = async function (id: string) {
  const WoT_Service = '1fc8f811-0000-4e89-8476-e0b2dad3179b';
  const td_Char = '2ab6';

  let value = await read(id, WoT_Service, td_Char);

  await disconnectAll();

  return value.toString();
};

/**
 * Disconnects from all connected devices.
 */
export const disconnectAll = async function () {
  for (const [key, value] of Object.entries(cons)) {
    console.debug(
      '[binding-Bluetooth]',
      'Disconnecting from Device:',
      key
    );
    await value[0].disconnect();
  }

  // Remove all items from connected_devices
  for (const key in cons) {
    delete cons[key];
  }
};


/**
 * Disconnects from a selected device based on a mac address.
 * @param {string} id identifier of the device to read from.
 */

export const disconnectByMac = async function (id: string) {
  // Check if Thing is connected
  // get device
  if (id in stay_connected_arr) {
    // disconnect
    const device = cons[id][0];
    await device.disconnect();
    console.debug('[binding-Bluetooth]', 'Disconnecting from Device:', id);

    // remove from arrays
    delete cons[id]
  }
};

/**
 * Disconnects from a selected device based on a Thing object.
 * @param {object} Thing Thing instance of device.
 */disconnectAll

export const disconnectThing = async function (Thing: any) {
  // Get Mac of Thing
  const mac = extractMac(Thing);
  await disconnectByMac(mac);
};


/**
 * Disconnects from all connected devices and stops all operations by node-ble.
 * Needed to exit programm after execution.
 */
export const closeBluetooth = async function () {
  await disconnectAll();
  destroy();
};

/**
 * Add mac to stay_connected_list.
 * @param {object} Thing Thing instance of device.
 */

export const stayConnected = function (Thing: any, flag: boolean) {
  const mac = extractMac(Thing);

  if (flag) {
    // Add mac of Thing to stay_connected list
    stay_connected_arr[mac] = mac;
  } else {
    // Remove mac of Thing to stay_connected list
    delete stay_connected_arr[mac];
  }
};

/**
 * Extract a mac address from a Thing instance.
 * @param {object} Thing Thing instance of device.
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
