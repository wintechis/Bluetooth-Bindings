// client.js
// Required steps to create a servient for a client
const { Servient, Helpers } = require("@node-wot/core");
const { read } = require("fs");
const Bluetooth_client_factory = require("../dist/src/Bluetooth-client-factory");
const blast_Bluetooth_core = require("../dist/src/bluetooth/blast_Bluetooth_core");

const servient = new Servient();
servient.addClientFactory(new Bluetooth_client_factory.default());

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAC = "5CF370A08703";

const td = {
  "@context": [
    "https://www.w3.org/2019/wot/td/v1",
    "https://www.w3.org/2022/wot/td/v1.1",
    {
      "@language": "en",
    },
  ],
  id: "urn:uuid:07766f92-c518-4e1d-b6db-d21b8683a058",
  title: "BLE Counter",
  description: "BLE Counter Example Thing",
  securityDefinitions: {
    nosec_sc: {
      scheme: "nosec",
    },
  },
  "@type": "Thing",
  security: ["nosec_sc"],
  properties: {
    counterValue: {
      type: "integer",
      observable: false,
      readOnly: true,
      writeOnly: false,

      signed: true, // is the data singed?
      byteOrder: "little", //or big
      fixedByteLength: 4, // TODO: Required length in bytes, difference is padded
      /*pattern: { // TODO: wie sieht das pattern aus das gesendet werden muss?

      },*/

      forms: [
        {
          href:
            "gatt://" +
            MAC +
            "/1fc8f811-0000-4e89-8476-e0b2dad3179b/1fc8f811-0001-4e89-8476-e0b2dad3179b",
          op: ["readproperty"],
          "bir:methodName": "read",
          contentType: "application/ble+octet-stream",
        },
      ],

      description: "current counter value",
    },
    incrementStepSize: {
      type: "integer",
      observable: false,
      readOnly: false,
      writeOnly: true,

      signed: true,
      byteOrder: "little",
      fixedByteLength: 4,

      forms: [
        {
          href:
            "gatt://" +
            MAC +
            "/1fc8f811-0000-4e89-8476-e0b2dad3179b/1fc8f811-f0db-0002-8476-e0b2dad3179b",
          contentType: "application/ble+octet-stream",
          op: ["writeproperty"],
          "bir:methodName": "write",
        },
      ],

      description: "step size when increment action is invoked",
    },
  },
  actions: {
    incrementCounter: {
      forms: [
        {
          href:
            "gatt://" +
            MAC +
            "/1fc8f811-0000-4e89-8476-e0b2dad3179b/1fc8f811-0010-4e89-8476-e0b2dad3179b",
          contentType: "application/ble+octet-stream",
          op: ["invokeaction"],
          "bir:methodName": "write-without-response",
        },
      ],
      idempotent: false,
      safe: false,
      description: "Incrementing counter value",
    },
  },
  events: {
    valueChange: {

      data: {
        type: "string",
        readOnly: false,
        writeOnly: false,
      },

      forms: [
        {
          href:
            "gatt://" +
            MAC +
            "/1fc8f811-0000-4e89-8476-e0b2dad3179b/1fc8f811-0100-4e89-8476-e0b2dad3179b",
          contentType: "application/ble+octet-stream",
          op: ["subscribeevent", "unsubscribeevent"],
          "bir:methodName": "notify",
        },
      ],
      description: "change event",
    },
  },
};

try {
  servient.start().then(async (WoT) => {
    let thing = await WoT.consume(td);

    
    const sub1 = await thing.subscribeEvent("valueChange", async (data) => {
      console.log("CounterChange event occured! New value is:", await data.value());
    });
    
    console.log("WAITING START")

    await sleep(3000);
    console.log("WAITING FINISH")
    
    await thing.invokeAction("incrementCounter");
  
    await sleep(3000);

    await sub1.unsubscribeEvent()
    console.log("WAITING START 22")

    await sleep(3000);
    console.log("WAITING FINISH 22")
    
    await thing.invokeAction("incrementCounter");
  
    await sleep(3000);
    /*
    const read1 = await thing.readProperty("counterValue");
    console.log("'counterValue' Property has value:", await read1.value());
    /*
    await thing.writeProperty("incrementStepSize", "06");
    await thing.invokeAction("incrementCounter");
    const read2 = await thing.readProperty("counterValue");
    console.log("'counterValue' Property has value:", await read2.value());
    */
    await sleep(3000);

    await blast_Bluetooth_core.closeBluetooth();
  });
} catch (err) {
  console.error("Script error:", err);
}
