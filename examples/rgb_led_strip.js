// client.js
// Required steps to create a servient for a client
const {Servient} = require('@node-wot/core');
const Bluetooth_client_factory = require('../dist/src/Bluetooth-client-factory');
const Bluetooth_lib = require('../dist/src/bluetooth/Bluetooth_lib');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const servient = new Servient();
servient.addClientFactory(new Bluetooth_client_factory.default());

const td = {
  '@context': [
    'https://www.w3.org/2019/wot/td/v1',
    'https://www.w3.org/2022/wot/td/v1.1',
    {
      sbo: 'https://freumi.inrupt.net/SimpleBluetoothOntology.ttl#',
      bdo: 'https://freumi.inrupt.net/BinaryDataOntology.ttl#',
      qudt: '',
      qudtUnit: '',
    },
    {'@language': 'en'},
  ],
  title: 'BLE RGB Controller',
  description:
    'A Bluetooth Low Energy (BLE) controller that can be used to control RGB LED lights.',
  securityDefinitions: {
    nosec_sc: {
      scheme: 'nosec',
    },
  },
  '@type': ['Thing', 'sbo:BluetoothLEDevice'],
  security: ['nosec_sc'],
  
  'sbo:hasGAPRole': 'sbo:Peripheral',
  'sbo:isConnectable': true,
  'sbo:hasAdvertisingIntervall': {
    'qudt:numericValue': 50,
    'qutdUnit:unit': 'qudtUnit:MilliSEC',
  },

  properties: {
    colour: {
      type: 'string',
      format: 'hex',

      observable: false,
      readOnly: false,
      writeOnly: true,
      description: 'The colour of the LED light.',

      'bdo:pattern': '7e000503{R}{G}{B}00ef',
      'bdo:variables': {
        R: {
          type: 'integer',
          'bdo:bytelength': 1,
          minimum: 0,
          maximum: 255,
        },
        G: {
          type: 'integer',
          'bdo:bytelength': 1,
          minimum: 0,
          maximum: 255,
        },
        B: {
          type: 'integer',
          'bdo:bytelength': 1,
          minimum: 0,
          maximum: 255,
        },
      },
      forms: [
        {
          href: 'gatt://BE-58-30-00-CC-11/0000fff0-0000-1000-8000-00805f9b34fb/0000fff3-0000-1000-8000-00805f9b34fb',
          op: ['writeproperty'],
          'sbo:methodName': 'sbo:write',
          contentType: 'application/x.binary-data-stream',
        },
      ],
    },

    power: {
      type: 'string',
      format: 'hex',

      observable: false,
      readOnly: false,
      writeOnly: true,
      description: 'The power switch of the controller.',

      'bdo:pattern': '7e0004{is_on}00000000ef',
      'bdo:variables': {
        is_on: {
          type: 'integer',
          minimum: 0,
          maximum: 1,
          'bdo:bytelength': 1,
        },
      },
      forms: [
        {
          href: 'gatt://BE-58-30-00-CC-11/0000fff0-0000-1000-8000-00805f9b34fb/0000fff3-0000-1000-8000-00805f9b34fb',
          op: ['writeproperty'],
          'sbo:methodName': 'sbo:write',
          contentType: 'application/x.binary-data-stream',
        },
      ],
    },

    effect: {
      type: 'string',
      format: 'hex',

      observable: false,
      readOnly: false,
      writeOnly: true,
      description: 'The effect of the LED light.',

      'bdo:pattern': '7e0003{type}03000000ef',
      'bdo:variables': {
        type: {
          type: 'integer',
          minimum: 128,
          maximum: 156,
          'bdo:bytelength': 1,
        },
      },
      forms: [
        {
          href: 'gatt://BE-58-30-00-CC-11/0000fff0-0000-1000-8000-00805f9b34fb/0000fff3-0000-1000-8000-00805f9b34fb',
          op: ['writeproperty'],
          'sbo:methodName': 'sbo:write',
          contentType: 'application/x.binary-data-stream',
        },
      ],
    },
  },
};

try {
  servient.start().then(async WoT => {
    let thing = await WoT.consume(td);

    // Connect to Device
    await Bluetooth_lib.connectThing(thing);

    // Write Effect
    await thing.writeProperty('effect', {type: 156});
    await sleep(3000);

    // Power off
    await thing.writeProperty('power', {is_on: 0});
    await sleep(3000);

    // Power on
    await thing.writeProperty('power', {is_on: 1});
    await sleep(3000);

    // Change color to RGB
    await thing.writeProperty('colour', {R: 255, G: 0, B: 0});
    await sleep(3000);
    await thing.writeProperty('colour', {R: 0, G: 255, B: 0});
    await sleep(3000);

    await thing.writeProperty('colour', {R: 0, G: 0, B: 255});
    await sleep(3000);

    // Close connection
    await Bluetooth_lib.close();
  });
} catch (err) {
  console.error('Script error:', err);
}
