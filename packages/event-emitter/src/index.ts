import { AnyFunc } from '@codecb/ts-utils/function';

interface EventObject<Context, Listener extends AnyFunc> {
  context: Context;
  listener: Listener;
  once: boolean;
}

type BaseEventTypes = Record<string | symbol, AnyFunc>;

export class EventEmitter<
  EventTypes extends BaseEventTypes = BaseEventTypes,
  Context = unknown,
> {
  readonly #eventMap = new Map<
    keyof EventTypes,
    EventObject<Context, AnyFunc>[]
  >();

  /**
   * Add a listener for a given event
   * @param eventName The event name
   * @param listener The listener function
   * @param context The context to invoke the listener with
   * @returns `this`
   * @alias on
   */
  addListener<EventName extends keyof EventTypes>(
    eventName: EventName,
    listener: EventTypes[EventName],
    context?: Context,
  ): this {
    return this.#addEventObject(eventName, listener, context, false);
  }

  /**
   * Call each of the listeners registered for a given event
   * @param eventName The event name
   * @param args The list of arguments passed to listeners
   * @returns `true` of the event had listeners, else `false`
   */
  emit<EventName extends keyof EventTypes>(
    eventName: EventName,
    ...args: Parameters<EventTypes[EventName]>
  ): boolean {
    const eventObjects = this.#getEventObjects(eventName);
    if (!eventObjects.length) return false;
    eventObjects.forEach(({ context, listener, once }) => {
      if (once) this.#removeEventObjects(eventName, listener, undefined, true);
      listener.apply(context, args);
    });
    return true;
  }

  /**
   * Return an array listing the events for which the emitter has registered listeners.
   * @returns The registered event names
   */
  eventNames(): (keyof EventTypes)[] {
    return [...this.#eventMap.keys()];
  }

  /**
   * Return the number of listeners listening to a given event
   * @param eventName The event name
   * @returns The number of listeners
   */
  listenerCount<EventName extends keyof EventTypes>(eventName: EventName) {
    return this.#getEventObjects(eventName).length;
  }

  /**
   * Return the listeners registered for a given event
   * @param eventName The event name
   * @returns The registered listeners
   */
  listeners<EventName extends keyof EventTypes>(
    eventName: EventName,
  ): EventTypes[EventName][] {
    return this.#getEventObjects(eventName).map(({ listener }) => listener);
  }

  /**
   * Remove the listeners of a given event
   * @param eventName The event name
   * @param listener Only remove the listeners that match this function
   * @param context Only remove the listeners that have this context
   * @param once Only remove one-time listeners
   * @returns `this`
   */
  off<EventName extends keyof EventTypes>(
    eventName: EventName,
    listener?: EventTypes[EventName],
    context?: Context,
    once = false,
  ): this {
    return this.#removeEventObjects(eventName, listener, context, once);
  }

  /**
   * Add a listener for a given event
   * @param eventName The event name
   * @param listener The listener function
   * @param context The context to invoke the listener with
   * @returns `this`
   */
  on<EventName extends keyof EventTypes>(
    eventName: EventName,
    listener: EventTypes[EventName],
    context?: Context,
  ): this {
    return this.#addEventObject(eventName, listener, context, false);
  }

  /**
   * Add a one-time listener for a given event
   * @param eventName The event name
   * @param listener The listener function
   * @param context The context to invoke the listener with
   * @returns `this`
   */
  once<EventName extends keyof EventTypes>(
    eventName: EventName,
    listener: EventTypes[EventName],
    context?: Context,
  ): this {
    return this.#addEventObject(eventName, listener, context, true);
  }

  /**
   * Remove all listeners, or those of the specified event
   * @param eventName The event name
   * @returns `this`
   */
  removeAllListeners<EventName extends keyof EventTypes>(
    eventName?: EventName,
  ): this {
    return this.#removeEventObjects(eventName, undefined, undefined, false);
  }

  /**
   * Remove the listeners of a given event
   * @param eventName The event name
   * @param listener Only remove the listeners that match this function
   * @param context Only remove the listeners that have this context
   * @param once Only remove one-time listeners
   * @returns `this`
   * @alias off
   */
  removeListener<EventName extends keyof EventTypes>(
    eventName: EventName,
    listener?: EventTypes[EventName],
    context?: Context,
    once = false,
  ): this {
    return this.#removeEventObjects(eventName, listener, context, once);
  }

  #addEventObject<EventName extends keyof EventTypes>(
    eventName: EventName,
    listener: EventTypes[EventName],
    context: Context = this as unknown as Context,
    once: boolean,
  ): this {
    if (typeof listener !== 'function')
      throw new TypeError('The listener must be a function');
    let eventObjects = this.#eventMap.get(eventName);
    if (!eventObjects) {
      eventObjects = [];
      this.#eventMap.set(eventName, eventObjects);
    }
    eventObjects.push({ context, listener, once });
    return this;
  }

  #getEventObjects<EventName extends keyof EventTypes>(
    eventName: EventName,
  ): EventObject<Context, EventTypes[EventName]>[] {
    return (
      (this.#eventMap.get(eventName) as EventObject<
        Context,
        EventTypes[EventName]
      >[]) ?? []
    );
  }

  #removeEventObjects<EventName extends keyof EventTypes>(
    eventName: EventName | undefined,
    listener: EventTypes[EventName] | undefined,
    context: Context | undefined,
    once: boolean,
  ): this {
    if (!eventName) {
      this.#eventMap.clear();
      return this;
    }
    const eventObjects = this.#eventMap.get(eventName);
    const filteredEventObjects = eventObjects?.filter(
      evtObj =>
        listener &&
        (evtObj.listener !== listener ||
          (context && evtObj.context !== context) ||
          (once && !evtObj.once)),
    );
    if (!filteredEventObjects?.length) this.#eventMap.delete(eventName);
    else this.#eventMap.set(eventName, filteredEventObjects);
    return this;
  }
}

export default EventEmitter;
