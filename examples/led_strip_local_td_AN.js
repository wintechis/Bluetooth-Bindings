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
// Needed pattern: 7e000503{R}{G}{B}00ef

const td = {
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
      type: 'hexstring',
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
        },
        G: {
          type: 'integer',
          'bt:bytelength': 1,
          'bt:signed': false,
          'bt:byteOrder': 'little',
        },
        B: {
          type: 'integer',
          'bt:bytelength': 1,
          'bt:signed': false,
          'bt:byteOrder': 'little',
        },
      },
      forms: [
        {
          href: 'gatt://BE583000CC11/0000fff0-0000-1000-8000-00805f9b34fb/0000fff3-0000-1000-8000-00805f9b34fb',
          op: ['writeproperty'],
          'bt:methodName': 'write',
          contentType: 'application/x.ble-octet-stream',
        },
      ],
    },

    power: {
      type: 'hexstring',
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
          'bt:byteOrder': 'little',
        },
      },
      forms: [
        {
          href: 'gatt://BE583000CC11/0000fff0-0000-1000-8000-00805f9b34fb/0000fff3-0000-1000-8000-00805f9b34fb',
          op: ['writeproperty'],
          'bt:methodName': 'write',
          contentType: 'application/x.ble-octet-stream',
        },
      ],
    },

    effect: {
      type: 'hexstring',
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
          'bt:byteOrder': 'little',
        },
      },
      forms: [
        {
          href: 'gatt://BE583000CC11/0000fff0-0000-1000-8000-00805f9b34fb/0000fff3-0000-1000-8000-00805f9b34fb',
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
    await sleep(15000)
    let arr =  []
    let thing = await WoT.consume(td);
    for (let i = 0; i < 40; i++) {
      console.log("====================")
      console.log("START", i)
      console.log("====================")

      const start = performance.now();
      // Write Effect
      await thing.writeProperty('effect', {type: 156});
      //await sleep(3000);

      // Power off
      await thing.writeProperty('power', {is_on: 0});
      //await sleep(3000);

      // Power on
      await thing.writeProperty('power', {is_on: 1});
      //await sleep(3000);

      // Change color to RGB
      await thing.writeProperty('colour', {R: 255, G: 0, B: 0});
      //await sleep(3000);
      await thing.writeProperty('colour', {R: 0, G: 255, B: 0});
      //await sleep(3000);
      await thing.writeProperty('colour', {R: 0, G: 0, B: 255});
      //await sleep(3000);

      // Close connection
      await blast_Bluetooth_core.tearDown();

      const end = performance.now();
      arr.push(end - start)
      //await sleep(3000);
    }
    //console.log(arr)
    console.log("SUMME:", summe(arr))
    console.log("Mittelwert:", summe(arr)/arr.length)
    console.log("Standardabweichung:", standardabweichung(arr))

  });
} catch (err) {
  console.error('Script error:', err);
}

function standardabweichung(arr){
  let mean = summe(arr)/arr.length

  // (x - mean)^2
  let val = 0
  for (let i = 0; i < arr.length; i++) {
    val += (arr[i]-mean) ** 2
  } 

  // 1/(n-1) * val
  let tmp = (1/(arr.length-1))*val
  return Math.sqrt(tmp)
}

function summe(arr){
  sum = 0
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i]
  } 

  return sum;
}