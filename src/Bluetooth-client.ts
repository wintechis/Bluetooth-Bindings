import { Content, ProtocolClient, ProtocolHelpers } from '@node-wot/core';
import { Form, SecurityScheme } from '@node-wot/td-tools';
import { BluetoothForm } from './Bluetooth.js';
import { Subscription } from 'rxjs';
import { Readable } from "stream";

import { readNumber, writeWithResponse, writeWithoutResponse } from './blast_Bluetooth.js';


export default class BluetoothClient implements ProtocolClient {
    public toString(): string {
        return '[BluetoothClient]';
    }

    public async readResource(form: BluetoothForm): Promise<Content> {
        const path = form.href.split('//')[1];
        const serviceId = path.split("/")[0];
        const characteristicId = path.split("/")[1];
        const datatype = form.dataType
        //const operation = form.op
        const ble_operation = form["htv:methodName"]
        const deviceId = "c0:3c:59:a8:91:06"

        let operation = "readNumber"

        let value = '';
        switch (operation) {
            case 'readNumber':
                console.debug(
                '[binding-Bluetooth]',
                `invoking readNumber with serviceId ${serviceId} characteristicId ${characteristicId}`
                );
                value = (
                await readNumber(deviceId, serviceId, characteristicId)
                ).toString();
                break;
            default: {
                throw new Error(
                    `[binding-Bluetooth] unknown return format ${operation}`
                );
            }
        }
        
        let s = new Readable()
        s.push(value)    // the string you want
        s.push(null)      // indicates end-of-file basically - the end of the stream
        const body = ProtocolHelpers.toNodeStream(s as Readable);

        return {
            type: 'application/json',
            body: body,
        };
    }

    public writeResource(
        form: BluetoothForm,
        content: Content
    ): Promise<void> {
        const path = form.href.split('//')[1];
        const serviceId = path.split("/")[0];
        const characteristicId = path.split("/")[1];
        const datatype = form.dataType
        const operation = form.op
        const ble_operation = form["htv:methodName"]

        return this.write(
            "c0:3c:59:a8:91:06",
            serviceId,
            characteristicId,
            "writeWithResponse",
            content
          );
    }
    
    public invokeResource(
        form: BluetoothForm,
        content: Content
      ): Promise<Content> {
        const path = form.href.split('//')[1];
        const serviceId = path.split("/")[0];
        const characteristicId = path.split("/")[1];
        const datatype = form.dataType
        const operation = form.op
        const ble_operation = form["htv:methodName"]
        // TODO check if href is service/char/operation, then write,
        // might also be gatt://operation, i.e watchAdvertisements
        return this.writeResource(form, content).then(() => {
          let s = new Readable()
          s.push("")    // the string you want
          s.push(null)      // indicates end-of-file basically - the end of the stream
          const body = ProtocolHelpers.toNodeStream(s as Readable);
          return {
            type: 'text/plain',
            body: body,
          };
        });
      }

    public unlinkResource(form: Form): Promise<void> {
        throw new Error('not implemented');
    }

    public async subscribeResource(
        form: BluetoothForm,
        next: (content: Content) => void,
        error?: (error: Error) => void,
        complete?: () => void
    ): Promise<Subscription> {

        const path = form.href.split('//')[1];
        console.log("SUBSCRIBE")

        return new Subscription(() => { });
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

    private async write(
        deviceId: string,
        serviceId: string,
        characteristicId: string,
        operation: string,
        content: Content
      ) {
        let value = ''
        //Convert readableStreamToString
        if (typeof content != "undefined"){
          const chunks = [];
          for await (const chunk of content.body) {
              chunks.push(chunk as Buffer);
          }
          const buffer = Buffer.concat(chunks);
          value = new TextDecoder().decode(buffer);
  
          }

          switch (operation) {
              case 'writeWithResponse':
                console.debug(
                  '[binding-Bluetooth]',
                  `invoking writeWithResponse with value ${value}`
                );
                await writeWithResponse(deviceId, serviceId, characteristicId, value);
                break;
              case 'writeWithoutResponse':
                console.debug(
                  '[binding-Bluetooth]',
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
                throw new Error(
                  `[binding-Bluetooth] unknown operation ${operation}`
                );
              }
          }
        }
}