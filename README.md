# Bluetooth-Bindings

## Overview

W3C Web of Things (WoT) compatible Protocol Bindings for [Bluetooth LE](https://en.wikipedia.org/wiki/Bluetooth_Low_Energy) to use with  [node-wot](https://github.com/eclipse/thingweb.node-wot). 

## Protocol specifier

The protocol prefix handled by this binding is <code>gatt://</code>.

A planned protocol prefix is <code>gap://</code>.

## Getting Started

### Setup

- Download the project
- Install all packages with <code>npm install</code>
- Build the project with <code>npm run build</code>
- Implement your own application or try one of the examples in <code>./examples/</code>

## Documentation

### Default Mappings

In order to align a new protocol into the WoT context, the required abstract WoT operations must first be mapped to the concrete operations of the new protocol.
A distinction must be made between the two GATT methods write and write-without-response. Both are capable of writing WoT resources, but the two methods differ in that write expects a confirmation message from the server after a write operation, while write-without-response requires no such confirmation. Thus the GATT method chosen depends on the implementation of the attribute in the GATT server.

| WoT Operation  | BLE GATT Method            |
| -------------- | -------------------------- |
| readproperty   | read                       |
| writeproperty  | write / write-w/o-response |
| invokeaction   | write / write-w/o-response |
| subscribeevent | notify                     |

### URL Format

The introduced URI scheme is suitable for uniquely identifying resources on GATT servers, and allows users to interact with the desired GATT characteristic.
It has the following structure:

```
gatt://<MAC>/<service>/<characteristic>
```

with the following meaning:
- `gatt` Identification of the transfer protocol
- `<MAC>` MAC address of the Bluetooth device
- `<service>` GATT service containing the characteristic
- `<characteristic>` GATT characteristic to interact with

### Media Type
The encoding/decoding of transfered data is done using a suitable codec. Currently, there is no fitting combination of content type and codec that meets all requirements for the binary data transmitted by Bluetooth LE. The closest is `application/octet-stream`, but unfortunately, this codec only fulfills parts of our requirements and can not encode or decode all binary data transmitted via Bluetooth LE. 
For the Bluetooth LE bindings, we chose the new, non-standard subtype `x.binary-data-stream` and defined an associated codec that interprets the binary data using a newly created vocabulary.

### Binary Data Ontology

The Binary Data Ontology (bdo) is intended to provide maximum flexibility and describe all kinds of binary data.
We want to use the bdo ontology to describe the data transmitted by Bluetooth LE devices, even those that do not comply with the Bluetooth standard. The terms of the vocabulary are in our use case only useful within the properties, actions, or events parts of a Thing Description because they contain information about the data that is needed in the codec associated with application/x.binary-data-stream.

| Vocabulary term | Description                                 | Assignment                      | Type    | Default Value    |
| --------------- | ------------------------------------------- | ------------------------------- | ------- | ---------------- |
| bdo:bytelength  | Number of octets in the data                | required                        | integer | None             |
| bdo:signed      | Indicates if the data is signed             | required                        | boolean | false            |
| bdo:endianess   | Byte order of the binary data               | required                        | string  | bdo:littleEndian |
| bdo:scale       | Scale of received integer value             | optional                        | float   | 1.0              |
| bdo:offset      | Offset in number of octets                  | optional                        | integer | 0                |
| bdo:pattern     | The byte pattern of the binary data         | optional                        | string  | None             |
| bdo:variable    | Description of the variables in bdo:pattern | required if bdo:pattern is used | ---     | None             |

### Simple Bluetooth Ontology
The communication and metadata of a Bluetooth Low Energy device is described using the Simple Bluetooth Ontology with preferred prefix sbo. 
This information is optional and not required.
 
![Alt text](img/SBO3.png?raw=true "sbo Ontology")