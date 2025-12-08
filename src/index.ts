import BluetoothClientFactory from './Bluetooth-client-factory';
import {enableAutoDisconnect, disableAutoDisconnect} from './Bluetooth-client';
import {close} from './bluetooth/Bluetooth_lib';

export default BluetoothClientFactory;
export {
  BluetoothClientFactory,
  enableAutoDisconnect,
  disableAutoDisconnect,
  close,
};
