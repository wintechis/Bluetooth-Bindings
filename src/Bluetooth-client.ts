import { Content, ProtocolClient, ProtocolHelpers } from "@node-wot/core";
import { Form, SecurityScheme } from "@node-wot/td-tools";
import { BluetoothForm } from "./Bluetooth.js";
import { Subscription } from "rxjs";
import { Readable } from "stream";

import {
  readInt,
  readUInt,
  writeWithResponse,
  writeWithoutResponse,
} from "./blast_Bluetooth.js";
import { getCharacteristic } from "./blast_Bluetooth_core.js";

const handler_map: any = {
  int8: "readInt",
  int12: "readInt",
  int16: "readInt",
  int24: "readInt",
  int32: "readInt",
  int48: "readInt",
  int64: "readInt",
  int128: "readInt",
  uint2: "readUInt",
  uint4: "readUInt",
  uint8: "readUInt",
  uint12: "readUInt",
  uint16: "readUInt",
  uint24: "readUInt",
  uint32: "readUInt",
  uint48: "readUInt",
  uint64: "readUInt",
  uint128: "readUInt",
  float32: "readFloat",
  float64: "readFloat",
  stringUTF8: "readUTF8",
  stringUTF16: "readUTF16",
};

const template_map: any = {
  int8: "number",
  int12: "number",
  int16: "number",
  int24: "number",
  int32: "number",
  int48: "number",
  int64: "number",
  int128: "number",
  uint2: "number",
  uint4: "number",
  uint8: "number",
  uint12: "number",
  uint16: "number",
  uint24: "number",
  uint32: "number",
  uint48: "number",
  uint64: "readUInt",
  uint128: "readUInt",
  float32: "readFloat",
  float64: "readFloat",
  stringUTF8: "readUTF8",
  stringUTF16: "readUTF16",
};

export default class BluetoothClient implements ProtocolClient {
  public toString(): string {
    return "[BluetoothClient]";
  }

  public async readResource(form: BluetoothForm): Promise<Content> {
    const path = form.href.split("//")[1];
    // c03c59a89106  -> c0:3c:59:a8:91:06
    const deviceId = path
      .split("/")[0]
      .replace(/(.{2})/g, "$1:")
      .slice(0, -1);
    const serviceId = path.split("/")[1];
    const characteristicId = path.split("/")[2];
    const expectedDataformat = form["bir:expectedDataformat"] as string;
    const receivedDataformat = form["bir:receivedDataformat"] as string;
    //const operation = form.op
    const ble_operation = form["htvf:methodName"];

    // dataformat form td is mapped to correct operation
    let operation = handler_map[receivedDataformat];

    let value = "";
    switch (operation) {
      case "readInt":
        console.debug(
          "[binding-Bluetooth]",
          `invoking readInt with serviceId ${serviceId} characteristicId ${characteristicId}`
        );
        value = (
          await readInt(deviceId, serviceId, characteristicId)
        ).toString();
        break;
      case "readUInt":
        console.debug(
          "[binding-Bluetooth]",
          `invoking readInt with serviceId ${serviceId} characteristicId ${characteristicId}`
        );
        value = (
          await readUInt(deviceId, serviceId, characteristicId)
        ).toString();
        break;
      default: {
        throw new Error(
          `[binding-Bluetooth] unknown return format ${operation}`
        );
      }
    }

    let s = new Readable();
    s.push(value); // the string you want
    s.push(null); // indicates end-of-file basically - the end of the stream
    const body = ProtocolHelpers.toNodeStream(s as Readable);

    return {
      type: "application/json",
      body: body,
    };
  }

  public async writeResource(
    form: BluetoothForm,
    content: Content
  ): Promise<void> {
    const path = form.href.split("//")[1];
    // c03c59a89106  -> c0:3c:59:a8:91:06
    const deviceId = path
      .split("/")[0]
      .replace(/(.{2})/g, "$1:")
      .slice(0, -1);
    const serviceId = path.split("/")[1];
    const characteristicId = path.split("/")[2];
    const datatype = form.dataType;
    const operation = form.op;
    let ble_operation: any;
    try {
      ble_operation = form["htv:methodName"];
    } catch {
      throw Error("'htv:mehtodName' not provided in td");
    }

    let expectedData: any = undefined;
    try {
      expectedData = form["bir:expectedData"];
    } catch {}

    let value = "";
    //Convert readableStreamToString
    if (typeof content != "undefined") {
      const chunks = [];
      for await (const chunk of content.body) {
        chunks.push(chunk as Buffer);
      }
      const buffer = Buffer.concat(chunks);
      value = new TextDecoder().decode(buffer);
    }

    // If expectedData is provided in td, use it
    if (typeof expectedData != "undefined") {
      value = this.fill_in_form(expectedData, value);
    }

    switch (ble_operation) {
      case "write":
        console.debug(
          "[binding-Bluetooth]",
          `invoking writeWithResponse with value ${value}`
        );
        await writeWithResponse(deviceId, serviceId, characteristicId, value);
        break;
      case "write-without-response":
        console.debug(
          "[binding-Bluetooth]",
          `invoking writeWithoutResponse with value ${value}`
        );
        await writeWithoutResponse(
          deviceId,
          serviceId,
          characteristicId,
          value
        );
        break;
      default: {
        throw new Error(`[binding-Bluetooth] unknown operation ${operation}`);
      }
    }
  }

