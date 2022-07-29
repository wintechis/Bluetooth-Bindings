import { Form } from "@node-wot/td-tools";

export { default as BluetoothClient } from "./Bluetooth-client.js";
export { default as BluetoothClientFactory } from "./Bluetooth-client-factory.js";

export class BluetoothForm extends Form {
  public "wbt:id": string;
  public "datatype": string;
}
