/**
 * Handle basic bluetooth communication and discovery.
 */

import { createBluetooth } from "node-ble";
import { deconstructForm } from "../Bluetooth-gatt-client";
import debug from "debug";

const log = debug("binding-Bluetooth");

type BLEPair = ReturnType<typeof createBluetooth>;

// -------------------------
// Lazy BLE / DBus lifetime
// -------------------------
let ble: BLEPair | null = null;
let _bluetooth: BLEPair["bluetooth"] | null = null;
let _destroy: BLEPair["destroy"] | null = null;
let _destroyed = true;

function initBleIfNeeded() {
  if (_destroyed || !ble || !_bluetooth || !_destroy) {
    ble = createBluetooth();
    _bluetooth = ble.bluetooth;
    _destroy = ble.destroy;
    _destroyed = false;
    log("BLE initialized");
  }
  return _bluetooth!;
}

export const reinit = () => {
  _destroyed = true;
  ble = null;
  _bluetooth = null;
  _destroy = null;
  log("BLE marked for reinit");
};

const ensureAlive = () => initBleIfNeeded();

// -------------------------
// Idle policy (the key part)
// -------------------------
// Keep connection open briefly; disconnect on idle; close DBus after everything idle.
// Tweak defaults as needed.
let DEVICE_IDLE_DISCONNECT_MS = 2500;
let DBUS_IDLE_CLOSE_MS = 350;  

export const setDeviceIdleDisconnectMs = (ms: number) => {
  DEVICE_IDLE_DISCONNECT_MS = Math.max(0, ms | 0);
};

export const setDbusIdleCloseMs = (ms: number) => {
  DBUS_IDLE_CLOSE_MS = Math.max(0, ms | 0);
};

let dbusIdleTimer: NodeJS.Timeout | null = null;
const deviceIdleTimers = new Map<string, NodeJS.Timeout>();
const holdCounts = new Map<string, number>(); // for notify subscriptions etc.

function cancelDbusIdleClose() {
  if (dbusIdleTimer) {
    clearTimeout(dbusIdleTimer);
    dbusIdleTimer = null;
  }
}

function scheduleDbusIdleClose() {
  cancelDbusIdleClose();
  if (DBUS_IDLE_CLOSE_MS <= 0) return;

  dbusIdleTimer = setTimeout(async () => {
    const anyConnected = Object.keys(connection_established_obj).length > 0;

    let discovering = false;
    try {
      discovering = await getAdapterStatus();
    } catch {
      // ignore
    }

    if (!anyConnected && !discovering) {
      await close().catch(() => {});
    }
  }, DBUS_IDLE_CLOSE_MS);

  // Do not keep Node alive only because of timer
  dbusIdleTimer.unref?.();
}

function clearDeviceIdleTimer(id: string) {
  const t = deviceIdleTimers.get(id);
  if (t) clearTimeout(t);
  deviceIdleTimers.delete(id);
}

function isHeld(id: string) {
  return (holdCounts.get(id) ?? 0) > 0;
}

// Call this after any successful operation to keep the connection alive briefly
export function touchConnection(id: string) {
  cancelDbusIdleClose();
  if (DEVICE_IDLE_DISCONNECT_MS <= 0) return;
  if (isHeld(id)) return; // subscriptions hold the connection

  clearDeviceIdleTimer(id);

  const t = setTimeout(() => {
    void disconnectByMac(id).catch(() => {});
  }, DEVICE_IDLE_DISCONNECT_MS);

  t.unref?.();
  deviceIdleTimers.set(id, t);
}

// For long-lived notify subscriptions: hold/release connection explicitly
export function holdConnection(id: string) {
  cancelDbusIdleClose();
  clearDeviceIdleTimer(id);
  holdCounts.set(id, (holdCounts.get(id) ?? 0) + 1);
}

