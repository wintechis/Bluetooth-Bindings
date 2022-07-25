// client.js
// Required steps to create a servient for a client
const { Servient, Helpers } = require("@node-wot/core");
const Bluetooth_client_factory = require('../dist/src/Bluetooth-client-factory');
const blast_Bluetooth = require('../dist/src/blast_Bluetooth')


const servient = new Servient();
servient.addClientFactory(new Bluetooth_client_factory.default());

const td = {
    "@context": [
        "https://www.w3.org/2019/wot/td/v1",
        "https://www.w3.org/2022/wot/td/v1.1",
        {
            "@language": "en"
        }
    ],
    "id": "urn:uuid:07766f92-c518-4e1d-b6db-d21b8683a058",
    "title": "BLE Counter",
    "description": "BLE Counter Example Thing",
    "securityDefinitions": {
        "nosec_sc": {
            "scheme": "nosec"
        }
    },
    "@type": "Thing",
    "security": [
        "nosec_sc"
    ],
    "properties": {
        "counterValue": {
            "type": "integer",
            "observable": false,
            "readOnly": true,
            "forms": [
                {
                    "href": "gatt://3800258ab3bb/1fc8f811-0000-4e89-8476-e0b2dad3179b/1fc8f811-0001-4e89-8476-e0b2dad3179b",
                    "bir:receivedDataformat": "int16",
                    "bir:expectedDataformat": "None",
                    "op": [
                        "readproperty"
                    ],
                    "htv:methodName": "read"
                }
            ],
            "writeOnly": false,
            "description": "current counter value"
        },
        "incrementStepSize": {
            "type": "integer",
            "observable": false,
            "readOnly": false,
            "forms": [
                {
                    "href": "gatt://3800258ab3bb/1fc8f811-0000-4e89-8476-e0b2dad3179b/1fc8f811-f0db-0002-8476-e0b2dad3179b",
                    "bir:receivedDataformat": "None",
                    "bir:expectedDataformat": "None",
                    "op": [
                        "writeproperty"
                    ],
                    "htv:methodName": "write"
                }
            ],
            "writeOnly": true,
            "description": "step size when increment action is invoked"
        }
    },
    "actions": {
        "incrementCounter": {
            "forms": [
                {
                    "href": "gatt://3800258ab3bb/1fc8f811-0000-4e89-8476-e0b2dad3179b/1fc8f811-0010-4e89-8476-e0b2dad3179b",
                    "bir:receivedDataformat": "None",
                    "bir:expectedDataformat": "None",
                    "op": [
                        "invokeaction"
                    ],
                    "htv:methodName": "write-without-response"
                }
            ],
            "idempotent": false,
            "safe": false,
            "description": "Incrementing counter value"
        }
    },
    "events": {
        "valueChange": {
            "forms": [
                {
                    "href": "gatt://3800258ab3bb/1fc8f811-0000-4e89-8476-e0b2dad3179b/1fc8f811-0100-4e89-8476-e0b2dad3179b",
                    "bir:receivedDataformat": "None",
                    "bir:expectedDataformat": "None",
                    "op": [
                        "subscribeevent",
                        "unsubscribeevent"
                    ],
                    "htv:methodName": "notify"
                }
            ],
            "description": "change event"
        }
    }
};


try {
    servient.start().then(async (WoT) => {
        let thing = await WoT.consume(td)
        const read1 = await thing.readProperty("counterValue");
        console.log("'counterValue' Property has value:", await read1.value());
        await thing.writeProperty("incrementStepSize", "06")
        await thing.invokeAction("incrementCounter");
        const read2 = await thing.readProperty("counterValue");
        console.log("'counterValue' Property has value:", await read2.value());
        await blast_Bluetooth.tearDown()
    });
}
catch (err) {
    console.error("Script error:", err);
}
