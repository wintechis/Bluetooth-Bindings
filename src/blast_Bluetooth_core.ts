/**
 * Handle basic bluetooth communication and discovery.
 */

const { createBluetooth } = require("node-ble");

const { bluetooth, destroy } = createBluetooth();

const connected_devices = [] as any;
const connected_macs = [] as any;

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
      console.log("[binding-Bluetooth]", "Scanning started");

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

    Promise.race([promise1, promise2]).then((device) => {
      if (typeof device === "undefined") {
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
    if (connected_macs.includes(id)) {
      console.log(
        "[binding-Bluetooth]",
        `Device ${id} already connected`,
        "Bluetooth"
      );
      return connected_devices[connected_macs.indexOf(id)];
    } else {
      const device = (await getDeviceById(id)) as any;
      console.log("[binding-Bluetooth]", `Connecting to ${id}`, "Bluetooth");
      await device.connect();
      connected_devices.push(device);
      connected_macs.push(id);
      return device;
    }
  } catch (error) {
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
  const device = await connect(id);
  const gattServer = await device.gatt();

  let service;
  try {
    console.log(
      "[binding-Bluetooth]",
      `Getting primary service ${serviceUUID}`,
      "Bluetooth",
      id
    );

    service = await gattServer.getPrimaryService(serviceUUID);

    console.log(
      "[binding-Bluetooth]",
      `Got primary service ${serviceUUID}`,
      "Bluetooth",
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
    //const thingsLog = getThingsLog();
    console.log(
      "[binding-Bluetooth]",
      `Getting characteristic ${characteristicUUID} from service ${serviceUUID}`,
      "Bluetooth",
      id
    );
    characteristic = await service.getCharacteristic(
      characteristicUUID.toLowerCase()
    );
    console.log(
      "[binding-Bluetooth]",
      `Got characteristic ${characteristicUUID} from service ${serviceUUID}`,
      "Bluetooth",
      id
    );
  } catch (error) {
    console.error(error);
    throw new Error("The device has not the specified characteristic.");
  }
  return characteristic;
};

/**
 * Convert a hex string to an ArrayBuffer.
 *
 * @param {string} hexString - hex representation of bytes
 * @return {ArrayBuffer} - The bytes in an ArrayBuffer.
 */
export const hexStringToArrayBuffer = function (hexString: any) {
  // remove the leading 0x
  hexString = hexString.replace(/^0x/, "");

  // check for some non-hex characters
  const bad = hexString.match(/[G-Z\s]/i);
  if (bad) {
    console.log("WARNING: found non-hex characters", bad, "trying to correct");
  }

  hexString = hexString.replace(/[^\w\s]/gi, ""); // special char and white space
  hexString = hexString.replace(/[G-Z\s]/i, "");

  // ensure even number of characters
  if (hexString.length % 2 !== 0) {
    hexString = "0" + hexString;
  }

  hexString = Buffer.from(hexString, "hex");

  return hexString;
};

export const closeBluetooth = async function () {
  await tearDown();
  destroy();
};

export const tearDown = async function () {
  for (const element of connected_devices) {
    console.log(
      "[binding-Bluetooth]",
      "Disconnecting from Device:",
      element.device
    );
    await element.disconnect();
  }
  // Remove all items from connected_devices
  connected_devices.length = 0;
  connected_macs.length = 0;
};

/**
 * Should be in sperate file
 **/
