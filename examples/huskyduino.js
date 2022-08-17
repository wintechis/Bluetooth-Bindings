// client.js
// Required steps to create a servient for a client
const {Servient, Helpers} = require('@node-wot/core');
const Bluetooth_client_factory = require('../dist/src/Bluetooth-client-factory');
const blast_Bluetooth_core = require('../dist/src/bluetooth/blast_Bluetooth_core');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const servient = new Servient();
servient.addClientFactory(new Bluetooth_client_factory.default());

const td = {
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

      'bt:bytelength': 1,
      'bt:signed': false,
      'bt:byteOrder': 'little',
      forms: [
        {
          href: 'gatt://6A7A34B0D0DB/5be35d20-f9b0-11eb-9a03-0242ac130003/5be35d26-f9b0-11eb-9a03-0242ac130003',
          op: ['readproperty'],
          'bt:methodName': 'read',
          contentType: 'application/x.ble-octet-stream',
        },
        {
          href: 'gatt://6A7A34B0D0DB/5be35d20-f9b0-11eb-9a03-0242ac130003/5be35d26-f9b0-11eb-9a03-0242ac130003',
          op: ['writeproperty'],
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

      'bt:bytelength': 1,
      'bt:signed': false,
      'bt:byteOrder': 'little',
      forms: [
        {
          href: 'gatt://6A7A34B0D0DB/5be35d20-f9b0-11eb-9a03-0242ac130003/5be3628a-f9b0-11eb-9a03-0242ac130003',
          op: ['readproperty'],
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

      'bt:bytelength': 1,
      'bt:signed': false,
      'bt:byteOrder': 'little',
      forms: [
        {
          href: 'gatt://6A7A34B0D0DB/5be35d20-f9b0-11eb-9a03-0242ac130003/5be35eca-f9b0-11eb-9a03-0242ac130003',
          op: ['writeproperty'],
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
          href: 'gatt://6A7A34B0D0DB/5be35d20-f9b0-11eb-9a03-0242ac130003/5be3628a-f9b0-11eb-9a03-0242ac130003',
          op: ['readproperty'],
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
      },
      forms: [
        {
          href: 'gatt://6A7A34B0D0DB/5be35d20-f9b0-11eb-9a03-0242ac130003/5be361b8-f9b0-11eb-9a03-0242ac130003',
          op: ['invokeaction'],
          'bt:methodName': 'write-without-response',
          contentType: 'application/x.ble-octet-stream',
        },
      ],
    },
  },
};

try {
  servient.start().then(async WoT => {
    let thing = await WoT.consume(td);

    // set algorithm to 0
    await thing.writeProperty('algorithm', 0);

    // forget all faces
    await thing.invokeAction('forgetAll', "true");
    await sleep(5000);

    // learn currently visible face
    await thing.writeProperty('learn', 2);
    await sleep(5000);

    // Read currently visible face
    let face = await thing.readProperty('id');
    let tmp = await face.value()
    tmp = tmp.split("(")[0]
    console.log('FACE with ID: ', tmp);
    await sleep(2000);

    // Read currently visible face
    let location = await thing.readProperty('location');
    tmp = await location.value()
    tmp = tmp.split("(")[1]
    console.log('Location: ', tmp);
    await sleep(2000);

    // Close connection
    await blast_Bluetooth_core.closeBluetooth();
  });
} catch (err) {
  console.error('Script error:', err);
}
