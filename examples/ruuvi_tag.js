const { Servient } = require("@node-wot/core");
const { BluetoothGapClientFactory } = require("wot-ble-client-factory");

const servient = new Servient();
servient.addClientFactory(new BluetoothGapClientFactory());

const td = {
    "@context": [
        "https://www.w3.org/2019/wot/td/v1",
        {
            "bdo": "https://freumi.inrupt.net/BinaryDataOntology.ttl#"
        }
    ],
    "title": "RuuviTag",
    "securityDefinitions": { "nosec_sc": { "scheme": "nosec" } },
    "security": "nosec_sc",
    "properties": {
        "sensors": {
            "type": "array",
            "readOnly": true,
            // pattern representing the 24-byte Ruuvi payload
            // {fmt}{temp}{hum}{pres}{accX}{accY}{accZ}{pwr}{cnt}{seq}{mac}
            "bdo:pattern": "00{temperature}{humidity}{pressure}{accX}{accY}{accZ}{power}{moveCnt}{seqCnt}000000000000",
            "bdo:variables": {
                "temperature": {
                    "type": "number",
                    "bdo:bytelength": 2,
                    "bdo:byteOrder": "big",
                    "bdo:signed": true,
                    "bdo:scale": 0.005,
                    "qudt:unit": "qudtUnit:DegreeCelsius"
                },
                "humidity": {
                    "type": "number",
                    "bdo:bytelength": 2,
                    "bdo:byteOrder": "big",
                    "bdo:scale": 0.0025,
                    "qudt:unit": "qudtUnit:Percent"
                },
                "pressure": {
                    "type": "integer",
                    "bdo:bytelength": 2,
                    "bdo:byteOrder": "big",
                    "bdo:offset": 0,
                    "bdo:valueAdd": 50000,
                    "qudt:unit": "qudtUnit:PA"
                },
                "accX": { "type": "integer", "bdo:bytelength": 2, "bdo:byteOrder": "big", "bdo:signed": true, "qudt:unit": "qudtUnit:MilliG" },
                "accY": { "type": "integer", "bdo:bytelength": 2, "bdo:byteOrder": "big", "bdo:signed": true, "qudt:unit": "qudtUnit:MilliG" },
                "accZ": { "type": "integer", "bdo:bytelength": 2, "bdo:byteOrder": "big", "bdo:signed": true, "qudt:unit": "qudtUnit:MilliG" },
                "power": { "type": "integer", "bdo:bytelength": 2, "bdo:byteOrder": "big" },
                "moveCnt": { "type": "integer", "bdo:bytelength": 1 },
                "seqCnt": { "type": "integer", "bdo:bytelength": 2, "bdo:byteOrder": "big" },
            },
            "forms": [
                {
                    "href": "gap://FC-12-25-CC-CB-9A",
                    "contentType": "application/x.binary-data-stream"
                }
            ]
        }
    }
};


servient.start().then(async (WoT) => {
    let thing = await WoT.consume(td);
    try {
        const data = await thing.readProperty("sensors");
        const value = await data.value();
        console.log("Found Manufacturer Data:", JSON.stringify(value, null, 2));
    } catch (e) {
        console.error("Could not read GAP data:", e.message);
    }
}).catch((err) => { console.error(err); });