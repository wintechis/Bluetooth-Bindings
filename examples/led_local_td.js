// client.js
// Required steps to create a servient for a client
const { Servient, Helpers } = require("@node-wot/core");
const Bluetooth_client_factory = require("../dist/src/Bluetooth-client-factory");
const blast_Bluetooth = require("../dist/src/blast_Bluetooth");

const servient = new Servient();
servient.addClientFactory(new Bluetooth_client_factory.default());

const td = {
  "@context": [
    "https://www.w3.org/2019/wot/td/v1",
    "https://www.w3.org/2022/wot/td/v1.1",
    {
      "@language": "en",
    },
  ],
  id: "urn:uuid:07766f92-c518-4e1d-b6db-d21b8683a058",
  title: "BLE LED",
  description: "BLE LED Example Thing",
  securityDefinitions: {
    nosec_sc: {
      scheme: "nosec",
    },
  },
  "@type": "Thing",
  security: ["nosec_sc"],
  properties: {
    readColor: {
      type: "integer",
      observable: false,
      readOnly: true,
      signed: false,
      byteOrder: "little",
      forms: [
        {
          href: "gatt://A4DD70903FAE/D65D0396-0000-4381-9985-653653CE831F/D65D0396-0001-4381-9985-653653CE831F",
          op: ["readproperty"],
          "htv:methodName": "read",
        },
      ],
      writeOnly: false,
      description: "current counter value",
    },
    changeColorState: {
      type: "integer",
      observable: false,
      readOnly: false,
      forms: [
        {
          href: "gatt://A4DD70903FAE/D65D0396-0000-4381-9985-653653CE831F/D65D0396-0001-4381-9985-653653CE831F",
          op: ["writeproperty"],
          "htv:methodName": "write",
        },
      ],
      writeOnly: true,
      description: "step size when increment action is invoked",
    },
  },
  actions: {
    incrementCounter: {
      forms: [
        {
          href: "gatt://3800258ab3bb/1fc8f811-0000-4e89-8476-e0b2dad3179b/1fc8f811-0010-4e89-8476-e0b2dad3179b",
          op: ["invokeaction"],
          "htv:methodName": "write-without-response",
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
          href: "gatt://3800258ab3bb/1fc8f811-0000-4e89-8476-e0b2dad3179b/1fc8f811-0100-4e89-8476-e0b2dad3179b",
          op: ["subscribeevent", "unsubscribeevent"],
          "htv:methodName": "notify",
        },
      ],
      description: "change event",
    },
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

try {
  sleep(5000).then(() => {
    servient.start().then(async (WoT) => {
      let thing = await WoT.consume(td);
      const read1 = await thing.readProperty("readColor");
      console.log("'readColor' Property has value:", await read1.value());
      await thing.writeProperty("changeColorState", "00");
      const read2 = await thing.readProperty("readColor");
      console.log("'readColor' Property has value:", await read2.value());
      await blast_Bluetooth.closeBluetooth();
    });
  });
} catch (err) {
  console.error("Script error:", err);
}
