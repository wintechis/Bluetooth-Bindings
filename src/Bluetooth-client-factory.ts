/**
 * Bluetooth protocol binding
 */
import { ProtocolClientFactory, ProtocolClient, ContentSerdes } from "@node-wot/core";
import BluetoothClient from "./Bluetooth-client.js";
import { BLEBinaryCodec } from "./codec.js";

export default class BluetoothClientFactory implements ProtocolClientFactory {
  public readonly scheme: string = "gatt";

  public contentSerdes: ContentSerdes = ContentSerdes.get()

  constructor(){
    this.contentSerdes.addCodec(new BLEBinaryCodec());
  }
  
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
