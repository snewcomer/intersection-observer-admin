export interface IOptions {
  [key: string]: any;
}

export default class Registry {
  public registry: WeakMap<HTMLElement | Window, IOptions>;

  constructor() {
    this.registry = new WeakMap();
  }

  public elementExists(elem: HTMLElement | Window): Boolean | null {
    return this.registry.has(elem);
  }

  public getElement(elem: HTMLElement | Window): any {
    return this.registry.get(elem);
  }

  /**
   * administrator for lookup in the future
   *
   * @method add
   * @param {HTMLElement | Window} element - the item to add to root element registry
   * @param {IOption} options
   * @param {IOption.root} root - contains optional root e.g. window, container div, etc
   * @param {IOption.watcher} observer - optional
   * @public
   */
  public addElement(element: HTMLElement | Window, options?: IOptions): void {
    if (!element) {
      return;
    }

    // first make sure element is in registry
    if (!this.registry.has(element)) {
      this.registry.set(element, options || {});
    }
  }

  /**
   * @method remove
   * @param {HTMLElement|Window} target
   * @public
   */
  public removeElement(target: HTMLElement | Window): void {
    this.registry.delete(target);
  }

  /**
   * reset weak map
   *
   * @method destroy
   * @public
   */
  public destroyRegistry(): void {
    this.registry = new WeakMap();
  }
}