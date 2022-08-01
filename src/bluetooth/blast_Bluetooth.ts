/**
 * Functions for advanced bluetooth operations
 */

import {
  getCharacteristic,
  tearDown,
  hexStringToArrayBuffer,
} from "./blast_Bluetooth_core";

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
const read = async function (
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
    //const thingsLog = getThingsLog();
    console.debug(
      "[binding-Bluetooth]",
      `Invoke ReadValue on characteristic ${characteristicUUID}` +
        ` from service ${serviceUUID}`,
      "Bluetooth",
      id
    );
    const value: any = await characteristic.readValue();
    console.debug(
      "[binding-Bluetooth]",
      `Finished ReadValue on characteristic ${characteristicUUID}` +
        ` from service ${serviceUUID} - value: ${value.toString()}`,
      "Bluetooth",
      id
    );
    return value;
  } catch (error) {
    console.error(error);
    throw new Error(`Error reading from Bluetooth device ${id}`);
  }
};

/**
 * Reads an integer characteristic value from a Bluetooth device.
 * @param {BluetoothDevice.id} id identifier of the device to read from.
 * @param {BluetoothServiceUUID} serviceUUID identifier of the service.
 * @param {BluetoothCharacteristicUUID} characteristicUUID identifier of the characteristic.
 * @returns {string} the value of the characteristic.
 * @public
 */
export const readInt = async function (
  id: string,
  serviceUUID: string,
  characteristicUUID: string
) {
  let buffer = await read(id, serviceUUID, characteristicUUID);
  const length = buffer.length;
  const result = buffer.readIntLE(0, length);

  return result;
};

/**
 * Reads an unsigned integer characteristic value from a Bluetooth device.
 * @param {BluetoothDevice.id} id identifier of the device to read from.
 * @param {BluetoothServiceUUID} serviceUUID identifier of the service.
 * @param {BluetoothCharacteristicUUID} characteristicUUID identifier of the characteristic.
 * @returns {string} the value of the characteristic.
 * @public
 */
export const readUInt = async function (
  id: string,
  serviceUUID: string,
  characteristicUUID: string
) {
  let buffer = await read(id, serviceUUID, characteristicUUID);
  const length = buffer.length;
  const result = buffer.readUIntLE(0, length);

  return result;
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
const write = async function (
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

  // If value is a string, convert it to an ArrayBuffer.
  if (typeof value === "string") {
    value = hexStringToArrayBuffer(value);
  }

  try {
    if (withResponse) {
      console.debug(
        "[binding-Bluetooth]",
        "Invoke WriteValueWithResponse on characteristic " +
          `${characteristicUUID} with value ${value.toString()}`,
        "Bluetooth",
        id
      );
      await characteristic.writeValue(value, { offset: 0, type: "request" });
      console.debug(
        "[binding-Bluetooth]",
        "Finished WriteValueWithResponse on characteristic " +
          `${characteristicUUID} with value ${value.toString()}`,
        "Bluetooth",
        id
      );
    } else {
      console.debug(
        "[binding-Bluetooth]",
        "Invoke WriteValueWithoutResponse on characteristic " +
          `${characteristicUUID} with value ${value.toString()}`,
        "Bluetooth",
        id
      );
      await characteristic.writeValue(value, { offset: 0, type: "command" });
      console.debug(
        "[binding-Bluetooth]",
        "Finished WriteValueWithoutResponse on characteristic " +
          `${characteristicUUID} with value ${value.toString()}`,
        "Bluetooth",
        id
      );
    }
  } catch (error) {
    const errorMsg =
      "Error writing to Bluetooth device.\nMake sure the device is compatible with the connected block.";
    console.error(error);
    throw new Error(errorMsg);
  }
};

/**
 * Writes data to Bluetooth device using the gatt protocol.
 * @param {BluetoothDevice.id} id identifier of the device to write to.
 * @param {BluetoothServiceUUID} serviceUUID identifier of the service.
 * @param {BluetoothCharacteristicUUID} characteristicUUID identifier of the characteristic.
 * @param {string} value hex value to write.
 * @returns {Promise} representation of the complete request with response.
 */
export const writeWithResponse = async function (
  id: string,
  serviceUUID: string,
  characteristicUUID: string,
  value: any
) {
  // write with response
  write(id, serviceUUID, characteristicUUID, true, value);
};

/**
 * Writes data to Bluetooth device using the gatt protocol without response.
 * @param {BluetoothDevice.id} id identifier of the device to write to.
 * @param {BluetoothServiceUUID} serviceUUID identifier of the service.
 * @param {BluetoothCharacteristicUUID} characteristicUUID identifier of the characteristic.
 * @param {string} value hex value to write.
 * @returns {Promise<void>} A Promise to void.
 */
export const writeWithoutResponse = async function (
  id: string,
  serviceUUID: string,
  characteristicUUID: string,
  value: any
) {
  // write without response
  write(id, serviceUUID, characteristicUUID, false, value);
};

/**
 * Subscription functionality
 */

/**
 * Subscribes to a Bluetooth characteristic and adds an event listener.
 * @param {BluetoothDevice.id} id identifier of the device to read from.
 * @param {BluetoothServiceUUID} serviceUUID identifier of the service.
 * @param {BluetoothCharacteristicUUID} charUUID identifier of the characteristic.
 * @param {Function} handler handler to register for notifications.
 */
export const subscribe = async function (
  id: string,
  serviceUUID: string,
  charUUID: string,
  handler: any
) {
  const characteristic = await getCharacteristic(id, serviceUUID, charUUID);
  console.debug(
    `Add 'characteristicvaluechanged' listener to characteristic ${charUUID}` +
      ` of service ${serviceUUID}`,
    "Bluetooth",
    id
  );
  try {
    console.debug(
      `Invoke startNotifications on characteristic ${charUUID}` +
        ` from service ${serviceUUID}`,
      "Bluetooth",
      id
    );
    await characteristic.startNotifications();
    console.debug(
      `Finished startNotifications on characteristic ${charUUID}` +
        ` from service ${serviceUUID}`,
      "Bluetooth",
      id
    );
  } catch (error) {
    console.error(error);
    console.error(`Error subscribing to Bluetooth device ${id}`);
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
  const WoT_Service = "1fc8f811-0000-4e89-8476-e0b2dad3179b";
  const td_Char = "2ab6";

  let value = await read(id, WoT_Service, td_Char);

  await tearDown();

  return value.toString();
};
