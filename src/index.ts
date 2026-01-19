import { BluetoothGattClientFactory, BluetoothGapClientFactory } from './Bluetooth-client-factory';
import { enableAutoDisconnect, disableAutoDisconnect } from './Bluetooth-gatt-client';
import { close } from './bluetooth/Bluetooth_lib';

export {
  BluetoothGattClientFactory,
  BluetoothGapClientFactory, 
  enableAutoDisconnect,
  disableAutoDisconnect,
  close,
};