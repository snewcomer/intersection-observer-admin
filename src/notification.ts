import Registry from './registry';

export enum CallbackType {
  enter = 'enter',
  exit = 'exit'
}

export default abstract class Notifications {
  private _registry: Registry;

  constructor() {
    this._registry = new Registry();
  }

  /**
   * Adds an EventListener as a callback for an event key.
   * @param type 'enter' or 'exit'
   * @param key The key of the event
   * @param callback The callback function to invoke when the event occurs
   */
  addCallback(type: CallbackType, element: HTMLElement | Window, callback: (data?: any) => void): void {
    if (type === CallbackType.enter) {
      this._registry.addElement(
        element,
        Object.assign({}, this._registry.getElement(element) ,{ [CallbackType.enter]: callback })
      );
    } else {
      this._registry.addElement(
        element,
        Object.assign({}, this._registry.getElement(element) ,{ [CallbackType.exit]: callback })
      );
    }
  }

  /**
   * @hidden
   * Executes registered callbacks for key.
   * @param type
   * @param element
   * @param data
   */
  dispatchCallback(type: CallbackType, element: HTMLElement | Window, data?: any): void {
    if (type === CallbackType.enter) {
      const { enter } = this._registry.getElement(element)
      enter(data);
    } else {
      const { exit } = this._registry.getElement(element)
      exit(data);
    }
  }

  /**
   * Removes an EventListener callback for event key.
   * @param key The key of the event
   * @param callback The callback function to remove
   */
  removeEventListener(element: HTMLElement | Window): void {
    this._registry.removeElement(element);
  }
}
