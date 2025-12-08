/**
 * Handle basic bluetooth communication and discovery.
 */

import {createBluetooth} from 'node-ble';
import {deconstructForm} from '../Bluetooth-client';
import debug from 'debug';

// Create a logger with a specific namespace
const log = debug('binding-Bluetooth');

type BLEPair = ReturnType<typeof createBluetooth>;

let ble: BLEPair = createBluetooth();
let _bluetooth = ble.bluetooth;
let _destroy = ble.destroy;
let _destroyed = false;

// re-create the node-ble pair (DBus connection + API)
export const reinit = () => {
  ble = createBluetooth();
  _bluetooth = ble.bluetooth;
  _destroy = ble.destroy;
  _destroyed = false;
  log('BLE reinitialized');
};

// internal helper to ensure connection is alive
const ensureAlive = () => {
  if (_destroyed) reinit();
  return _bluetooth;
};

// object to store connection details
export let connection_established_obj: Record<string, any> = {};

/**
 * Returns a the default adapter instance.
 * @returns {Adapter} instance of default adapter.
 */
export const getAdapter = async function () {
  const adapter = await ensureAlive().defaultAdapter();
  return adapter;
};

/**
 * Starts a scan operation
 */
export const startScan = async function () {
  const adapter = await getAdapter();
  if (!(await adapter.isDiscovering())) {
    await adapter.startDiscovery();
    log('Scanning started');
  } else {
    log('Scanning already in progress');
  }
};

/**
 * Stops an ongoing scan operation
 */
export const stopScan = async function () {
  const adapter = await getAdapter();
  if (await adapter.isDiscovering()) {
    await adapter.stopDiscovery();
    log('Scanning stopped');
  } else {
    log('Scanning already stopped');
  }
};

/**
 * Gets the current status of the adapter
 * @returns {boolean} indicates if discovery is active.
 */
export const getAdapterStatus = async function () {
  const adapter = await getAdapter();
  return adapter.isDiscovering();
};

/**
 * Returns a paired bluetooth device by their id.
 * @param {BluetoothDevice.id} id identifier of the device to get.
 * @returns {BluetoothDevice} the bluetooth device with id.
 */
export const getDeviceById = async function (id: string, timeoutMs = 15000) {
  const adapter = await getAdapter();
  // race waitDevice against timeout
  return (await Promise.race([
    adapter.waitDevice(id),
    new Promise((_, rej) =>
      setTimeout(
        () =>
          rej(
            new Error(
              `Bluetooth device ${id} wasn't found within ${timeoutMs}ms`
            )
          ),
        timeoutMs
      )
    ),
  ])) as any; // node-ble device
};

/**
 * Sends a connect command.
 * @param {BluetoothDevice.id} id identifier of the device to connect to.
 * @return {Promise<Object>} representation of the complete request with response.
 */
export const connect = async function (id: string) {
  try {
    if (id in connection_established_obj) {
      return connection_established_obj[id][1]; // gattServer
    } else {
      // make sure discovery is running while we wait (optional but helpful)
      const discovering = await getAdapterStatus();
      if (!discovering) await startScan();

      const device: any = await getDeviceById(id);
      log(`Connecting to Device ${id}`);
      await device.connect();
      const gattServer = await device.gatt();

      // stop scanning once connected
      if (await getAdapterStatus()) await stopScan();

      connection_established_obj[id] = [device, gattServer];
      return gattServer;
    }
  } catch (error) {
    console.error(error);
    throw new Error(`Error connecting to Bluetooth device ${id}`);
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
  const entry = connection_established_obj[id];
  if (!entry) throw new Error(`Device ${id} is not connected.`);
  const gattServer = entry[1];

  try {
    const service = await gattServer.getPrimaryService(serviceUUID);
    return service;
  } catch (error) {
    console.error(error);
    throw new Error(
      `No Services Matching UUID ${serviceUUID} found in Device ${id}.`
    );
  }
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
  if (!service) return;
  try {
    const characteristic = await service.getCharacteristic(
      characteristicUUID.toLowerCase()
    );
    log(
      `Got characteristic ${characteristicUUID} from service ${serviceUUID} of Device ${id}`
    );
    return characteristic;
  } catch (error) {
    console.error(error);
    throw new Error('The device has not the specified characteristic.');
  }
};

/**
 * Connects ta a selected device based on a Thing object.
 * @param {object} Thing Thing instance of device.
 */
export const connectThing = async function (Thing: any) {
  const mac = extractMac(Thing);
  await connect(mac);
};

/**
 * Disconnects from a selected device based on a Thing object.
 * @param {object} Thing Thing instance of device.
 */
export const disconnectThing = async function (Thing: any) {
  const mac = extractMac(Thing);
  await disconnectByMac(mac);
};

/**
 * Disconnects from a selected device based on a mac address.
 * @param {string} id identifier of the device to read from.
 */
export const disconnectByMac = async function (id: string) {
  const entry = connection_established_obj[id];
  if (entry) {
    const device = entry[0];
    await device.disconnect();
    log('Disconnecting from Device:', id);
    delete connection_established_obj[id];
  }
};

/**
 * Disconnects from all connected devices.
 */
export const disconnectAll = async function () {
  for (const [key, value] of Object.entries(connection_established_obj)) {
    log('Disconnecting from Device:', key);
    await value[0].disconnect();
  }
  for (const key in connection_established_obj) {
    delete connection_established_obj[key];
  }
};

/**
 * Disconnects from all connected devices and stops all operations by node-ble.
 * Needed to exit programm after execution.
 */
export const close = async function () {
  // stop discovery (ignore errors during teardown)
  try {
    if (await getAdapterStatus()) {
      await stopScan();
    }
  } catch (e) {
    log('stopScan failed (ignoring):', e);
  }

  await disconnectAll();

  // tear down node-ble (closes DBus)
  try {
    _destroy();
  } catch (e) {
  } finally {
    _destroyed = true;
    log('BLE destroyed');
  }
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
      let element = Thing.actions[`${key}`];
      let form = element.forms[0];
      let deconstructedForm = deconstructForm(form);
      mac = deconstructedForm.deviceId;
      break;
    }
  }

  if (mac === '') {
    for (const [key, value] of Object.entries(Thing.events)) {
      let element = Thing.events[`${key}`];
      let form = element.forms[0];
      let deconstructedForm = deconstructForm(form);
      mac = deconstructedForm.deviceId;
      break;
    }
  }

  return mac;
};
