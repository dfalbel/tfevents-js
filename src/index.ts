import { Event } from "./proto/event";

export class EventFileIterator implements AsyncIterator<Event> {
    constructor(file: File) {
        this.file = file;
    }

    private file: File;
    private position: number = 0;
    
    public async next(): Promise<IteratorResult<Event>> {
        
        let buf = await this.file.slice(this.position, this.position + 8).arrayBuffer();
        this.position += 8 + 4;

        let view = new DataView(buf);
        let size = view.getBigUint64(0, true);

        buf = await this.file.slice(this.position, this.position + Number(size)).arrayBuffer();
        this.position += Number(size) + 4;
        return {
            done: this.position === this.file.size,
            value: Event.fromBinary(new Uint8Array(buf))
        };
    }
}
