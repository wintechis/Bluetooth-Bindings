import {
  ProtocolClientFactory,
  ProtocolClient,
  ContentSerdes,
} from '@node-wot/core';
import BluetoothClient from './Bluetooth-client.js';
import { BLEBinaryCodec } from './codec.js';
import debug from 'debug';

// Create a logger with a specific namespace
const log = debug('binding-Bluetooth');

export default class BluetoothClientFactory implements ProtocolClientFactory {
  public readonly scheme: string = 'gatt';

  constructor() {
    this.registerCodec();
  }

  private registerCodec() {
    const cs = ContentSerdes.get();
    if (!cs.getSupportedMediaTypes().includes('application/x.binary-data-stream')) {
       cs.addCodec(new BLEBinaryCodec());
       log('Registered BLEBinaryCodec for "application/x.binary-data-stream"');
    }
  }

  public getClient(): ProtocolClient {
    return new BluetoothClient();
  }

  public init = (): boolean => true;
  public destroy = (): boolean => true;
}