  public async invokeResource(
    form: BluetoothForm,
    content: Content
  ): Promise<Content> {
    // TODO check if href is service/char/operation, then write,
    // might also be gatt://operation, i.e watchAdvertisements
    return this.writeResource(form, content).then(() => {
      let s = new Readable();
      s.push(""); // the string you want
      s.push(null); // indicates end-of-file basically - the end of the stream
      const body = ProtocolHelpers.toNodeStream(s as Readable);
      return {
        type: "text/plain",
        body: body,
      };
    });
  }

  public unlinkResource(form: Form): Promise<void> {
    throw new Error("not implemented");
  }

  public async subscribeResource(
    form: BluetoothForm,
    next: (content: Content) => void,
    error?: (error: Error) => void,
    complete?: () => void
  ): Promise<Subscription> {
    const path = form.href.split("//")[1];
    const deviceId = path
      .split("/")[0]
      .replace(/(.{2})/g, "$1:")
      .slice(0, -1);
    const serviceId = path.split("/")[1];
    const characteristicId = path.split("/")[2];

    this.subscribeToCharacteristic(form, next, error, complete);

    return new Subscription(() => {});
  }

  public async start(): Promise<void> {
    // do nothing
  }

  public async stop(): Promise<void> {
    // do nothing
  }

  public setSecurity(
    metadata: SecurityScheme[],
    credentials?: unknown
  ): boolean {
    return false;
  }

  private async subscribeToCharacteristic(
    form: BluetoothForm,
    next: (content: Content) => void,
    error?: (error: Error) => void,
    complete?: () => void
  ): Promise<Subscription> {
    const path = form.href.split("//")[1];
    // c03c59a89106  -> c0:3c:59:a8:91:06
    const deviceId = path
      .split("/")[0]
      .replace(/(.{2})/g, "$1:")
      .slice(0, -1);
    const serviceId = path.split("/")[1];
    const characteristicId = path.split("/")[2];
    const datatype = form.dataType;
    const operation = form.op;
    const ble_operation = form["htv:methodName"] as string;

    if (ble_operation !== "notify") {
      throw new Error(
        `[binding-webBluetooth] operation ${ble_operation} is not supported`
      );
    }
    console.debug(
      "[binding-webBluetooth]",
      `subscribing to characteristic with serviceId ${serviceId} characteristicId ${characteristicId}`
    );

    const characteristic = await getCharacteristic(
      deviceId,
      serviceId,
      characteristicId
    );
    await characteristic.startNotifications();

    await new Promise<void>((done) => {
      characteristic.on("valuechanged", (buffer: any) => {
        //console.log('subscription', buffer)
        //console.log('read', buffer, buffer.toString());
        const array = new Uint8Array(buffer);
        // Convert value a DataView to ReadableStream
        let s = new Readable();
        s.push(array); // the string you want
        s.push(null); // indicates end-of-file basically - the end of the stream
        const body = ProtocolHelpers.toNodeStream(s as Readable);
        const content = {
          type: form.contentType || "text/plain",
          body: body,
        };
        next(content);
        done();
      });
    });

    return new Subscription(() => {
      this.unsubscribe(characteristic);
    });
  }

  private async unsubscribe(characteristic: any) {
    await characteristic.stopNotifications();
  }

  private fill_in_form(expectedData: any, value: any) {
    value = value.replace('"', "");
    value = value.split(",");

    let string_template = expectedData[0]["bir:hasForm"];
    const parameter = expectedData[0]["bir:hasParameter"];

    for (let index = 0; index < parameter.length; ++index) {
      // Get datatype
      let dataType = parameter[index].split(":")[1].trim();
      // Get number value
      let placeholder = value[index].split(":")[0].trim();
      let placeholder_value = value[index].split(":")[1].trim();

      // Parse String
      if (template_map[dataType] == "number") {
        placeholder_value = parseInt(placeholder_value);
      }

      // check length
      let hex_string = placeholder_value.toString(16);
      if (hex_string.length == 1) {
        hex_string = "0" + hex_string;
      }
      string_template = string_template.replace(
        "{" + placeholder + "}",
        hex_string
      );
    }
    return string_template;
  }
}
