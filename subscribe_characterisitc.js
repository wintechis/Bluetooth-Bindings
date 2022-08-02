const { createBluetooth } = require('node-ble');
var TEST_DEVICE = '38:00:25:8A:B3:BB';
var TEST_SERVICE = '1fc8f811-0000-4e89-8476-e0b2dad3179b';
var TEST_CHARACTERISTIC = '1fc8f811-0100-4e89-8476-e0b2dad3179b';

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

async function main() {
    // Read the characterisitic of the given device

    const { bluetooth, destroy } = createBluetooth();

    // get bluetooth adapter
    const adapter = await bluetooth.defaultAdapter();
    await adapter.startDiscovery();

    // get device and connect
    const device = await adapter.waitDevice(TEST_DEVICE);
    console.log('got device', await device.getAddress(), await device.getName());
    await device.connect();
    console.log('connected');
    const gattServer = await device.gatt()
    console.log(gattServer.services());

    // read value
    const service1 = await gattServer.getPrimaryService(TEST_SERVICE.toLowerCase());
    const characteristic1 = await service1.getCharacteristic(TEST_CHARACTERISTIC.toLowerCase());
    const buffer = await characteristic1.startNotifications();

    characteristic1.on('valuechanged', (buffer) => {
          console.log('subscription', buffer)
          console.log('read', buffer, buffer.toString());
          done()
    })


    const service2 = await gattServer.getPrimaryService(TEST_SERVICE.toLowerCase());
    const characteristic2 = await service2.getCharacteristic("1fc8f811-0010-4e89-8476-e0b2dad3179b");
    await characteristic2.writeValue(Buffer.from("0"))

    await sleep(3000);
    await characteristic2.writeValue(Buffer.from("1"))


    setTimeout(async () => {
        await characteristic1.stopNotifications()
        destroy();
    },40000);
    

}

main();




