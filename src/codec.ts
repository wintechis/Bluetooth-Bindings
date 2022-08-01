import { ContentCodec } from "@node-wot/core";
import { DataSchema, DataSchemaValue } from "wot-typescript-definitions";

export class BLEBinaryCodec implements ContentCodec {
    getMediaType(): string {
        return "application/ble+octet-stream";
    }

    bytesToValue(bytes: Buffer, schema: DataSchema, parameters?: { [key: string]: string }): DataSchemaValue {
        console.log("bytesToValue:\n with bytes:"+bytes+"\nschema:"+schema+"\nparameters:"+parameters)
        const parsed = bytes.toString();
        return parsed
    }

    valueToBytes(
        dataValue: unknown,
        schema: DataSchema,
        parameters?: { [key: string]: string }
    ): Buffer {
        console.log("valueToBytes:\n with dataValue:"+dataValue+"\nschema:"+schema+"\nparameters:"+parameters)
        
        let body = "20";

        return Buffer.from(body, "utf-8");
    }
}