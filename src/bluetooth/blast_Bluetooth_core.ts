/**
 * Handle basic bluetooth communication and discovery.
 */

const {createBluetooth} = require('node-ble');

import {stay_connected_arr, cons} from './blast_Bluetooth';

export const {bluetooth, destroy} = createBluetooth();

/**
 * Returns a paired bluetooth device by their id.
 * @param {BluetoothDevice.id} id identifier of the device to get.
 * @returns {BluetoothDevice} the bluetooth device with id.
 */
export const getDeviceById = async function (id: string) {
  return new Promise(async function (resolve, reject) {
    async function getDevice() {
      // get bluetooth adapter
      const adapter = await bluetooth.defaultAdapter();

      if (!(await adapter.isDiscovering())) {
        await adapter.startDiscovery();
      }
      console.debug('[binding-Bluetooth]', 'Scanning started');

      const device = await adapter.waitDevice(id);
      return device;
    }

    // Promise Race
    const promise1 = new Promise((resolve, reject) => {
      resolve(getDevice());
    });

    const promise2 = new Promise((resolve, reject) => {
      setTimeout(resolve, 15000, undefined);
    });

    Promise.race([promise1, promise2]).then(device => {
      if (typeof device === 'undefined') {
        throw Error(`Bluetooth device ${id} wasn't found.`);
      }
      resolve(device);
    });
  });
};

/**
 * Sends a connect command.
 * @param {BluetoothDevice.id} id identifier of the device to connect to.
 * @return {Promise<Object>} representation of the complete request with response.
 */
const connect = async function (id: string) {
  // Check if already connected
  try {
    if (id in cons) {
      console.debug(
        '[binding-Bluetooth]',
        `Device ${id} already connected`,
        'Bluetooth'
      );

      // return GattServer of device with id
      return cons[id][1];
    } else {
      const device: any = await getDeviceById(id);
      console.debug('[binding-Bluetooth]', `Connecting to ${id}`, 'Bluetooth');
      await device.connect();
      const gattServer = await device.gatt();

      // Save connection
      cons[id] = [device, gattServer];

      return gattServer;
    }
  } catch (error) {
    console.log(error);
    throw Error(`Error connecting to Bluetooth device ${id}`);
  }
};

/**
 * Returns a promise to the primary BluetoothRemoteGATTService offered by
 * the bluetooth device for a specified BluetoothServiceUUID.
 * @param {BluetoothDevice.id} id identifier of the device to get the service from.
 * @param {BluetoothServiceUUID} serviceUUID identifier of the service.
 * @returns {Promise<BluetoothRemoteGATT>} A BluetoothRemoteGATTService object.
 */
const getPrimaryService = async function (id: string, serviceUUID: string) {
  const gattServer = await connect(id);

  let service;
  try {
    service = await gattServer.getPrimaryService(serviceUUID);

    console.debug(
      '[binding-Bluetooth]',
      `Got primary service ${serviceUUID}`,
      'Bluetooth',
      id
    );
  } catch (error) {
    console.error(error);
    throw new Error(
      `No Services Matching UUID ${serviceUUID} found in Device.`
    );
  }
  return service;
};

/**
 * Returns a promise to the BluetoothRemoteGATTCharacteristic offered by
 * the bluetooth device for a specified BluetoothServiceUUID and
 * BluetoothCharacteristicUUID.
 * @param {BluetoothDevice.id} id identifier of the device to get the characteristic from.
 * @param {BluetoothServiceUUID} serviceUUID identifier of the service.
 * @param {BluetoothCharacteristicUUID} characteristicUUID identifier of the characteristic.
 * @returns {Promise<BluetoothRemoteGATTCharacteristic>} A BluetoothRemoteGATTCharacteristic object.
 */
export const getCharacteristic = async function (
  id: string,
  serviceUUID: string,
  characteristicUUID: string
) {
  const service: any = await getPrimaryService(id, serviceUUID);
  if (!service) {
    return;
  }
  let characteristic;
  try {
    characteristic = await service.getCharacteristic(
      characteristicUUID.toLowerCase()
    );
    console.debug(
      '[binding-Bluetooth]',
      `Got characteristic ${characteristicUUID} from service ${serviceUUID}`,
      'Bluetooth',
      id
    );
  } catch (error) {
    console.error(error);
    throw new Error('The device has not the specified characteristic.');
  }
  return Promise.resolve(characteristic);
};
