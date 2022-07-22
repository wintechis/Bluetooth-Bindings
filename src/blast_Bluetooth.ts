const noble = require('@abandonware/noble')

 const connected_devices = [] as any

function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

/**
 * Returns a paired bluetooth device by their id.
 * @param {BluetoothDevice.id} id identifier of the device to get.
 * @returns {BluetoothDevice} the bluetooth device with id.
 */
 export const getDeviceById = async function (id: any) {
    return new Promise(async function(resolve,reject){
        await noble.startScanningAsync([], false);
        console.log("[binding-Bluetooth]", "Scanning started")
        noble.on('discover', async (peripheral: any) => {
            if (peripheral.address == id){
                await noble.stopScanningAsync();
                console.log("[binding-Bluetooth]","Device found")
                resolve(peripheral)
            }
        })
        // Wait 15 seconds if not requested device not found raise error
        await delay(15000)
        await noble.stopScanningAsync();
        throw Error(`Bluetooth device ${id} wasn't found.`)

    })
};

/**
 * Sends a connect command.
 * @param {BluetoothDevice.id} id identifier of the device to connect to.
 * @return {Promise<Object>} representation of the complete request with response.
 */
 const connect = async function (id: string) {
    try {
        const device = await getDeviceById(id) as any;
        //const thingsLog = getThingsLog();
        console.log("[binding-Bluetooth]",`Connecting to ${id}`, 'Bluetooth');
        await device.connectAsync();
        connected_devices.push(device)
        return device
        
    } catch (error) {
        throw Error(`Error connecting to Bluetooth device ${id}`);
        console.error(error);
    }
};


async function get_service(peripheral: any, serviceUUID: any){
    let serviceUUIDwo = serviceUUID.split('-').join('')
    const services = await peripheral.discoverServicesAsync([]);

    // Get service
    for (let i = 0; i < services.length; i++) {
        if (services[i].uuid == serviceUUIDwo){
            return services[i]
        }
    }
    throw Error("Service not found!")
}

/**
 * Returns a promise to the primary BluetoothRemoteGATTService offered by
 * the bluetooth device for a specified BluetoothServiceUUID.
 * @param {BluetoothDevice.id} id identifier of the device to get the service from.
 * @param {BluetoothServiceUUID} serviceUUID identifier of the service.
 * @returns {Promise<BluetoothRemoteGATT>} A BluetoothRemoteGATTService object.
 */
const getPrimaryService = async function (id: any, serviceUUID: any) {
    const device = await connect(id);
    let service;
    try {
        //const thingsLog = getThingsLog();
        console.log("[binding-Bluetooth]",
            `Getting primary service ${serviceUUID}`,
            'Bluetooth',
            id
        );
        service = await get_service(device, serviceUUID);
        console.log("[binding-Bluetooth]",
            `Got primary service ${serviceUUID}`,
            'Bluetooth',
            id
        );
    } catch (error) {
        console.error(error);
        throw new Error(`No Services Matching UUID ${serviceUUID} found in Device.`);
    }
    return service;
};


async function get_char(service: any, characteristicUUID: any){
    let characteristicUUIDwo = characteristicUUID.split('-').join('')

    const characteristics = await service.discoverCharacteristicsAsync([]);
    
    for (let i = 0; i < characteristics.length; i++) {
        if(characteristics[i].uuid == characteristicUUIDwo){

            return characteristics[i]
        }
    }
}

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
    id: any,
    serviceUUID: any,
    characteristicUUID: any
) {
    const service = await getPrimaryService(id, serviceUUID);
    if (!service) {
        return;
    }
    let characteristic;
    try {
        //const thingsLog = getThingsLog();
        console.log("[binding-Bluetooth]",
            `Getting characteristic ${characteristicUUID} from service ${serviceUUID}`,
            'Bluetooth',
            id
        );
        characteristic = await get_char(service, characteristicUUID);
        console.log("[binding-Bluetooth]",
            `Got characteristic ${characteristicUUID} from service ${serviceUUID}`,
            'Bluetooth',
            id
        );
    } catch (error) {
        console.error(error);
        throw new Error('The device is not compatible with the connected block.');
    }
    return characteristic;
};

/**
 * Reads data from Bluetooth device using the gatt protocol.
 * @param {BluetoothDevice.id} id identifier of the device to read from.
 * @param {BluetoothServiceUUID} serviceUUID identifier of the service.
 * @param {BluetoothCharacteristicUUID} characteristicUUID identifier of the characteristic.
 * @return {Promise} representation of the complete request with response.
 * @public
 */
export const read = async function (id: any, serviceUUID: any, characteristicUUID: any) {
    const characteristic = await getCharacteristic(
        id,
        serviceUUID,
        characteristicUUID
    );
    try {
        //const thingsLog = getThingsLog();
        console.log("[binding-Bluetooth]",
            `Invoke ReadValue on characteristic ${characteristicUUID}` +
            ` from service ${serviceUUID}`,
            'Bluetooth',
            id
        );
        const value = await characteristic.readAsync();
        console.log("[binding-Bluetooth]",
            `Finished ReadValue on characteristic ${characteristicUUID}` +
            ` from service ${serviceUUID} - value: ${value.toString()}`,
            'Bluetooth',
            id
        );
        return value;
    } catch (error) {
        console.error(error);
        throw new Error(`Error reading from Bluetooth device ${id}`);
    }
};

