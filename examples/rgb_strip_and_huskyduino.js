/*
Check if face Huskyduino recognizes face with ID 1.
If 1 is detected, turn rgb strip to green else to red
Devices: Huskyduino, rgb_led_strip
Note: Adjust mac in TD, Huskyduino must have learned face with ID 1
*/

const {Servient} = require('@node-wot/core');
const Bluetooth_client_factory = require('../dist/src/Bluetooth-client-factory');
const blast_Bluetooth_core = require('../dist/src/bluetooth/blast_Bluetooth_core');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const servient = new Servient();
servient.addClientFactory(new Bluetooth_client_factory.default());

const td_husky = {
  '@context': [
    'https://www.w3.org/2019/wot/td/v1',
    'https://www.w3.org/2022/wot/td/v1.1',
    {bt: 'http://example.org/bt#'},
    {'@language': 'en'},
  ],
  title: 'HuskyDuino',
  description: 'A HuskyLens interface running on Arduino.',
  securityDefinitions: {
    nosec_sc: {
      scheme: 'nosec',
    },
  },
  '@type': 'Thing',
  security: ['nosec_sc'],
  properties: {
    algorithm: {
      type: 'integer',
      observable: false,
      readOnly: false,
      writeOnly: false,
      description: 'The currently active algorithm',

      minimum: 1,
      maximum: 7,

      'bt:bytelength': 1,
      'bt:signed': false,
      'bt:byteOrder': 'little',
      forms: [
        {
          href: 'gatt://6A-7A-34-B0-D0-DB/5be35d20-f9b0-11eb-9a03-0242ac130003/5be35d26-f9b0-11eb-9a03-0242ac130003',
          op: 'readproperty',
          'bt:methodName': 'read',
          contentType: 'application/x.ble-octet-stream',
        },
        {
          href: 'gatt://6A-7A-34-B0-D0-DB/5be35d20-f9b0-11eb-9a03-0242ac130003/5be35d26-f9b0-11eb-9a03-0242ac130003',
          op: 'writeproperty',
          'bt:methodName': 'write-without-response',
          contentType: 'application/x.ble-octet-stream',
        },
      ],
    },
    id: {
      type: 'string',
      observable: false,
      readOnly: true,
      writeOnly: false,
      description: 'The ID of the face or object',

      forms: [
        {
          href: 'gatt://6A-7A-34-B0-D0-DB/5be35d20-f9b0-11eb-9a03-0242ac130003/5be3628a-f9b0-11eb-9a03-0242ac130003',
          op: 'readproperty',
          'bt:methodName': 'read',
          contentType: 'application/x.ble-octet-stream',
        },
      ],
    },
    learn: {
      type: 'integer',
      observable: false,
      readOnly: false,
      writeOnly: true,
      description: 'The ID of the face or object',

      minimum: 0,
      maximum: 255,

      'bt:bytelength': 1,
      'bt:signed': false,
      'bt:byteOrder': 'little',
      forms: [
        {
          href: 'gatt://6A-7A-34-B0-D0-DB/5be35d20-f9b0-11eb-9a03-0242ac130003/5be35eca-f9b0-11eb-9a03-0242ac130003',
          op: 'writeproperty',
          'bt:methodName': 'write-without-response',
          contentType: 'application/x.ble-octet-stream',
        },
      ],
    },

    location: {
      type: 'string',
      observable: false,
      readOnly: true,
      writeOnly: false,
      description: 'The location of the face or object',

      forms: [
        {
          href: 'gatt://6A-7A-34-B0-D0-DB/5be35d20-f9b0-11eb-9a03-0242ac130003/5be3628a-f9b0-11eb-9a03-0242ac130003',
          op: 'readproperty',
          'bt:methodName': 'read',
          contentType: 'application/x.ble-octet-stream',
        },
      ],
    },
  },
  actions: {
    forgetAll: {
      type: 'string',
      observable: false,
      readOnly: true,
      writeOnly: false,
      description: 'Forget all faces and objects',
      input: {
        type: 'string',
        enum: ['true'],
      },
      forms: [
        {
          href: 'gatt://6A-7A-34-B0-D0-DB/5be35d20-f9b0-11eb-9a03-0242ac130003/5be361b8-f9b0-11eb-9a03-0242ac130003',
          op: 'invokeaction',
          'bt:methodName': 'write-without-response',
          contentType: 'application/x.ble-octet-stream',
        },
      ],
    },
  },
};

const td_rgb_strip = {
  '@context': [
    'https://www.w3.org/2019/wot/td/v1',
    'https://www.w3.org/2022/wot/td/v1.1',
    {bt: 'http://example.org/bt#'},
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

      'bt:pattern': '7e000503{R}{G}{B}00ef',
      'bt:variables': {
        R: {
          type: 'integer',
          'bt:bytelength': 1,
          'bt:signed': false,
          'bt:byteOrder': 'little',
          minimum: 0,
          maximum: 255,
        },
        G: {
          type: 'integer',
          'bt:bytelength': 1,
          'bt:signed': false,
          'bt:byteOrder': 'little',
          minimum: 0,
          maximum: 255,
        },
        B: {
          type: 'integer',
          'bt:bytelength': 1,
          'bt:signed': false,
          minimum: 0,
          maximum: 255,
        },
      },
      forms: [
        {
          href: 'gatt://BE-58-30-00-CC-11/0000fff0-0000-1000-8000-00805f9b34fb/0000fff3-0000-1000-8000-00805f9b34fb',
          op: ['writeproperty'],
          'bt:methodName': 'write',
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

      'bt:pattern': '7e0004{is_on}00000000ef',
      'bt:variables': {
        is_on: {
          type: 'integer',
          minimum: 0,
          maximum: 1,
          'bt:bytelength': 1,
          'bt:signed': false,
        },
      },
      forms: [
        {
          href: 'gatt://BE-58-30-00-CC-11/0000fff0-0000-1000-8000-00805f9b34fb/0000fff3-0000-1000-8000-00805f9b34fb',
          op: ['writeproperty'],
          'bt:methodName': 'write',
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

      'bt:pattern': '7e0003{type}03000000ef',
      'bt:variables': {
        type: {
          type: 'integer',
          minimum: 128,
          maximum: 156,
          'bt:bytelength': 1,
          'bt:signed': false,
        },
      },
      forms: [
        {
          href: 'gatt://BE-58-30-00-CC-11/0000fff0-0000-1000-8000-00805f9b34fb/0000fff3-0000-1000-8000-00805f9b34fb',
          op: ['writeproperty'],
          'bt:methodName': 'write',
          contentType: 'application/x.ble-octet-stream',
        },
      ],
    },
  },
};

try {
  servient.start().then(async WoT => {
    let rgbStrip = await WoT.consume(td_rgb_strip);
    let huskyduino = await WoT.consume(td_husky);

    let cont = true;

    // CTRL+C
    process.on('SIGINT', () => {
      cont = false;
    }); 

    while (cont) {
      // Read currently visible face
      let face = await huskyduino.readProperty('id');
      let tmp = await face.value();
      tmp = tmp.split('(')[0];
      console.log('FACE with ID: ', tmp);

      // Check if ID is 1 (learned before)
      if (tmp === "1") {
        await rgbStrip.writeProperty('colour', {R: 0, G: 255, B: 0});
      } else {
        await rgbStrip.writeProperty('colour', {R: 255, G: 0, B: 0});
      }
    }

    // Close connection
    await blast_Bluetooth_core.closeBluetooth();
  });
} catch (err) {
  console.error('Script error:', err);
}
