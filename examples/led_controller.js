const {Servient} = require('@node-wot/core');
//const {BluetoothClientFactory} = require('wot-ble-client-factory');
const {BluetoothClientFactory} = require('../.');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const servient = new Servient();
servient.addClientFactory(new BluetoothClientFactory());

const MAC = 'BE:58:30:00:CC:11';

const td = {
  '@context': [
    'https://www.w3.org/2019/wot/td/v1',
    'https://www.w3.org/2022/wot/td/v1.1',
    {
      sbo: 'https://freumi.inrupt.net/SimpleBluetoothOntology.ttl#',
      bdo: 'https://freumi.inrupt.net/BinaryDataOntology.ttl#',
      qudt: 'https://qudt.org/schema/qudt/',
      qudtUnit: 'https://qudt.org/vocab/unit/',
    },
    {'@language': 'en'},
  ],
  '@type': '',
  title: 'BLE RGB Controller',
  base: 'gatt://{{MacOrWebBluetoothId}}/',
  description:
    'A Bluetooth Low Energy (BLE) controller that can be used to control RGB LED lights.',
  securityDefinitions: {
    nosec_sc: {
      scheme: 'nosec',
    },
  },
  security: ['nosec_sc'],
  'sbo:hasGAPRole': 'sbo:Peripheral',
  'sbo:isConnectable': true,
  'sbo:hasAdvertisingIntervall': {
    'qudt:numericValue': 50,
    'qutdUnit:unit': 'qudtUnit:MilliSEC',
  },
  properties: {
    color: {
      title: 'color',
      description: 'The color of the LED light.',
      type: 'object',
      properties: {
        R: {
          type: 'integer',
          'bdo:bytelength': 1,
          minimum: 0,
          maximum: 255,
          description: 'Red value.',
        },
        G: {
          type: 'integer',
          'bdo:bytelength': 1,
          minimum: 0,
          maximum: 255,
          description: 'Green value.',
        },
        B: {
          type: 'integer',
          'bdo:bytelength': 1,
          minimum: 0,
          maximum: 255,
          description: 'Blue value.',
        },
      },
      observable: false,
      readOnly: false,
      writeOnly: true,
      'bdo:pattern': '7e000503{R}{G}{B}00ef',
      forms: [
        {
          op: 'writeproperty',
          href: 'gatt://BE-58-30-00-CC-11/0000fff0-0000-1000-8000-00805f9b34fb/0000fff3-0000-1000-8000-00805f9b34fb',
          contentType: 'application/x.binary-data-stream',
          'sbo:methodName': 'sbo:write-without-response',
        },
      ],
    },
  },
  actions: {
    power: {
      description: 'Power device on or off.',
      input: {
        minimum: 0,
        maximum: 1,
        type: 'integer',
        'bdo:pattern': '7e0004{value}00000000ef',
        'bdo:bytelength': 1,
      },
      forms: [
        {
          href: `gatt://BE-58-30-00-CC-11/0000fff0-0000-1000-8000-00805f9b34fb/0000fff3-0000-1000-8000-00805f9b34fb`,
          op: 'invokeaction',
          'sbo:methodName': 'sbo:write-without-response',
          contentType: 'application/x.binary-data-stream',
        },
      ],
    },
  },
};

try {
  servient.start().then(async WoT => {
    let thing = await WoT.consume(td);

    await thing.writeProperty('color', {R: 0, G: 255, B: 255});

    //await thing.invokeAction('power', 0);
    //await sleep(2000);
    //await thing.invokeAction('power', 1);
    //await sleep(2000);
  });
} catch (err) {
  console.error('Script error:', err);
}
