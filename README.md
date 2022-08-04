# Bluetooth-Bindings

## Overview
W3C Web of Things (WoT) Protocol Binding for [Bluetooth](https://en.wikipedia.org/wiki/Bluetooth) to use with Node WoT. The WoT Binding Template can be found TODO: here.

## Protocol specifier
The protocol prefix handled by this binding is <code>gatt://</code>.

A planned protocol prefix is <code>gap://</code>.
 
## Getting Started
### Setup
- Download the project
- Install all packages with <code>npm install</code>
- Build the project with <code>npm run build</code>
- Implement your own application or try one of the examples in <code>./examples/</code>

### Examples
The examples need to be used with the GATT_Thing Repository. The Mac-Address in the td needs to be adjusted!

#### counter_local_td.js
The thing description is directly written in the application and not fetched from an external ressource. It reads the counter value, writes the property incrementStepSize to 6, invokes the action increment, and reads the value again.

#### counter_fetch_td.js
In this example the td is fetched from an URI provided by the device itself. After the URI is fetched, the td can be consumed and the application reads the counter value, writes the property incrementStepSize to 6, invokes the action increment, and reads the value again.

## URL format
The URL is used to transport all addressing information necessary to describe the MODBUS connection and register addresses. It has the following structure:
```
gatt://<MAC>/<service>/<characteristic>
```
with the following meaning:
-   `<MAC>` is the MAC address of the bluetooth device 
-   `<service>` is the GATT service containing the characteristic
-   `<characteristic>` is the GATT characteristic to interact with

Bluetooth URI schema can be found [here](https://tools.ietf.org/html/draft-bormann-t2trg-ble-uri-00).

## DataSchema
Uses the Codec <code>application/ble+octet-stream</code> (Differnce to <code>application/octet-stream</code> ??)

## Security
Security is not implemented yet.
