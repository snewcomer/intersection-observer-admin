import Notifications, { CallbackType } from './notification';
import Registry from './registry';

export interface IOptions {
  root?: HTMLElement;
  rootMargin?: string;
  threshold?: number;
  [key: string]: any;
}

type EntryForKey = {
  elements: [HTMLElement];
  options: IOptions;
  intersectionObserver: any;
};

type PotentialRootEntry = {
  [stringifiedOptions: string]: EntryForKey;
};

export default class IntersectionObserverAdmin extends Notifications {
  private elementRegistry: Registry;

  constructor() {
    super();
    this.elementRegistry = new Registry();
  }

  /**
   * Adds element to observe via IntersectionObserver and stores element + relevant callbacks and observer options in static
   * administrator for lookup in the future
   *
   * @method add
   * @param {HTMLElement | Window} element
   * @param {Object} options
   * @public
   */
  public observe(element: HTMLElement, options: IOptions = {}): void {
    if (!element) {
      return;
    }

    this.elementRegistry.addElement(element, options);

    this.setupObserver(element, options);
  }

  /**
   * Unobserve target element and remove element from static admin
   *
   * @method unobserve
   * @param {HTMLElement|Window} target
   * @param {Object} options
   * @public
   */
  public unobserve(target: HTMLElement, options: IOptions): void {
    const matchingRootEntry:
      | EntryForKey
      | undefined = this._findMatchingRootEntry(options);

    if (matchingRootEntry) {
      const { intersectionObserver } = matchingRootEntry;
      intersectionObserver.unobserve(target);
    }
  }

  /**
   * register event to handle when intersection observer detects enter
   *
   * @method addEnterCallback
   * @public
   */
  public addEnterCallback(
    element: HTMLElement | Window,
    callback: (data?: any) => void
  ) {
    this.addCallback(CallbackType.enter, element, callback);
  }

  /**
   * register event to handle when intersection observer detects exit
   *
   * @method addExitCallback
   * @public
   */
  public addExitCallback(
    element: HTMLElement | Window,
    callback: (data?: any) => void
  ) {
    this.addCallback(CallbackType.exit, element, callback);
  }

  /**
   * retrieve registered callback and call with data
   *
   * @method dispatchEnterCallback
   * @public
   */
  public dispatchEnterCallback(element: HTMLElement | Window, entry: any) {
    this.dispatchCallback(CallbackType.enter, element, entry);
  }

  /**
   * retrieve registered callback and call with data on exit
   *
   * @method dispatchExitCallback
   * @public
   */
  public dispatchExitCallback(element: HTMLElement | Window, entry: any) {
    this.dispatchCallback(CallbackType.exit, element, entry);
  }

  /**
   * cleanup data structures and unobserve elements
   *
   * @method destroy
   * @public
   */
  public destroy(): void {
    this.elementRegistry.destroyRegistry();
  }

  /**
   * use function composition to curry options
   *
   * @method setupOnIntersection
   * @param {Object} options
   */
  protected setupOnIntersection(options: IOptions): Function {
    return (ioEntries: any) => {
      return this.onIntersection(options, ioEntries);
    };
  }

  protected setupObserver(element: HTMLElement, options: IOptions): void {
    const { root = window } = options;

    // find shared root element (window or target HTMLElement)
    // this root is responsible for coordinating it's set of elements
    const potentialRootMatch:
      | PotentialRootEntry
      | null
      | undefined = this._findRoot(root);

    // third if there is a matching root, see if an existing entry with the same options
    // regardless of sort order.  This is a bit of work
    let matchingEntryForRoot;
    if (potentialRootMatch) {
      matchingEntryForRoot = this._determineMatchingElements(
        options,
        potentialRootMatch
      );
    }

    // next add found entry to elements and call observer if applicable
    if (matchingEntryForRoot) {
      const { elements, intersectionObserver } = matchingEntryForRoot;
      elements.push(element);
      if (intersectionObserver) {
        intersectionObserver.observe(element);
      }
    } else {
      // otherwise start observing this element if applicable
      // watcher is an instance that has an observe method
      const intersectionObserver = this.newObserver(element, options);

      const observerEntry: EntryForKey = {
        elements: [element],
        intersectionObserver,
        options
      };

      // and add entry to WeakMap under a root element
      // with watcher so we can use it later on
      const stringifiedOptions: string = this._stringifyOptions(options);
      if (potentialRootMatch) {
        // if share same root and need to add new entry to root match
        // not functional but :shrug
        potentialRootMatch[stringifiedOptions] = observerEntry;
      } else {
        // no root exists, so add to WeakMap
        this.elementRegistry.addElement(root, {
          [stringifiedOptions]: observerEntry
        });
      }
    }
  }

  private newObserver(
    element: HTMLElement,
    options: IOptions
  ): IntersectionObserver {
    // No matching entry for root in static admin, thus create new IntersectionObserver instance
    const { root, rootMargin, threshold } = options;

    const newIO = new IntersectionObserver(
      this.setupOnIntersection(options).bind(this),
      { root, rootMargin, threshold }
    );
    newIO.observe(element);

    return newIO;
  }

