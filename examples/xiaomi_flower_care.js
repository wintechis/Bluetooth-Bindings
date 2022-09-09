// client.js
// Required steps to create a servient for a client
const {Servient} = require('@node-wot/core');
const { default: consumedThing } = require('@node-wot/core/dist/consumed-thing');
const { callbackify } = require('util');
const Bluetooth_client_factory = require('../dist/src/Bluetooth-client-factory');
const blast_Bluetooth = require('../dist/src/bluetooth/blast_Bluetooth');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const servient = new Servient();
servient.addClientFactory(new Bluetooth_client_factory.default());

const td = {
    '@context': [
      'https://www.w3.org/2019/wot/td/v1',
      'https://www.w3.org/2022/wot/td/v1.1',
      {sbo: 'http://example.org/simple-bluetooth-ontology#',
       bdo: 'http://example.org/binary-data-ontology#'},
      {'@language': 'en'},
    ],
    title: 'Flower',
    description: 'A Xiaomi Flower Care Sensor.',
    securityDefinitions: {
      nosec_sc: {
        scheme: 'nosec',
      },
    },
    '@type': 'Thing',
    security: ['nosec_sc'],
    properties: {
        valueString: {
        type: 'string',
        format: "hex",

        observable: false,
        readOnly: true,
        writeOnly: false,
        description: 'The Values of the device',
  
        //'bdo:bytelength': 1,
        forms: [
          {
            href: 'gatt://C4-7C-8D-6D-36-2D/00001204-0000-1000-8000-00805f9b34fb/00001a01-0000-1000-8000-00805f9b34fb',
            op: 'readproperty',
            'sbo:methodName': 'sbo:read',
            contentType: 'application/x.ble-octet-stream',
          },
        ],
      },
    },
    actions: {
        writeMode: {
        type: 'string',
        observable: false,
        readOnly: false,
        writeOnly: true,
        description: 'Enable write mode',
        

        input: {
          type: 'string',
          format: "hex",
          enum: ["A01F"],
          'bdo:bytelength': 2,
        },

        forms: [
          {
            href: 'gatt://C4-7C-8D-6D-36-2D/00001204-0000-1000-8000-00805f9b34fb/00001a00-0000-1000-8000-00805f9b34fb',
            op: 'invokeaction',
            'sbo:methodName': 'sbo:write',
            contentType: 'application/x.ble-octet-stream',
          },
        ],
      },
    },
  };


try {
  servient.start().then(async WoT => {
    await sleep(5000)
    let thing = await WoT.consume(td);

    blast_Bluetooth.stayConnected(thing, true);

      // Write Effect
      await thing.invokeAction('writeMode', "A01F");
      //await sleep(3000);

      // Power off
      let val = await thing.readProperty('valueString');
      val = await val.value()
      console.log("RAW", val)
      let temp = val.slice(2,4)
      temp = parseInt(temp + val.slice(0,2), 16)/10
      console.log("TEMP (C)", temp)

      
      let brightness = val.slice(12,14)
      brightness = brightness + val.slice(10,12)
      brightness = brightness + val.slice(8,10)
      brightness = brightness + val.slice(6,8)

      brightness = parseInt(brightness, 16)
      console.log("Brightness (LUX)", brightness)


      let moisture = parseInt(val.slice(14,16), 16)
      console.log("MOISTURE:", moisture)

      let conduct = val.slice(18,20)
      conduct = conduct + val.slice(16,18)
      conduct = parseInt(conduct, 16)
      console.log("CONDUCT, µS/cm",conduct)

      //await sleep(3000);

      // Close connection
    await blast_Bluetooth.closeBluetooth();
  });
} catch (err) {
  console.error('Script error:', err);
}