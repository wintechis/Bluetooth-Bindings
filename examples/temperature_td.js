const {Servient} = require('@node-wot/core');
const Bluetooth_client_factory = require('../dist/src/Bluetooth-client-factory');
const blast_Bluetooth = require('../dist/src/bluetooth/blast_Bluetooth');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const servient = new Servient();
servient.addClientFactory(new Bluetooth_client_factory.default());

// DC-A6-32-69-F1-8D
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
  title: 'TempMonitor',
  description:
    'Thing Description for Bluezero Example (https://github.com/ukBaz/python-bluezero/blob/main/examples/cpu_temperature.py).',
  securityDefinitions: {
    nosec_sc: {
      scheme: 'nosec',
    },
  },
  '@type': 'Thing',
  security: ['nosec_sc'],
  properties: {
    temp: {
      // Using bdo:scale leads to float -> type = number
      type: 'number',
      observable: false,
      readOnly: true,
      writeOnly: false,
      description: 'The ID of the face or object',

      'bdo:bytelength': 2,
      'bdo:scale': 0.01,

      forms: [
        {
          href: 'gatt://DC-A6-32-69-F1-8D/12341000-1234-1234-1234-123456789abc/00002A6E-0000-1000-8000-00805F9B34FB',
          op: 'readproperty',
          'sbo:methodName': 'sbo:read',
          contentType: 'application/x.ble-octet-stream',
        },
      ],
    },
  },
  events: {
    tempEvent: {
      data: {
        type: 'number',
        'bdo:bytelength': 2,
        'bdo:scale': 0.01,
      },

      forms: [
        {
          href: 'gatt://DC-A6-32-69-F1-8D/12341000-1234-1234-1234-123456789abc/00002A6E-0000-1000-8000-00805F9B34FB',
          contentType: 'application/x.ble-octet-stream',
          op: ['subscribeevent', 'unsubscribeevent'],
          'sbo:methodName': 'sbo:notify',
        },
      ],
      description: 'change event',
    },
  },
};

try {
  servient.start().then(async WoT => {
    await sleep(1000);
    let thing = await WoT.consume(td);
    blast_Bluetooth.stayConnected(thing, true);

    let temp = await thing.readProperty('temp');
    console.log(await temp.value());

    await sleep(1000);

    const sub1 = await thing.subscribeEvent('tempEvent', async data => {
      console.log(
        'CounterChange event occured! New value is:',
        await data.value()
      );
    });
    await sleep(10000);
    sub1.unsubscribeEvent();

    // Close connection
    await blast_Bluetooth.closeBluetooth();
  });
} catch (err) {
  console.error('Script error:', err);
}
