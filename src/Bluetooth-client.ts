import { Content, ProtocolClient, ProtocolHelpers } from "@node-wot/core";
import { Form, SecurityScheme } from "@node-wot/td-tools";
import { BluetoothForm } from "./Bluetooth.js";
import { Subscription } from "rxjs";
import { Readable } from "stream";

import {
  read,
  write
} from "./bluetooth/blast_Bluetooth";
import { getCharacteristic } from "./bluetooth/blast_Bluetooth_core";
import { doesNotMatch } from "assert";

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

  /**
   * Reads the value of a ressource
   * @param {BluetoothForm} form form of property to read.
   * @returns {Promise} Promise that resolves to the read value.
   */
  public async readResource(form: BluetoothForm): Promise<Content> {
    const deconstructedForm = this.deconstructForm(form);

    let value = "";
    console.debug(
      "[binding-Bluetooth]",
      `invoking readInt with serviceId ${deconstructedForm.serviceId} characteristicId ${deconstructedForm.characteristicId}`
    );
    value = await read(
      deconstructedForm.deviceId,
      deconstructedForm.serviceId,
      deconstructedForm.characteristicId
    );

    let s = new Readable();
    s.push(value); // string to encode
    s.push(null); // indicates end-of-file; end of the stream
    const body = ProtocolHelpers.toNodeStream(s as Readable);

    return {
      type: "application/ble+octet-stream",
      body: body,
    };
  }

  /**
   * Writes a value to a ressource
   * @param {BluetoothForm} form form of property to write.
   * @param {Content} content content to write to device
   * @returns {Promise} Promise that resolves to the read value.
   */
  public async writeResource(
    form: BluetoothForm,
    content: Content
  ): Promise<void> {
    const deconstructedForm = this.deconstructForm(form);

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
    if (typeof deconstructedForm.expectedData != "undefined") {
      value = this.fill_in_form(deconstructedForm.expectedData, value);
    }

    // Select what operation should be executed
    switch (deconstructedForm.ble_operation) {
      case "write":
        console.debug(
          "[binding-Bluetooth]",
          `invoking writeWithResponse with value ${value}`
        );
        await write(
          deconstructedForm.deviceId,
          deconstructedForm.serviceId,
          deconstructedForm.characteristicId,
          true,
          value
        );
        break;
      case "write-without-response":
        console.debug(
          "[binding-Bluetooth]",
          `invoking writeWithoutResponse with value ${value}`
        );
        await write(
          deconstructedForm.deviceId,
          deconstructedForm.serviceId,
          deconstructedForm.characteristicId,
          false,
          value
        );
        break;
      default: {
        throw new Error(
          `[binding-Bluetooth] unknown operation ${deconstructedForm.operation}`
        );
      }
    }
  }

  /**
   * Invokes an action
   * @param {BluetoothForm} form form of action to invoke.
   * @param {Content} content content to write to device -> Empty
   * @returns {Promise} Promise that resolves to the read value.
   */
  public async invokeResource(
    form: BluetoothForm,
    content: Content
  ): Promise<Content> {
    // Call writeRessource without content
    return this.writeResource(form, content).then(() => {
      let s = new Readable();
      s.push("");
      s.push(null);
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

  /**
   * Subscribe to an "notify" event
   */
  public async subscribeResource(
    form: BluetoothForm,
    next: (content: Content) => void,
    error?: (error: Error) => void,
    complete?: () => void
  ): Promise<Subscription> {
    console.log("CALLED")
    const deconstructedForm = this.deconstructForm(form);

    if (deconstructedForm.ble_operation !== "notify") {
      throw new Error(
        `[binding-Bluetooth] operation ${deconstructedForm.ble_operation} is not supported`
      );
    }
    console.debug(
      "[binding-Bluetooth]",
      `subscribing to characteristic with serviceId ${deconstructedForm.serviceId} characteristicId ${deconstructedForm.characteristicId}`
    );

    const characteristic = await getCharacteristic(
      deconstructedForm.deviceId,
      deconstructedForm.serviceId,
      deconstructedForm.characteristicId
    );

    await characteristic.startNotifications();

    
    characteristic.on("valuechanged", (buffer: any) => {
      console.log("VALUE CHANGED!!!")
      //console.log('subscription', buffer)
      //console.log('read', buffer, buffer.toString());
      const array = new Uint8Array(buffer);
      // Convert value a DataView to ReadableStream
      let s = new Readable();
      s.push(array);
      s.push(null);
      const body = ProtocolHelpers.toNodeStream(s as Readable);
      const content = {
        type: form.contentType || "application/ble+octet-stream",
        body: body,
      };
      next(content);
      //done()
    });


    return new Subscription(() => {
      this.unsubscribe(characteristic);
    });
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
    const deconstructedForm = this.deconstructForm(form);

    if (deconstructedForm.ble_operation !== "notify") {
      throw new Error(
        `[binding-Bluetooth] operation ${deconstructedForm.ble_operation} is not supported`
      );
    }
    console.debug(
      "[binding-Bluetooth]",
      `subscribing to characteristic with serviceId ${deconstructedForm.serviceId} characteristicId ${deconstructedForm.characteristicId}`
    );

    const characteristic = await getCharacteristic(
      deconstructedForm.deviceId,
      deconstructedForm.serviceId,
      deconstructedForm.characteristicId
    );

    await characteristic.startNotifications();

    new Promise<void>((done) => {
      characteristic.on("valuechanged", (buffer: any) => {
        //console.log('subscription', buffer)
        //console.log('read', buffer, buffer.toString());
        const array = new Uint8Array(buffer);
        // Convert value a DataView to ReadableStream
        let s = new Readable();
        s.push(array);
        s.push(null);
        const body = ProtocolHelpers.toNodeStream(s as Readable);
        const content = {
          type: form.contentType || "application/ble+octet-stream",
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

  /**
   * Deconsructs form in object
   * @param {Form} form form to analyze
   * @returns {Object} Object containing all parameters
   */
  private deconstructForm = function (form: BluetoothForm) {
    // See https://github.com/FreuMi/GATT_Thing/blob/main/notes/BLE_binding_template.md#ble-default-vocabulary-terms
    const wot2bleOperation: any = {
      readproperty: "read",
      writeproperty: "write",
      invokeaction: "write-without-response",
      subscribeevent: "notify",
    };

    const deconstructedForm: Record<string, any> = {};

    // Remove gatt://
    deconstructedForm.path = form.href.split("//")[1];

    // DeviceId is mac of device. Add :
    // e.g. c03c59a89106  -> c0:3c:59:a8:91:06
    deconstructedForm.deviceId = deconstructedForm.path
      .split("/")[0]
      .replace(/(.{2})/g, "$1:")
      .slice(0, -1);

    // Extract serviceId
    deconstructedForm.serviceId = deconstructedForm.path.split("/")[1];

    // Extract characteristicId
    deconstructedForm.characteristicId = deconstructedForm.path.split("/")[2];

    // Extract expectedDataformat
    deconstructedForm.expectedDataformat = form[
      "bir:expectedDataformat"
    ] as string;

    // Extract receivedDataformat
    deconstructedForm.receivedDataformat = form[
      "bir:receivedDataformat"
    ] as string;

    // Extract operation -> e.g. readproperty; writeproperty
    deconstructedForm.operation = form.op;

    // Get ble operation with wot2bleOperation map
    const expected_ble_operation =
      wot2bleOperation[deconstructedForm.operation];

    // Get BLE operation type, if not provided use default
    try {
      deconstructedForm.ble_operation = form["bir:methodName"];
    } catch {
      deconstructedForm.ble_operation = expected_ble_operation;
    }

    deconstructedForm.expectedData = undefined;
    try {
      deconstructedForm.expectedData = form["bir:expectedData"];
    } catch {}

    return deconstructedForm;
  };

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
