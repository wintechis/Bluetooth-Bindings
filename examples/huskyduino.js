// client for Huskylense connected to a Arduino running a GATT server
const {Servient, Helpers} = require('@node-wot/core');
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
  title: 'HuskyDuino',
  description: 'A HuskyLens interface running on Arduino.',
  securityDefinitions: {
    nosec_sc: {
      scheme: 'nosec',
    },
  },
  '@type': 'Thing',
  security: ['nosec_sc'],

  'sbo:hasGAPRole': 'sbo:Peripheral',
  'sbo:isConnectable': true,
  'sbo:hasAdvertisingIntervall': {
    'qudt:numericValue': 200,
    'qutdUnit:unit': 'qudtUnit:MilliSEC',
  },

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

try {
  servient.start().then(async WoT => {
    let thing = await WoT.consume(td);

    // Connect to Device
    await Bluetooth_lib.connectThing(thing);

    // set algorithm to 0
    await thing.writeProperty('algorithm', 0);

    // forget all faces
    await thing.invokeAction('forgetAll', 'true');
    await sleep(5000);

    // learn currently visible face
    await thing.writeProperty('learn', 2);
    await sleep(5000);

    // Read currently visible face
    let face = await thing.readProperty('id');
    let tmp = await face.value();
    tmp = tmp.split('(')[0];
    console.log('FACE with ID: ', tmp);
    await sleep(2000);

    // Read location of currently visible face
    let location = await thing.readProperty('location');
    tmp = await location.value();
    tmp = tmp.split('(')[1];
    console.log('Location: ', tmp);
    await sleep(2000);

    // Close connection
    await blast_Bluetooth.closeBluetooth();
  });
} catch (err) {
  console.error('Script error:', err);
}
