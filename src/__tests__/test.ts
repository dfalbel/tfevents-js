import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { describe, expect, test } from '@jest/globals';
import { TFEventStreamParser, TFEventStreamIterator, ScalarsIterator} from '../index';

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

describe("Can obtain scalars from files", () => {
    test("Simple scalar loading", async () => {
        let file = createReadStream("src/__tests__/assets/events.out.tfevents.1687811641.v2");
        let stream = Readable.toWeb(file) as ReadableStream<Uint8Array>;

        let iter = ScalarsIterator(TFEventStreamIterator(stream));
        for await (let scalar of iter) {
            console.log(scalar);
        }
    })

    test("Can load from a in the wild file", async () => {
        let file = await fetch("https://huggingface.co/marieke93/MiniLM-evidence-types/resolve/main/runs/bs32_lr2e-5/events.out.tfevents.1654626971.968b1e06c6a3.78.28")
        let stream = file.body;

        if (stream === null) {
            throw new Error("Stream is null");
        }

        let iter = ScalarsIterator(TFEventStreamIterator(stream));
        for await (let scalar of iter) {
            console.log(scalar);
        }
    })
})