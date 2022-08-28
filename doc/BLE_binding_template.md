## Introduction

This document is inspired by the [HTTP Binding Template](https://w3c.github.io/wot-binding-templates/bindings/protocols/http/index.html) and [Modbus Binding Template](https://w3c.github.io/wot-binding-templates/bindings/protocols/modbus/index.html) from w3c. It attempts to create a Binding Template for the Bluetooth protocoll.

## Status of This Document

This section describes the status of this document at the time of its publication.
This document is a work in progress.

This document was published by the Fraunhofer IoT Working Group as an Editor's Draft.

This is a draft document and may be updated, replaced or obsoleted by other documents at any time. It is inappropriate to cite this document as other than work in progress.

## URL format

There has been an attempt to standardize URI schemas for [Bluetooth back in 2016 by the ietf](https://datatracker.ietf.org/doc/html/draft-bormann-t2trg-ble-uri-00). Based on this proposed standard we developed an URI schema to describe the Bluetooth interface. <br>
It has the following structure:

```
gatt://<MAC>/<service>/<characteristic>
```

with the following meaning:

    <MAC> is the MAC address of the bluetooth device
    <service> is the GATT service containing the characteristic
    <characteristic> is the GATT characteristic to interact with

## Content Type

The contentType (MIME-Type, MediaType) field specifies the content of the message and selects the appropriate codec.

[RFC2046](https://www.rfc-editor.org/rfc/rfc2046.html) provides 5 discrete media types. Relevant is the <code>application</code> type.

According to [RFC2046](https://www.rfc-editor.org/rfc/rfc2046.html):

- an implementer should invent subtypes of existing types whenever possible (application/???)
- other application subtypes: unrecognized subtypes are treated as equivalent to "application/octet-stream"

We use: "application/x.ble-octet-stream"

## Bluetooth Vocabulary

The http Vocablary is based on the http ontology with prefix "htv". Similar to this we want to create an ontology for bluetooth.

### BLE Vocabulary Terms

This section covers the vocabularies used to describe the Bluetooth protocol and the binary data.

The prefered prefix for the Bluetooth ontology is <code>bt</code> and for the binary data ontology <code>bdo</code>.

#### Form terms

| Vocabulary term | Description               | Assignment | Type   |
| --------------- | ------------------------- | ---------- | ------ |
| bt:methodName   | BLE method name (Literal) | required   | string |

Allowed values are <code>read</code>, <code>write</code>, <code>write-without-response</code>, <code>notify</code>.

#### Metadata?

| Vocabulary term | Description                                 | Assignment                      | Type    |
| --------------- | ------------------------------------------- | ------------------------------- | ------- |
| bdo:bytelength  | How many octets are there in the data       | optional                        | integer |
| bdo:signed      | Is the binary data singed?                  | required                        | boolean |
| bdo:byteOrder   | The byte order of the binary data           | required                        | string  |
| bdo:scale       | Scale of received integer value             | optional                        | float   |
| bdo:offset      | Offset in byte                              | optional                        | integer |
| bdo:pattern     | The byte pattern of the binary data         | optional                        | string  |
| bdo:variable    | Description of the variables in bdo:pattern | required if bdo:pattern is used | ?       |

##### Allowed Dataformats

What dataformats are even allowed in bluetooth?
According to descriptor:

| Group            | Dataformat  | xsd               |
| ---------------- | ----------- | ----------------- |
| Integer          | int8        | xsd:byte          |
| "                | int12       | ---               |
| "                | int16       | xsd:short         |
| "                | int24       | ---               |
| "                | int32       | xsd:int           |
| "                | int48       | ---               |
| "                | int64       | xsd:long          |
| "                | int128      | ---               |
| Unsigned Integer | uint2       | ---               |
| "                | uint4       | ---               |
| "                | uint8       | xsd:unsignedByte  |
| "                | uint12      | ---               |
| "                | uint16      | xsd:unsignedShort |
| "                | uint24      | ---               |
| "                | uint32      | xsd:unsignedInt   |
| "                | uint48      | ---               |
| "                | uint64      | xsd:unsignedLong  |
| "                | uint128     | ---               |
| Float            | float32     | xsd:float         |
| "                | float64     | xsd:double        |
| String           | stringUTF8  | xsd:string        |
| "                | stringUTF16 | ---               |

Maybe also use xsd Datatypes?

### Mappings

Overall mapping is:

- GET -> read
- PUT -> write / write-without-response
- POST -> write / write-without-response

Q: Is write operation on a write-without-response interface allowed? And vice versa?

-> Not possible according to Bluetooth Spec [3.4.5.]. Because write requires an answer from the server (either success or error).
Because of that PUT and POST need to support both write and write-without-response. Operation is depending on server implementation

#### Default mappings

In the following table "write" can be replaced with "write-without-response" for reasons stated above.
The default mappings of HTTP are compared to the default Bluetooth mappings.

| op value                  | Default Binding HTTP     | Default Binding Bluetooth |
| ------------------------- | ------------------------ | ------------------------- |
| readproperty              | "htv:methodName": "GET"  | "bt:methodName": "read"   |
| writeproperty             | "htv:methodName": "PUT"  | "bt:methodName": "write"  |
| invokeaction              | "htv:methodName": "POST" | "bt:methodName": "write"  |
| readallproperties\*       | "htv:methodName": "GET"  | "bt:methodName": "read"   |
| writeallproperties\*      | "htv:methodName": "PUT"  | "bt:methodName": "write"  |
| readmultipleproperties\*  | "htv:methodName": "GET"  | "bt:methodName": "read"   |
| writemultipleproperties\* | "htv:methodName": "PUT"  | "bt:methodName": "write"  |
| subscribeevent            | ---                      | "bt:methodName": "notify" |
| unsubscribeevent          | ---                      | "bt:methodName": ?        |

Operations markted with a \* are not implemented yet

## Example Sequences of Interaction Affordances (UML)

TODO: Create UML Sequence Diagramms

## Data Schema

## Examples

This section will present a set of examples about how the terms defined in this document can be used to describe a Bluetooth interface in a WoT Thing Description.

## Contributions

### How to design a WoT GATT Structure?

![WoTGATT drawio](https://user-images.githubusercontent.com/91477109/181746040-7d01e5e1-19d0-4d7b-8ed2-ebef10fe75f0.png)

On a GATT server there should be a WoT Service identified by a standardized WoT UUID. The WoT Service should contain the interaction affordances for proerties, actions, and events encapsulated in WoT Characteristics with user selected UUIDs. These Characteristics can optionally be described by a descriptor (How is this noted in the TD?). Besides the WoT Charateristics there can be an optional Characteristic that contains an URI to a WoT Thing Description for the device hosted on the web.

With this setup a there are two interaction possibilities for a client.

1. A client can connect to the device, search for the standardized WoT Service, select the TD URI Characteristic and read the URI of the TD. After the client has fetched the URI interactions based on the TD are possible.
2. A client has already stored the needed TD where the mac address of the device is specified. The client can connect and start interacting with the device.

### What needs to be added to a TD for GATT?

- Human and machine readable
- See section above

### Implementing BLE Bindings for Node WoT

- Implementation in Progress.
- BLE Library
- BLE Codec
- BLE Bindings

### Comparision between staying connected and reconnect each time

- How many devices can connect at once and stay connected?
- How long takes a sample programm when reconnection compared to staying connected?
- In what use cases is what setting better? -> introduce global flag to determine what to do!!

## Limitations

- Need to stay connected to receive notifications -> only limited number of devcies can connect at the same time

## TODOs:

- implement read descriptor?
- create td for more GATT devices!
