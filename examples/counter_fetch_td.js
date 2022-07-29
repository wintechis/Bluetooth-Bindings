// client.js
// Required steps to create a servient for a client
const { Servient, Helpers } = require("@node-wot/core");
const Bluetooth_client_factory = require("../dist/src/Bluetooth-client-factory");
const blast_Bluetooth = require("../dist/src/blast_Bluetooth");

const servient = new Servient();
servient.addClientFactory(new Bluetooth_client_factory.default());

const MAC = "c0:3c:59:a8:91:06";
let td = undefined;

// Connect to device and Read TD
blast_Bluetooth.get_td_from_device(MAC).then(async (td_uri) => {
  // This needs atleast Node 18.0.0
  const res = await fetch(td_uri);
  td = await res.json();

  try {
    servient.start().then(async (WoT) => {
      let thing = await WoT.consume(td);
      // Read Property "counterValue"
      const read1 = await thing.readProperty("counterValue");
      console.log("'counterValue' Property has value:", await read1.value());
      //await thing.writeProperty("incrementStepSize", "0x05")
      //await thing.invokeAction("incrementCounter");
      await blast_Bluetooth.tearDown();
    });
  } catch (err) {
    console.error("Script error:", err);
  }
});
