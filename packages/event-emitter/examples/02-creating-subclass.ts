import { EventEmitter } from '../src/index.js';

type EventTypes = {
  data: (chunk: string) => void;
  end: () => void;
  progress: (ratio: number) => void;
};

class DecipherStream extends EventEmitter<EventTypes> {
  constructor(private source: string) {
    super();
  }

  start() {
    let index = 0;
    const intervalId = setInterval(() => {
      if (index === this.source.length) {
        this.emit('end');
        clearInterval(intervalId);
        return;
      }
      const code = this.source.charCodeAt(index);
      this.emit('progress', index / this.source.length);
      this.emit('data', String(code));
      ++index;
    }, 500);
  }
}

new DecipherStream('مرحبا بكم في العالم العربي.')
  .on('data', data => console.log({ data }))
  .on('end', () => console.log({ status: 'end' }))
  .on('progress', progress => console.log({ progress }))
  .start();
