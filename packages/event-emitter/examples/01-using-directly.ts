import { EventEmitter } from '../src/index.js';

interface Data {
  query: unknown;
  ts: Date;
}

type EventTypes = {
  request: (query: unknown) => void;
  response: (data: Data) => void;
};

class Fetcher {
  constructor(private emitter: EventEmitter<EventTypes>) {}

  start() {
    this.emitter.on('request', this.onRequest, this);
  }

  stop() {
    this.emitter.off('request', this.onRequest);
  }

  private async onRequest(query: unknown) {
    setTimeout(() => {
      const data: Data = { query, ts: new Date() };
      this.emitter.emit('response', data);
    }, 1000);
  }
}

class Processor {
  private intervalId: NodeJS.Timer | undefined;

  constructor(private emitter: EventEmitter<EventTypes>) {}

  start() {
    this.emitter.on('response', this.onResponse, this);
    this.intervalId = setInterval(
      () => this.emitter.emit('request', Date.now()),
      1000,
    );
  }

  stop() {
    this.emitter.off('response', this.onResponse);
    clearInterval(this.intervalId);
  }

  private onResponse(data: Data) {
    console.log(data);
  }
}

const emitter = new EventEmitter<EventTypes>();
const fetcher = new Fetcher(emitter);
const processor = new Processor(emitter);

fetcher.start();
processor.start();

setTimeout(() => {
  fetcher.stop();
  processor.stop();
}, 5000);
