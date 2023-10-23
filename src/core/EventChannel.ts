type EventCallback<T> = (event: T) => void;

export default class EventChannel<T> {
  #callbacks = new Set<EventCallback<T>>();
  #remapping = new WeakMap<EventCallback<T>, EventCallback<T>>();

  on(callback: EventCallback<T>) {
    this.#callbacks.add(callback);
  }

  off(callback: EventCallback<T>) {
    if (this.#remapping.has(callback)) {
      const once = this.#remapping.get(callback)!;
      this.#callbacks.delete(once);
    }
    this.#callbacks.delete(callback);
  }

  clear() {
    this.#callbacks.clear();
  }

  once(callback: EventCallback<T>) {
    const once = (event: T) => {
      this.off(once);
      callback(event);
    };
    this.#remapping.set(callback, once);
    this.on(once);
  }

  emit(event: T) {
    for (const callback of this.#callbacks) {
      callback(event);
    }
  }
}