  /**
   * IntersectionObserver callback when element is intersecting viewport
   * either when `isIntersecting` changes or `intersectionRadio` crosses on of the
   * configured `threshold`s.
   *
   * @method onIntersection
   * @param {Object} options
   * @param {Array} ioEntries
   * @private
   */
  private onIntersection(options: IOptions, ioEntries: Array<any>): void {
    ioEntries.forEach(entry => {
      const { isIntersecting, intersectionRatio } = entry;
      let threshold = options.threshold || 0;
      if (Array.isArray(threshold)) {
        threshold = threshold[threshold.length - 1];
      }

      // then find entry's callback in static administration
      const matchingRootEntry:
        | EntryForKey
        | undefined = this._findMatchingRootEntry(options);

      // first determine if entry intersecting
      // https://www.w3.org/TR/intersection-observer/#update-intersection-observations-algo
      if (isIntersecting || intersectionRatio >= threshold) {
        if (matchingRootEntry) {
          matchingRootEntry.elements.some((element: HTMLElement) => {
            if (element && element === entry.target) {
              this.dispatchEnterCallback(element, entry);
              return true;
            }
            return false;
          });
        }
      } else {
        if (matchingRootEntry) {
          matchingRootEntry.elements.some((element: HTMLElement) => {
            if (element && element === entry.target) {
              this.dispatchExitCallback(element, entry);
              return true;
            }
            return false;
          });
        }
      }
    });
  }

  /**
   * { root: { stringifiedOptions: { observer, elements: []...] } }
   * @method _findRoot
   * @param {HTMLElement|Window} root
   * @private
   * @return {Object} of elements that share same root
   */
  private _findRoot(
    root: HTMLElement | Window
  ): PotentialRootEntry | null | undefined {
    if (this.elementRegistry) {
      return this.elementRegistry.getElement(root);
    }
  }

  /**
   * We don't care about options key order because we already added
   * to the static administrator
   *
   * @method _findMatchingRootEntry
   * @param {Object} options
   * @return {Object} entry with elements and other options
   */
  private _findMatchingRootEntry(options: IOptions): EntryForKey | undefined {
    const { root = window } = options;
    const matchingRoot: PotentialRootEntry | null | undefined = this._findRoot(
      root
    );

    if (matchingRoot) {
      const stringifiedOptions: string = this._stringifyOptions(options);
      return matchingRoot[stringifiedOptions];
    }
  }

  /**
   * Determine if existing elements for a given root based on passed in options
   * regardless of sort order of keys
   *
   * @method _determineMatchingElements
   * @param {Object} options
   * @param {Object} potentialRootMatch e.g. { stringifiedOptions: { elements: [], ... }, stringifiedOptions: { elements: [], ... }}
   * @private
   * @return {Object} containing array of elements and other meta
   */
  private _determineMatchingElements(
    options: IOptions,
    potentialRootMatch: PotentialRootEntry
  ): EntryForKey | undefined {
    const matchingKey = Object.keys(potentialRootMatch).filter(key => {
      const { options: comparableOptions } = potentialRootMatch[key];
      return this._areOptionsSame(options, comparableOptions);
    })[0];

    return potentialRootMatch[matchingKey];
  }

  /**
   * recursive method to test primitive string, number, null, etc and complex
   * object equality.
   *
   * @method _areOptionsSame
   * @param {any} a
   * @param {any} b
   * @private
   * @return {boolean}
   */
  private _areOptionsSame(a: IOptions | any, b: IOptions | any): boolean {
    if (a === b) {
      return true;
    }

    // simple comparison
    const type1 = Object.prototype.toString.call(a);
    const type2 = Object.prototype.toString.call(b);
    if (type1 !== type2) {
      return false;
    } else if (type1 !== '[object Object]' && type2 !== '[object Object]') {
      return a === b;
    }

    if (a && b && typeof a === 'object' && typeof b === 'object') {
      // complex comparison for only type of [object Object]
      for (const key in a) {
        if (a.hasOwnProperty(key)) {
          // recursion to check nested
          if (this._areOptionsSame(a[key], b[key]) === false) {
            return false;
          }
        }
      }
    }

    // if nothing failed
    return true;
  }

  /**
   * Stringify options for use as a key.
   * Excludes options.root so that the resulting key is stable
   *
   * @param {Object} options
   * @private
   * @return {String}
   */
  private _stringifyOptions(options: IOptions): string {
    const { root } = options;

    const replacer = (key: string, value: string): string => {
      if (key === 'root' && root) {
        const classList = Array.prototype.slice.call(root.classList);

        const classToken = classList.reduce((acc, item) => {
          return (acc += item);
        }, '');

        const id: string = root.id;

        return `${id}-${classToken}`;
      }

      return value;
    };

    return JSON.stringify(options, replacer);
  }
}
