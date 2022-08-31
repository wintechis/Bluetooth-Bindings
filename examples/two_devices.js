const {Servient} = require('@node-wot/core');
const Bluetooth_client_factory = require('../dist/src/Bluetooth-client-factory');
const blast_Bluetooth = require('../dist/src/bluetooth/blast_Bluetooth');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const servient = new Servient();
servient.addClientFactory(new Bluetooth_client_factory.default());

const td_husky = {
  '@context': [
    'https://www.w3.org/2019/wot/td/v1',
    'https://www.w3.org/2022/wot/td/v1.1',
    {
      sbo: 'http://example.org/simple-bluetooth-ontology#',
      bdo: 'http://example.org/binary-data-ontology#',
    },
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

      'bdo:bytelength': 1,
      forms: [
        {
          href: 'gatt://6A-7A-34-B0-D0-DB/5be35d20-f9b0-11eb-9a03-0242ac130003/5be35d26-f9b0-11eb-9a03-0242ac130003',
          op: 'readproperty',
          'sbo:methodName': 'sbo:read',
          contentType: 'application/x.ble-octet-stream',
        },
        {
          href: 'gatt://6A-7A-34-B0-D0-DB/5be35d20-f9b0-11eb-9a03-0242ac130003/5be35d26-f9b0-11eb-9a03-0242ac130003',
          op: 'writeproperty',
          'sbo:methodName': 'sbo:write-without-response',
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
          'sbo:methodName': 'sbo:read',
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

      'bdo:bytelength': 1,
      forms: [
        {
          href: 'gatt://6A-7A-34-B0-D0-DB/5be35d20-f9b0-11eb-9a03-0242ac130003/5be35eca-f9b0-11eb-9a03-0242ac130003',
          op: 'writeproperty',
          'sbo:methodName': 'sbo:write-without-response',
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
          'sbo:methodName': 'sbo:read',
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
          'sbo:methodName': 'sbo:write-without-response',
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
    let rgbStrip = await WoT.consume(td_rgb_strip);
    blast_Bluetooth.stayConnected(rgbStrip, true);
    let huskyduino = await WoT.consume(td_husky);
    blast_Bluetooth.stayConnected(huskyduino, true);

    // Read currently visible face
    let face = await huskyduino.readProperty('id');
    let tmp = await face.value();
    tmp = tmp.split('(')[0];
    console.log('FACE with ID: ', tmp);

    await sleep(2000);

    // Check if ID is 2 (learned before)
    if (tmp === '2') {
      await rgbStrip.writeProperty('colour', {R: 0, G: 255, B: 0});
    } else {
      await rgbStrip.writeProperty('colour', {R: 255, G: 0, B: 0});
    }

    await sleep(2000);

    // Close connection
    await blast_Bluetooth.closeBluetooth();
  });
} catch (err) {
  console.error('Script error:', err);
}