/**
 * Reads a hexadecimal characteristic value from a Bluetooth device.
 * @param {BluetoothDevice.id} id identifier of the device to read from.
 * @param {BluetoothServiceUUID} serviceUUID identifier of the service.
 * @param {BluetoothCharacteristicUUID} characteristicUUID identifier of the characteristic.
 * @returns {string} the value of the characteristic.
 * @public
 */
export const readNumber = async function (id: any, serviceUUID: any, characteristicUUID: any) {
    let buffer = await read(id, serviceUUID, characteristicUUID);
    const length = buffer.length;
    const result = buffer.readUIntLE(0, length);
  
    return result;
};

/**
 * Writes data to Bluetooth device using the gatt protocol.
 * @param {BluetoothDevice.id} id identifier of the device to write to.
 * @param {BluetoothServiceUUID} serviceUUID identifier of the service.
 * @param {BluetoothCharacteristicUUID} characteristicUUID identifier of the characteristic.
 * @param {string} value hex value to write.
 * @returns {Promise<void>} A Promise to void.
 */
 export const writeWithoutResponse = async function (
    id: any,
    serviceUUID: any,
    characteristicUUID: any,
    value: any
  ) {
    const characteristic = await getCharacteristic(
      id,
      serviceUUID,
      characteristicUUID
    );
    if (!characteristic) {
      return;
    }
  
    // If value is a string, convert it to an ArrayBuffer.
    if (typeof value === 'string') {
      value = hexStringToArrayBuffer(value);
    }
  
    try {
      //const thingsLog = getThingsLog();
      console.log("[binding-Bluetooth]",
        'Invoke WriteValueWithoutResponse on characteristic ' +
          `${characteristicUUID} with value ${value.toString()}`,
        'Bluetooth',
        id
      );
      await characteristic.writeAsync(value, true);
      console.log("[binding-Bluetooth]",
        'Finished WriteValueWithoutResponse on characteristic ' +
          `${characteristicUUID} with value ${value.toString()}`,
        'Bluetooth',
        id
      );
    } catch (error) {
      const errorMsg =
        'Error writing to Bluetooth device.\nMake sure the device is compatible with the connected block.';
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
    id: any,
    serviceUUID: any,
    characteristicUUID: any,
    value: any
  ) {
    const characteristic = await getCharacteristic(
      id,
      serviceUUID,
      characteristicUUID
    );
    if (!characteristic) {
      return;
    }
  
    // If value is a string, convert it to an ArrayBuffer.
    if (typeof value === 'string') {
      value = hexStringToArrayBuffer(value);
    }
  
    try {
      console.log("[binding-Bluetooth]",
        'Invoke WriteValueWithResponse on characteristic ' +
          `${characteristicUUID} with value ${value.toString()}`,
        'Bluetooth',
        id
      );
      await characteristic.writeAsync(value, false);
      console.log("[binding-Bluetooth]",
        'Finished WriteValueWithResponse on characteristic ' +
          `${characteristicUUID} with value ${value.toString()}`,
        'Bluetooth',
        id
      );
    } catch (error) {
      const errorMsg =
        'Error writing to Bluetooth device.\nMake sure the device is compatible with the connected block.';
      console.error(error);
      throw new Error(errorMsg);
    }
  };

  /**
 * Convert a hex string to an ArrayBuffer.
 *
 * @param {string} hexString - hex representation of bytes
 * @return {ArrayBuffer} - The bytes in an ArrayBuffer.
 */
const hexStringToArrayBuffer = function (hexString: any) {
    // remove the leading 0x
    hexString = hexString.replace(/^0x/, '');
    
    // check for some non-hex characters
    const bad = hexString.match(/[G-Z\s]/i);
    if (bad) {
      console.log('WARNING: found non-hex characters', bad, 'trying to correct');
    }
    
    hexString = hexString.replace(/[^\w\s]/gi, '') // special char and white space
    hexString = hexString.replace(/[G-Z\s]/i, '')
  
    // ensure even number of characters
    if (hexString.length % 2 !== 0) {
      hexString = '0' + hexString;
    }

    hexString = Buffer.from(hexString, "hex")
    
    return hexString
  };


export const tearDown = async function () {
    for (const element of connected_devices) {
        console.log("[binding-Bluetooth]","Disconnecting from Device:", element.address)
        await element.disconnectAsync();
      }
    // Remove all items from connected_devices
    connected_devices.length = 0
}

export const get_td_from_device = async function(MAC: string) {
  const WoT_Service = "1fc8f811-0000-4e89-8476-e0b2dad3179b"
  const td_Char = "2ab6"

  let value = await read(MAC, WoT_Service, td_Char)

  await tearDown()

  return value.toString()
  
}

