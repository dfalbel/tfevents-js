import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { describe, expect, test } from '@jest/globals';
import { TFEventStreamParser, TFEventStreamIterator} from '../index';

describe("EventFileIterator", () => {
    test("Load a basic file", async () => {
        let file = createReadStream("src/__tests__/assets/events.out.tfevents.1687811641.v2");
        let stream = Readable.toWeb(file) as ReadableStream<Uint8Array>;
        
        let iterator = TFEventStreamIterator(stream);
        let result = await iterator.next();
        
        expect(result.done).toBe(false);
        expect(result.value.step).toBe(0n);
        expect(result.value.what.fileVersion).toBe("brain.Event:2");

        result = await iterator.next();
        expect(result.value.step).toBe(0n);
        expect(result.value.what.summary.value[0].tag).toBe("hello");
        expect(result.value.what.summary.value[0].value.simpleValue).toBe(1);
        expect(result.done).toBe(false);

        result = await iterator.next();
        expect(result.done).toBe(true);
    })
});

describe("EventStream", () => {

    test("Load a basic file", async () => {
        let file = createReadStream("src/__tests__/assets/events.out.tfevents.1687811641.v2");
        let stream = Readable.toWeb(file) as ReadableStream<Uint8Array>;

        let a = stream.pipeThrough(TFEventStreamParser());
        let reader = a.getReader();
        reader.read
        let result = await reader.read();

    })

});