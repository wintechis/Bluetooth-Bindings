/**
 * Handle basic bluetooth communication and discovery.
 */

const {createBluetooth} = require('node-ble');
export const {bluetooth, destroy} = createBluetooth();

import {deconstructForm} from '../Bluetooth-client';

// object to store connection details
export let connection_established_obj: Record<string, any> = {};

/**
 * Returns a the default adapter instance.
 * @returns {Adapter} instance of default adapter.
 */
export const getAdapter = async function () {
  const adapter = await bluetooth.defaultAdapter();
  return adapter;
};

/**
 * Starts a scan operation
 */
export const startScan = async function () {
  const adapter = await getAdapter();

  if (!(await adapter.isDiscovering())) {
    await adapter.startDiscovery();
    console.debug('[binding-Bluetooth]', 'Scanning started');
  } else {
    console.debug('[binding-Bluetooth]', 'Scanning already in progress');
  }
};

/**
 * Stops an ongoing scan operation
 */
export const stopScan = async function () {
  const adapter = await getAdapter();

  if (await adapter.isDiscovering()) {
    await adapter.stopDiscovery();
    console.debug('[binding-Bluetooth]', 'Scanning stopped');
  } else {
    console.debug('[binding-Bluetooth]', 'Scanning already stopped');
  }
};

/**
 * Gets the current status of the adapter
 * @returns {boolean} indicates if discovery is active.
 */
export const getAdapterStatus = async function () {
  const adapter = await getAdapter();
  const status = await adapter.isDiscovering();
  return status;
};

/**
 * Returns a paired bluetooth device by their id.
 * @param {BluetoothDevice.id} id identifier of the device to get.
 * @returns {BluetoothDevice} the bluetooth device with id.
 */
export const getDeviceById = async function (id: string) {
  return new Promise(async function (resolve, reject) {
    async function getDevice() {
      // get bluetooth adapter
      const adapter = await getAdapter();

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
export const connect = async function (id: string) {
  try {
    // Check if already connected
    if (id in connection_established_obj) {
      // return GattServer of device with id
      return connection_established_obj[id][1];
    } else {
      const device: any = await getDeviceById(id);
      console.debug('[binding-Bluetooth]', `Connecting to Device ${id}`);
      await device.connect();
      const gattServer = await device.gatt();

      // Save connection
      connection_established_obj[id] = [device, gattServer];

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
  let gattServer;
  try {
    gattServer = connection_established_obj[id][1];
  } catch (error) {
    throw new Error(`Device ${id} is not connected.`);
  }

  let service;
  try {
    service = await gattServer.getPrimaryService(serviceUUID);
    
  } catch (error) {
    console.error(error);
    throw new Error(
      `No Services Matching UUID ${serviceUUID} found in Device ${id}.`
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
      `Got characteristic ${characteristicUUID} from service ${serviceUUID} of Device ${id}`
    );
  } catch (error) {
    console.error(error);
    throw new Error('The device has not the specified characteristic.');
  }
  return Promise.resolve(characteristic);
};

/**
 * Connects ta a selected device based on a Thing object.
 * @param {object} Thing Thing instance of device.
 */
export const connectThing = async function (Thing: any) {
  // Get MAC of Thing
  const mac = extractMac(Thing);

  // Check if discovery is active
  if ((await getAdapterStatus()) === false) {
    startScan();
  }

  // Connect
  await connect(mac);
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
  destroy();
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
