// client for Huskylense connected to a Arduino running a GATT server
const {Servient, Helpers} = require('@node-wot/core');
const Bluetooth_client_factory = require('../dist/src/Bluetooth-client-factory');

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
    },
    {'@language': 'en'},
  ],
  title: 'Govee H6008 Power',
  description: 'Power control for a Govee H6008 BLE bulb via GATT write.',
  '@type': ['Thing', 'sbo:BluetoothLEDevice'],
  securityDefinitions: {nosec_sc: {scheme: 'nosec'}},
  security: ['nosec_sc'],

  actions: {
    turnOn: {
      description: 'Send the ON frame to the control characteristic.',
      input: {
        type: 'string',
        format: 'hex',
        enum: ['33010100000000000000000000000000000033'],
        'bdo:bytelength': 20,
      },
      forms: [
        {
          href: `gatt://60-74-F4-72-50-65/00010203-0405-0607-0809-0a0b0c0d1910/00010203-0405-0607-0809-0a0b0c0d2b11`,
          op: 'invokeaction',
          'sbo:methodName': 'sbo:write-without-response',
          contentType: 'application/x.binary-data-stream',
        },
      ],
    },
    turnOff: {
      description: 'Send the OFF frame to the control characteristic.',
      input: {
        type: 'string',
        format: 'hex',
        enum: ['33010000000000000000000000000000000032'],
        'bdo:bytelength': 20,
      },
      forms: [
        {
          href: 'gatt://60-74-F4-72-50-65/00010203-0405-0607-0809-0a0b0c0d1910/00010203-0405-0607-0809-0a0b0c0d2b11',
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

    await thing.invokeAction(
      'turnOff',
      '3301000000000000000000000000000000000032'
    );
    await sleep(2000);
    await thing.invokeAction(
      'turnOn',
      '3301010000000000000000000000000000000033'
    );
    await sleep(2000);

  });
} catch (err) {
  console.error('Script error:', err);
}
