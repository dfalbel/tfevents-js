import { EventFileIterator } from '../index';
import { readFileSync } from 'fs';
import {describe, expect, test} from '@jest/globals';

describe("EventFileIterator", () => {
    test("Load a basic file", async () => {
        let file = await readFileSync("src/__tests__/assets/events.out.tfevents.1687811641.v2");
        let iterator = new EventFileIterator(new File([file], "events.tfevents"));
        let result = await iterator.next();
        
        expect(result.done).toBe(false);
        expect(result.value.step).toBe(0n);
        expect(result.value.what.fileVersion).toBe("brain.Event:2");

        result = await iterator.next();
        expect(result.value.step).toBe(0n);
        expect(result.value.what.summary.value[0].tag).toBe("hello");
        expect(result.value.what.summary.value[0].value.simpleValue).toBe(1);
        expect(result.done).toBe(true);
    })
});