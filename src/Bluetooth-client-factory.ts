import {
  ProtocolClientFactory,
  ProtocolClient,
  ContentSerdes,
} from '@node-wot/core';
import BluetoothClient from './Bluetooth-gatt-client.js';
import BluetoothGapClient from './Bluetooth-gap-client.js';
import { BLEBinaryCodec } from './codec.js';
import debug from 'debug';

const log = debug('binding-Bluetooth');

export class BluetoothGattClientFactory implements ProtocolClientFactory {
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

export class BluetoothGapClientFactory implements ProtocolClientFactory {
  public readonly scheme: string = 'gap';

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
    return new BluetoothGapClient();
  }

  public init = (): boolean => true;
  public destroy = (): boolean => true;
}