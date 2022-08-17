/**
 * Functions for advanced bluetooth operations
 */

import {
  getCharacteristic,
  tearDown,
  hexStringToArrayBuffer,
} from './blast_Bluetooth_core';

/**
 * Read functionality
 */

/**
 * Reads data from Bluetooth device using the gatt protocol.
 * @param {BluetoothDevice.id} id identifier of the device to read from.
 * @param {BluetoothServiceUUID} serviceUUID identifier of the service.
 * @param {BluetoothCharacteristicUUID} characteristicUUID identifier of the characteristic.
 * @return {Promise} representation of the complete request with response.
 * @public
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
    const buffer: any = await characteristic.readValue();
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
 * @param {any} value value to write
 * @return {Promise} representation of the complete request with response.
 * @public
 */
export const write = async function (
  id: string,
  serviceUUID: string,
  characteristicUUID: string,
  withResponse: boolean,
  value: any
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
 * @public
 */
export const get_td_from_device = async function (id: string) {
  const WoT_Service = '1fc8f811-0000-4e89-8476-e0b2dad3179b';
  const td_Char = '2ab6';

  let value = await read(id, WoT_Service, td_Char);

  await tearDown();

  return value.toString();
};
