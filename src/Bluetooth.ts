import { Form } from "@node-wot/core";

export { default as BluetoothClient } from './Bluetooth-gatt-client.js';
// Export the default (GATT) factory as expected by legacy code
export { BluetoothGATTClientFactory } from './Bluetooth-client-factory.js';

// Also export the GAP factory so it can be used
export { BluetoothGapClientFactory } from './Bluetooth-client-factory.js';

export class BluetoothForm extends Form {
  public 'wbt:id': string;
  public 'datatype': string;
}