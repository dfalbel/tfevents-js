import { Event } from "./proto/event";
import { ScalarPluginData } from "./proto/plugins/scalar/plugin_data";
import { Summary } from "./proto/summary";

interface ScalarsIteratorResult {
    step: number,
    tag: string,
    value: number,
}

// Takes a stream of `Events` and parses data in a simpler format for building plots, etc.
export async function* ScalarsIterator (events: AsyncGenerator<Event>) : AsyncGenerator<ScalarsIteratorResult> {
    for await (let event of events) {
        if (event.what.oneofKind != "summary") {
            continue;
        }

        let summary: Summary = event.what.summary;
        let value = summary.value[0];

        if (value.value.oneofKind != "simpleValue") {
            continue;
        }

        yield {
            "step" : Number(event.step),
            "tag": value.tag,
            "value": value.value.simpleValue,
        }
    }
}

// Returns an async iterator that yields `Event` objects from a tfevents file stream.
export async function* TFEventStreamIterator (stream: ReadableStream<Uint8Array>) : AsyncGenerator<Event> {

    const reader = stream.pipeThrough(TFEventStreamParser()).getReader();

    do {
        var {done, value} = await reader.read();

        if (value === undefined) {
            break;
        }

        for (var event of value) {
            yield event;
        }

    } while(!done);
}

// Returns a `TransformStream` that converts a stream from a tfevents file and parses it into `Event` objects.
// Mostly for lower level control. In general you would use `TFEventStreamIterator` instead.
export function TFEventStreamParser () {
    let remainder = new Uint8Array(0);

    return new TransformStream<Uint8Array, Event[]>({
        transform(chunk: Uint8Array, controller) {
            
            if (remainder.length > 0) {
                chunk = Buffer.concat([remainder, chunk]);
                remainder = new Uint8Array(0);
            }

            let pos = 0;
            let events = [];

            do {
                // check if can read the length, if we can't then we need to wait for more data
                if (pos + 8 > chunk.length) {
                    remainder = chunk;
                    break;
                }

                let length = Buffer.from(chunk.subarray(pos, pos+8)).readBigInt64LE(0);

                // check if we can read the whole event, if we can't then we need to wait for more data
                let messageLength =  8 + 4 + Number(length) + 4;
                if (pos + messageLength > chunk.length) {
                    remainder = chunk;
                    break;
                }

                events.push(Event.fromBinary(chunk.subarray(pos + 12, pos + 12 + Number(length))));
                pos += messageLength;

            } while (pos < chunk.length);
            
            controller.enqueue(events);
        }
    });
}