// client for Xiaomi Flower Care Sensor
const {Servient} = require('@node-wot/core');
const Bluetooth_client_factory = require('../dist/src/Bluetooth-client-factory');
const Bluetooth_lib = require('../dist/src/bluetooth/Bluetooth_lib');

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
  title: 'Flower',
  description: 'A Xiaomi Flower Care Sensor.',
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
    'qudt:numericValue': 2000,
    'qutdUnit:unit': 'qudtUnit:MilliSEC',
  },

  properties: {
    valueString: {
      type: 'array',

      observable: false,
      readOnly: true,
      writeOnly: false,
      description: 'The Values of the device',

      'bdo:pattern': '{temp}00{brightness}{moisture}{conduct}023c00fb349b',
      'bdo:variables': {
        temp: {
          type: 'integer',
          'bdo:bytelength': 2,
          'bdo:scale': 0.1,
          description: 'The current temperature value.',
        },
        brightness: {
          type: 'integer',
          'bdo:bytelength': 4,
          description: 'The current brightness value.',
        },
        moisture: {
          type: 'integer',
          'bdo:bytelength': 1,
          description: 'The current moisture value.',
        },
        conduct: {
          type: 'integer',
          'bdo:bytelength': 2,
          description: 'The current conductivity value.',
        },
      },
      forms: [
        {
          href: 'gatt://C4-7C-8D-6D-7D-F8/00001204-0000-1000-8000-00805f9b34fb/00001a01-0000-1000-8000-00805f9b34fb',
          op: 'readproperty',
          'sbo:methodName': 'sbo:read',
          contentType: 'application/x.binary-data-stream',
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
        format: 'hex',
        enum: ['A01F'],
        'bdo:bytelength': 2,
        description: 'The command "A01F" enables write mode.',
      },

      forms: [
        {
          href: 'gatt://C4-7C-8D-6D-7D-F8/00001204-0000-1000-8000-00805f9b34fb/00001a00-0000-1000-8000-00805f9b34fb',
          op: 'invokeaction',
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

    // Activate Write Mode
    await thing.invokeAction('writeMode', 'A01F');

    // Read Property
    let val = await thing.readProperty('valueString');
    val = await val.value();

    // Display Result
    console.log('Temperature:', val[0], 'C');
    console.log('Brightness:', val[1], 'LUX');
    console.log('Moisture:', val[2], '%');
    console.log('Conductivity:', val[3], 'µS/cm');

    // Close connection
    await Bluetooth_lib.close();
  });
} catch (err) {
  console.error('Script error:', err);
}
