import Registry from './registry';

const noop = () => {};

export enum CallbackType {
  enter = 'enter',
  exit = 'exit'
}

export default abstract class Notifications {
  private registry: Registry;

  constructor() {
    this.registry = new Registry();
  }

  /**
   * Adds an EventListener as a callback for an event key.
   * @param type 'enter' or 'exit'
   * @param key The key of the event
   * @param callback The callback function to invoke when the event occurs
   */
  public addCallback(
    type: CallbackType,
    element: HTMLElement | Window,
    callback: (data?: any) => void
  ): void {
    let entry;
    if (type === CallbackType.enter) {
      entry = { [CallbackType.enter]: callback };
    } else {
      entry = { [CallbackType.exit]: callback };
    }

    this.registry.addElement(
      element,
      Object.assign({}, this.registry.getElement(element), entry)
    );
  }

  /**
   * @hidden
   * Executes registered callbacks for key.
   * @param type
   * @param element
   * @param data
   */
  public dispatchCallback(
    type: CallbackType,
    element: HTMLElement | Window,
    data?: any
  ): void {
    if (type === CallbackType.enter) {
      const { enter = noop } = this.registry.getElement(element);
      enter(data);
    } else {
      // no element in WeakMap possible because element may be removed from DOM by the time we get here
      const found = this.registry.getElement(element);
      if (found && found.exit) {
        found.exit(data);
      }
    }
  }
}
