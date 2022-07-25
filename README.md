# Bluetooth-Bindings
Implementation of Bluetooth Bindings for use with Node-WoT and potentially BLAST.

### How to use?
- Install all packages with <code>npm install</code>
- Build the project with <code>npm run build</code>
- Implement your own application or try one of the examples

### Examples
The examples need to be used with the GATT_Thing Repository. The Mac-Address in the td needs to be adjusted!

#### counter_local_td.js
The thing description is directly written in the application and not fetched from an external ressource. It reads the counter value, writes the property incrementStepSize to 6, invokes the action increment, and reads the value again.

#### counter_fetch_td.js
In this example the td is fetched from an URI provided by the device itself. After the URI is fetched, the td can be consumed and the application reads the counter value, writes the property incrementStepSize to 6, invokes the action increment, and reads the value again.
