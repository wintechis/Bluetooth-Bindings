## Introduction
This document is inspired by the [HTTP Binding Template](https://w3c.github.io/wot-binding-templates/bindings/protocols/http/index.html) from w3c It attempts to create a Bluetooth Binding Template.

## BLE Vocabulary

The http Vocablary is based on the http ontology with prefix "htv". Similar to this we want to create an ontology for bluetooth. The name should be "bluetooth in rdf" with prefix "bir"

### BLE Vocabulary Terms

| Vocabulary term | Description | Assignment | Type |
| --- | --- | --- | --- |
| bir:methodName |BLE method name (Literal) | required | string |
| bir:receivedDataFormat | Dataformat of received binary buffer (Literal). TODO: Can be read from descriptor? | required | string |
| bir:expectedDataFormat | Dataformat of sent binary buffer (Literal). TODO Is this still needed if "bir:expectedData" exists? | required | string |
| bir:expectedData | Container with form and expected parameter. TODO How to represent order in RDF? | optional | string? |
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

Tested: readproperty, writeproperty, invokeaction

## Example Sequences of Interaction Affordances (UML)
TODO: Create UML Sequence Diagramms
