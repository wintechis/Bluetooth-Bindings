/**
 * Bluetooth protocol binding
 */
import { ProtocolClientFactory, ProtocolClient } from "@node-wot/core";
import BluetoothClient from "./Bluetooth-client.js";

export default class BluetoothClientFactory implements ProtocolClientFactory {
  public readonly scheme: string = "gatt";

  public getClient(): ProtocolClient {
    console.debug(
      "[binding-Bluetooth]",
      `BluetoothClientFactory creating client for ${this.scheme}`
    );
    return new BluetoothClient();
  }

  public init = (): boolean => true;
  public destroy = (): boolean => true;
}