export function releaseConnection(id: string) {
  const n = (holdCounts.get(id) ?? 0) - 1;
  if (n <= 0) holdCounts.delete(id);
  else holdCounts.set(id, n);

  // after releasing, we may disconnect on idle
  touchConnection(id);
}

// -------------------------
// Connection store
// -------------------------
export let connection_established_obj: Record<string, any> = {};

// -------------------------
// Adapter helpers
// -------------------------
export const getAdapter = async function () {
  const adapter = await ensureAlive().defaultAdapter();
  return adapter;
};

export const startScan = async function () {
  cancelDbusIdleClose();
  const adapter = await getAdapter();
  if (!(await adapter.isDiscovering())) {
    await adapter.startDiscovery();
    log("Scanning started");
  }
};

export const stopScan = async function () {
  const adapter = await getAdapter();
  if (await adapter.isDiscovering()) {
    await adapter.stopDiscovery();
    log("Scanning stopped");
  }
};

export const getAdapterStatus = async function () {
  const adapter = await getAdapter();
  return adapter.isDiscovering();
};

// -------------------------
// Device lookup + connect
// -------------------------
export const getDeviceById = async function (id: string, timeoutMs = 15000) {
  cancelDbusIdleClose();
  const adapter = await getAdapter();

  return (await Promise.race([
    adapter.waitDevice(id),
    new Promise((_, rej) =>
      setTimeout(
        () => rej(new Error(`Bluetooth device ${id} wasn't found within ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ])) as any;
};

export const connect = async function (id: string) {
  cancelDbusIdleClose();
  try {
    if (id in connection_established_obj) {
      // refresh idle timer
      touchConnection(id);
      return connection_established_obj[id][1]; // gattServer
    }

    const discovering = await getAdapterStatus();
    if (!discovering) await startScan();

    const device: any = await getDeviceById(id);
    log(`Connecting to Device ${id}`);
    await device.connect();
    const gattServer = await device.gatt();

    // stop scanning once connected
    if (await getAdapterStatus()) await stopScan();

    connection_established_obj[id] = [device, gattServer];

    // schedule disconnect after idle
    touchConnection(id);

    return gattServer;
  } catch (error) {
    console.error(error);
    throw new Error(`Error connecting to Bluetooth device ${id}`);
  }
};

// -------------------------
// GATT helpers
// -------------------------
const getPrimaryService = async function (id: string, serviceUUID: string) {
  const entry = connection_established_obj[id];
  if (!entry) throw new Error(`Device ${id} is not connected.`);
  const gattServer = entry[1];

  try {
    const service = await gattServer.getPrimaryService(serviceUUID);
    return service;
  } catch (error) {
    console.error(error);
    throw new Error(`No Services Matching UUID ${serviceUUID} found in Device ${id}.`);
  }
};

export const getCharacteristic = async function (
  id: string,
  serviceUUID: string,
  characteristicUUID: string
) {
  cancelDbusIdleClose();
  const service: any = await getPrimaryService(id, serviceUUID);
  if (!service) return;

  try {
    const characteristic = await service.getCharacteristic(characteristicUUID.toLowerCase());
    log(`Got characteristic ${characteristicUUID} from service ${serviceUUID} of Device ${id}`);

    // keep connection alive since we are actively using it
    touchConnection(id);

    return characteristic;
  } catch (error) {
    console.error(error);
    throw new Error("The device has not the specified characteristic.");
  }
};

// -------------------------
// GAP / Advertisement Helpers
// -------------------------

function bufToHex(buf: Buffer) {
  return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function parseManufacturerData(mfg: Record<string, Buffer>) {
  if (!mfg || typeof mfg !== 'object') return [];

  return Object.entries(mfg).map(([k, buf]) => {
    const companyId = Number(k); // keys come as strings
    return {
      companyId,
      length: buf?.length ?? 0,
      dataHex: Buffer.isBuffer(buf) ? bufToHex(buf) : '',
      data: buf,
    };
  });
}

/**
 * Scans for a device and returns its manufacturer data without establishing a GATT connection.
 */
export const getDeviceManufacturerData = async function (
  id: string,
  timeoutMs = 15000
) {
  cancelDbusIdleClose();
  
  // Ensure scanning to receive advertisements
  if (!(await getAdapterStatus())) {
    await startScan();
  }

  try {
    // Wait for the device to appear
    const device = await getDeviceById(id, timeoutMs);

    log(`Reading GAP data from Device ${id}`);
    
    // 3. Get the data
    const mfg = await device.getManufacturerData();
    
    // stop scanning
    if (await getAdapterStatus()) {
      await stopScan();
    }

    // 5. Trigger idle timer
    touchConnection(id); 

    return parseManufacturerData(mfg);

  } catch (error) {
    // On error, ensure we stop scanning so the process can eventually exit
    try {
      if (await getAdapterStatus()) await stopScan();
    } catch { /* ignore */ }
    
    touchConnection(id);
    throw error;
  }
};

// -------------------------
// Disconnects
// -------------------------
export const disconnectByMac = async function (id: string) {
  clearDeviceIdleTimer(id);

  const entry = connection_established_obj[id];
  if (entry) {
    const device = entry[0];
    try {
      await device.disconnect();
    } catch {
      // ignore disconnect errors
    }
    delete connection_established_obj[id];
    log("Disconnected from Device:", id);
  }

  // If nothing else is connected, schedule DBus close so scripts can exit.
  if (Object.keys(connection_established_obj).length === 0) {
    scheduleDbusIdleClose();
  }
};

export const disconnectAll = async function () {
  for (const [key, value] of Object.entries(connection_established_obj)) {
    clearDeviceIdleTimer(key);
    try {
      await value[0].disconnect();
    } catch {}
  }
  connection_established_obj = {};

  scheduleDbusIdleClose();
};

/**
 * Disconnects from all connected devices and stops all operations by node-ble.
 * Needed to exit program after execution (we call this automatically when idle).
 */
export const close = async function () {
  cancelDbusIdleClose();

  for (const t of deviceIdleTimers.values()) clearTimeout(t);
  deviceIdleTimers.clear();
  holdCounts.clear();

  // stop discovery
  try {
    if (!_destroyed) {
      if (await getAdapterStatus()) {
        await stopScan();
      }
    }
  } catch (e) {
    log("stopScan failed (ignoring):", e);
  }

  await disconnectAll();

  // tear down node-ble (closes DBus)
  try {
    _destroy?.();
  } catch {
    // ignore
  } finally {
    _destroyed = true;
    ble = null;
    _bluetooth = null;
    _destroy = null;
    log("BLE destroyed");
  }
};

// -------------------------
// Helpers for Thing objects
// -------------------------
export const connectThing = async function (Thing: any) {
  const mac = extractMac(Thing);
  await connect(mac);
};

export const disconnectThing = async function (Thing: any) {
  const mac = extractMac(Thing);
  await disconnectByMac(mac);
};

const extractMac = function (Thing: any) {
  let mac: string = "";
  for (const [key] of Object.entries(Thing.properties)) {
    const element = Thing.properties[`${key}`];
    const form = element.forms[0];
    const deconstructedForm = deconstructForm(form);
    mac = deconstructedForm.deviceId;
    break;
  }

  if (mac === "") {
    for (const [key] of Object.entries(Thing.actions)) {
      const element = Thing.actions[`${key}`];
      const form = element.forms[0];
      const deconstructedForm = deconstructForm(form);
      mac = deconstructedForm.deviceId;
      break;
    }
  }

  if (mac === "") {
    for (const [key] of Object.entries(Thing.events)) {
      const element = Thing.events[`${key}`];
      const form = element.forms[0];
      const deconstructedForm = deconstructForm(form);
      mac = deconstructedForm.deviceId;
      break;
    }
  }

  return mac;
};
