## Introduction
This document is inspired by the [HTTP Binding Template](https://w3c.github.io/wot-binding-templates/bindings/protocols/http/index.html) from w3c. It attempts to create a Binding Template for the Bluetooth protocoll.

## Status of This Document
This section describes the status of this document at the time of its publication.
This document is a work in progress.

This document was published by the Fraunhofer IoT Working Group as an Editor's Draft. 

This is a draft document and may be updated, replaced or obsoleted by other documents at any time. It is inappropriate to cite this document as other than work in progress. 

## URL format
There has been an attempt to standardize URI schemas for [Bluetooth back in 2016 by the ietf](https://datatracker.ietf.org/doc/html/draft-bormann-t2trg-ble-uri-00).  Based on this proposed standard we developed an URI schema to describe the Bluetooth interface. <br>
It has the following structure:

```
gatt://<MAC>/<service>/<characteristic>
```
  
with the following meaning:

    <MAC> is the MAC address of the bluetooth device
    <service> is the GATT service containing the characteristic
    <characteristic> is the GATT characteristic to interact with

## BLE Vocabulary

The http Vocablary is based on the http ontology with prefix "htv". Similar to this we want to create an ontology for bluetooth. The name should be "bluetooth in rdf" with prefix "bir"

### BLE Vocabulary Terms

| Vocabulary term | Description | Assignment | Type |
| --- | --- | --- | --- |
| bir:methodName |BLE method name (Literal) | required | string |
| bir:receivedDataFormat | Dataformat of received binary buffer (Literal). TODO: Can be read from descriptor? | required | string |
| bir:expectedDataFormat | Dataformat of sent binary buffer (Literal). TODO Is this still needed if "bir:expectedData" exists? | required | string |
| bir:expectedData | Container with form and expected parameter. TODO How to represent order in RDF? [Check here](http://infolab.stanford.edu/~stefan/daml/order.html)| optional | string? |
| bir:hasForm | String Template with expected parameter | required with bir:expectedData | ??? |
| bir:hasParameter | String with expected parameter and datatype | required with bir:expectedData | ??? |


##### Allowed Dataformats
Allowed Dataformats for <code>bir:receivedDataFormat</code> and <code>bir:expectedDataFormat</code>. This are defined in the bluetooth desciptor.

| Handler | Dataformat |
| --- | --- |
| readInt | int8 |
| " | int12 |
| " | int16 |
| " | int24 |
| " | int32 |
| " | int48 |
| " | int64 |
| " | int128 |
| readUInt | uint2 |
| " | uint4 |
| " | uint8 |
| " | uint12 |
| " | uint16 |
| " | uint24 |
| " | uint32 |
| " | uint48|
| " | uint64 |
| " | uint128 |
| readFloat | float32 |
| " | float64 |
| readString | stringUTF8 |
| " | stringUTF16 |


### BLE Default Vocabulary Terms
Overall mapping is:
- GET -> read
- PUT -> write / write-without-response
- POST -> write / write-without-response

Q: Is write operation on a write-without-response interface allowed? And vice versa?

-> Not possible according to Bluetooth Spec [3.4.5.]. Because write requires an answer from the server (either success or error). 
Because of that PUT and POST need to support both write and write-without-response. Operation is depending on server implementation

In the following table "write" can be replaced with "write-without-response" for reasons stated above.

| op value | Default Binding HTTP | Default Binding BLE |
| --- | --- | --- |
|  readproperty | "htv:methodName": "GET" | "bir:methodName": "read" | 
| writeproperty | "htv:methodName": "PUT" | "bir:methodName": "write" | 
| invokeaction | "htv:methodName": "POST" | "bir:methodName": "write" | 
| readallproperties | "htv:methodName": "GET" | "bir:methodName": "read" | 
| writeallproperties | "htv:methodName": "PUT" | "bir:methodName": "write" | 
| readmultipleproperties | "htv:methodName": "GET" | "bir:methodName": "read" | 
| writemultipleproperties | "htv:methodName": "PUT" | "bir:methodName": "write" | 
| subscribeevent | --- | "bir:methodName": "notify" |
| unsubscribeevent | --- | "bir:methodName": ? |

Tested: readproperty, writeproperty, invokeaction

## Example Sequences of Interaction Affordances (UML)
TODO: Create UML Sequence Diagramms

## Data Schema

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


## Limitations
- Need to stay connected to receive notifications -> only limited number of devcies can connect at the same time
## TODOs:
- Implement unsubscribe
- implement read descriptor
- Test connect to multiple devices
