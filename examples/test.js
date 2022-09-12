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
      sbo: 'http://example.org/simple-bluetooth-ontology#',
      bdo: 'http://example.org/binary-data-ontology#',
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
  '@type': 'Thing',
  security: ['nosec_sc'],
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
          contentType: 'application/x.ble-octet-stream',
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
          contentType: 'application/x.ble-octet-stream',
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
          contentType: 'application/x.ble-octet-stream',
        },
      ],
    },
  },
};

try {
  servient.start().then(async WoT => {
    // Consume TD
    let thing = await WoT.consume(td);

    // Connect to Device
    await Bluetooth_lib.connectThing(thing);

    // Write Property
    await thing.writeProperty('colour', {R: 0, G: 0, B: 255});

    // Disconnect Device
    await Bluetooth_lib.disconnectThing(thing);

    // Close connection
    await Bluetooth_lib.closeBluetooth();
  });
} catch (err) {
  console.error('Script error:', err);
}
