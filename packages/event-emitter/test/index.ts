import { EventEmitter } from '../src';

const evt1 = Symbol('evt1');
const evt2 = 'evt2';

interface EventContext {
  value: string;
}

type EventTypes = {
  [evt1]: (someArg?: unknown) => void;
  [evt2]: (text: string, value: number, flag: boolean) => void;
};

describe(`EventEmitter`, () => {
  describe(`#emit`, () => {
    describe(`emitting result`, () => {
      class EE extends EventEmitter<EventTypes> {}
      const ee = new EE();

      test(`when there are no event listeners`, () => {
        expect(ee.emit(evt1)).toBe(false);
      });

      test(`when there are event listeners`, () => {
        ee.on(evt1, () => {});

        expect(ee.emit(evt1)).toBe(true);
      });
    });

    describe(`emitting context`, () => {
      const ee = new EventEmitter<EventTypes, EventContext>();
      const context: EventContext = { value: '__test__' };

      test(`when listeners have no arguments`, done => {
        ee.on(
          evt1,
          function (this: any) {
            expect(this).toBe(context);
            done();
          },
          context,
        ).emit(evt1);

        expect.assertions(1);
      });

      test(`when listeners have multiple arguments`, done => {
        ee.on(
          evt2,
          function (this: EventContext, text, value, flag) {
            expect(text).toBe('abc');
            expect(value).toBe(123);
            expect(flag).toBe(true);
            expect(this).toBe(context);
            done();
          },
          context,
        ).emit(evt2, 'abc', 123, true);

        expect.assertions(4);
      });
    });
  });

  describe(`#eventNames`, () => {
    test(`when there are listeners and there are no listeners`, () => {
      const ee = new EventEmitter<EventTypes>();

      expect(ee.eventNames()).toEqual([]);

      ee.on(evt1, () => {}).on(evt2, () => {});

      expect(ee.eventNames()).toEqual([evt1, evt2]);

      ee.removeAllListeners(evt1);

      expect(ee.eventNames()).toEqual([evt2]);

      ee.removeAllListeners();

      expect(ee.eventNames()).toEqual([]);
    });
  });

  describe(`#listeners and #listenerCount`, () => {
    const ee = new EventEmitter<EventTypes>();
    const listener = () => {};

    test(`when there is no listeners`, () => {
      expect(ee.listeners(evt1)).toEqual([]);
      expect(ee.listenerCount(evt1)).toBe(0);
    });

    test(`when there are listeners`, () => {
      ee.on(evt1, listener);

      expect(ee.listeners(evt1)).toEqual([listener]);
      expect(ee.listenerCount(evt1)).toBe(1);
    });

    test(`modifications invulnerable`, () => {
      ee.listeners(evt1).length = 0;

      expect(ee.listeners(evt1)).toEqual([listener]);
      expect(ee.listenerCount(evt1)).toBe(1);
    });
  });

  describe(`#on`, () => {
    test(`listener is a function`, () => {
      const ee = new EventEmitter<EventTypes>();
      const listener1 = () => {};
      const listener2 = () => {};

      expect(ee.on(evt1, listener1).on(evt1, listener2)).toBe(ee);
      expect(ee.listeners(evt1)).toEqual([listener1, listener2]);
      expect(ee.listenerCount(evt1)).toBe(2);
    });

    test(`listener is not a function`, () => {
      const ee = new EventEmitter<EventTypes>();

      // @ts-expect-error
      expect(() => ee.on(evt1, 'evt1')).toThrow(expect.any(TypeError));
    });
  });

  describe(`#once`, () => {
    test(`emitting only once (even if emits are nested inside the listener)`, () => {
      const ee = new EventEmitter<EventTypes>();
      const listener = jest.fn().mockImplementation(() => {
        expect(ee.emit(evt1)).toBe(false);
      });
      ee.once(evt1, listener);
      ee.emit(evt1, '1');
      ee.emit(evt1, '2');
      ee.emit(evt1, '3');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenLastCalledWith('1');
      expect.assertions(3);
    });

    test(`emitting only once for multiple events`, () => {
      const ee = new EventEmitter<EventTypes>();
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();
      ee.once(evt1, listener1).once(evt1, listener2).on(evt1, listener3);
      ee.emit(evt1, '1');
      ee.emit(evt1, '2');
      ee.emit(evt1, '3');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener1).toHaveBeenLastCalledWith('1');
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenLastCalledWith('1');
      expect(listener3).toHaveBeenCalledTimes(3);
      expect(listener3).toHaveBeenLastCalledWith('3');
    });
  });

  describe(`#removeListener`, () => {
    test(`when the listener is not specified`, () => {
      const ee = new EventEmitter<EventTypes>();
      ee.on(evt1, () => {}).on(evt1, () => {});

      expect(ee.removeListener(evt1)).toBe(ee);
      expect(ee.listeners(evt1)).toEqual([]);
      expect(ee.listenerCount(evt1)).toBe(0);
    });

    test(`when the listener is specified`, () => {
      const ee = new EventEmitter<EventTypes>();
      const listener1 = () => {};
      const listener2 = () => {};
      const listener3 = () => {};
      ee.on(evt1, listener1).on(evt2, listener2).on(evt2, listener3);

      expect(ee.removeListener(evt1, listener2)).toBe(ee);
      expect(ee.listeners(evt1)).toEqual([listener1]);
      expect(ee.listeners(evt2)).toEqual([listener2, listener3]);

      expect(ee.removeListener(evt1, listener1)).toBe(ee);
      expect(ee.listeners(evt1)).toEqual([]);
      expect(ee.listeners(evt2)).toEqual([listener2, listener3]);

      expect(ee.removeListener(evt2, listener2)).toBe(ee);
      expect(ee.listeners(evt2)).toEqual([listener3]);

      expect(ee.removeListener(evt2, listener3)).toBe(ee);
      expect(ee.listeners(evt2)).toEqual([]);

      ee.on(evt1, listener1).on(evt1, listener1).on(evt2, listener2);

      expect(ee.removeListener(evt1, listener1)).toBe(ee);
      expect(ee.listeners(evt1)).toEqual([]);
      expect(ee.listeners(evt2)).toEqual([listener2]);
    });

    test(`when the context is specified`, () => {
      const ee = new EventEmitter<EventTypes, EventContext>();
      const context: EventContext = { value: 'abc' };
      const listener = () => {};
      ee.on(evt1, listener, context);

      expect(ee.removeListener(evt1, listener, { value: 'abc' })).toBe(ee);
      expect(ee.listeners(evt1)).toEqual([listener]);

      expect(ee.removeListener(evt1, listener, context)).toBe(ee);
      expect(ee.listeners(evt1)).toEqual([]);
    });

    test(`when the once flag is specified`, () => {
      const ee = new EventEmitter<EventTypes>();
      const listener = () => {};
      ee.on(evt1, listener);

      expect(ee.removeListener(evt1, listener, undefined, true)).toBe(ee);
      expect(ee.listeners(evt1)).toEqual([listener]);

      expect(ee.removeListener(evt1, listener, undefined, false)).toBe(ee);
      expect(ee.listeners(evt1)).toEqual([]);

      ee.on(evt1, listener).once(evt1, listener);

      expect(ee.removeListener(evt1, listener, undefined, true)).toBe(ee);
      expect(ee.listeners(evt1)).toEqual([listener]);
    });
  });

  describe(`#removeAllListeners`, () => {
    test(`when the event name is not specified`, () => {
      const ee = new EventEmitter<EventTypes>();
      ee.on(evt1, () => {});
      ee.on(evt2, () => {});

      expect(ee.removeAllListeners()).toBe(ee);
      expect(ee.listeners(evt1)).toEqual([]);
      expect(ee.listenerCount(evt1)).toBe(0);
      expect(ee.emit(evt1)).toBe(false);
      expect(ee.listeners(evt2)).toEqual([]);
      expect(ee.listenerCount(evt2)).toBe(0);
      expect(ee.emit(evt2, 'a', 1, true)).toBe(false);
    });

    test(`when the event name is specified`, () => {
      const ee = new EventEmitter<EventTypes>();
      ee.on(evt1, () => {});
      ee.on(evt2, () => {});

      expect(ee.removeAllListeners(evt1)).toBe(ee);
      expect(ee.listeners(evt1)).toEqual([]);
      expect(ee.listenerCount(evt1)).toBe(0);
      expect(ee.emit(evt1)).toBe(false);
      expect(ee.listeners(evt2)).toEqual([expect.any(Function)]);
      expect(ee.listenerCount(evt2)).toBe(1);
      expect(ee.emit(evt2, 'a', 1, true)).toBe(true);
    });
  });
});
