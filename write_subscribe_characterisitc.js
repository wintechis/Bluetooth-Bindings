const { createBluetooth } = require('node-ble');
var TEST_DEVICE = '5C:F3:70:A0:87:03';
var TEST_SERVICE = '1fc8f811-0000-4e89-8476-e0b2dad3179b';
var TEST_CHARACTERISTIC_SUB = '1fc8f811-0100-4e89-8476-e0b2dad3179b';
var TEST_CHARACTERISTIC_READ = '1fc8f811-0001-4e89-8476-e0b2dad3179b';
var TEST_CHARACTERISTIC_INC = '1fc8f811-0010-4e89-8476-e0b2dad3179b';



function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function main() {
    
    // Read the characterisitic of the given device

    const { bluetooth, destroy } = createBluetooth();
    console.log("CREATE")
    // get bluetooth adapter
    const adapter = await bluetooth.defaultAdapter();
    await adapter.startDiscovery();
    console.log("Start Discovery")

    // get device and connect
    const device = await adapter.waitDevice(TEST_DEVICE);
    console.log(device);
    console.log('got device', await device.getAddress(), await device.getName());
    await device.connect();
    console.log('connected');
    const gattServer = await device.gatt()
    console.log(gattServer.services());

    // read value
    const service1 = await gattServer.getPrimaryService(TEST_SERVICE.toLowerCase());
    const characteristic1 = await service1.getCharacteristic(TEST_CHARACTERISTIC_SUB.toLowerCase());
    const characteristic2 = await service1.getCharacteristic(TEST_CHARACTERISTIC_READ.toLowerCase());
    const characteristic3 = await service1.getCharacteristic(TEST_CHARACTERISTIC_INC.toLowerCase());

    setTimeout(async () => {
        const buffer = await characteristic2.readValue();
        var buf = Buffer.alloc(1);
        buf.writeInt8(1)
        await characteristic3.writeValue(buf);
        console.log("WRITE")
    
    }, 3000);

    await characteristic1.startNotifications();
    console.log("NOTIFY")
    await new Promise(done => {
        characteristic1.on('valuechanged', buffer => {
            console.log('subscription', buffer)
            console.log('read', buffer, buffer.toString());
            done()
        })
    })

    await sleep(7000)
    await characteristic1.stopNotifications()
    console.log("STOPP")
    destroy();


}



sleep(5000).then(() => main());




