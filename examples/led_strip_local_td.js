// client.js
// Required steps to create a servient for a client
const { Servient, Helpers } = require("@node-wot/core");
const Bluetooth_client_factory = require("../dist/src/Bluetooth-client-factory");
const blast_Bluetooth_core = require("../dist/src/bluetooth/blast_Bluetooth_core");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const servient = new Servient();
servient.addClientFactory(new Bluetooth_client_factory.default());
// Needed pattern: 7e000503{R}{G}{B}00ef
const td = {
  "@context": [
    "https://www.w3.org/2019/wot/td/v1",
    "https://www.w3.org/2022/wot/td/v1.1",
    { bt: "http://example.org/bt#" },
    { "@language": "en" },
  ],
  id: "urn:uuid:07766f92-c518-4e1d-b6db-d21b8683a058",
  title: "BLE RGB Controller",
  description:
    "A Bluetooth Low Energy (BLE) controller that can be used to control RGB LED lights.",
  securityDefinitions: {
    nosec_sc: {
      scheme: "nosec",
    },
  },
  "@type": "Thing",
  security: ["nosec_sc"],
  properties: {
    colour: {
      type: "string",
      observable: false,
      readOnly: false,

      "bt:signed": true,
      "bt:byteOrder": "little",
      "bt:pattern": "7e000503{R}{G}{B}00ef",
      "bt:variables": {
        R: {
          type: "string54",
        },
        G: {
          type: "string",
        },
        B: {
          type: "string",
        },
      },

      forms: [
        {
          href: "gatt://BE583000CC11/0000fff0-0000-1000-8000-00805f9b34fb/0000fff3-0000-1000-8000-00805f9b34fb",
          op: ["writeproperty"],
          "bt:methodName": "write",
          contentType: "application/ble+octet-stream",
        },
      ],
      writeOnly: true,
      description: "The colour of the LED light.",
    },
  },
};

try {
  servient.start().then(async (WoT) => {
    let thing = await WoT.consume(td);

    await thing.writeProperty("colour", { R: "FF", G: "00", B: "00" });
    await sleep(5000);
    await thing.writeProperty("colour", { R: "00", G: "FF", B: "00" });
    await sleep(5000);
    await thing.writeProperty("colour", { R: "00", G: "00", B: "FF" });
    await sleep(5000);

    await blast_Bluetooth_core.closeBluetooth();
  });
} catch (err) {
  console.error("Script error:", err);
}
