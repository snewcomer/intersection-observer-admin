import Registry from 'weak-map-element-registry';

type IndividualEntry = {
  element?: HTMLElement | Window;
  enterCallback?: Function;
  exitCallback?: Function;
};

export interface IOptions {
  root?: HTMLElement;
  rootMargin?: string;
  threshold?: number;
  scrollableArea?: string,
  [key: string]: any;
}

type Root = {
  elements: [IndividualEntry];
  options: IOptions;
  intersectionObserver: any;
};

type PotentialRootEntry = {
  [stringifiedOptions: string]: Root;
};

export default class IntersectionObserverAdmin {
  private elementRegistry: Registry

  constructor() {
    this.elementRegistry = new Registry();
  }

  /**
   * Adds element to observe via IntersectionObserver and stores element + relevant callbacks and observer options in static
   * administrator for lookup in the future
   *
   * @method add
   * @param {HTMLElement | Window} element
   * @param {Function} enterCallback
   * @param {Function} exitCallback
   * @param {Object} options
   * @public
   */
  public observe(
    element: HTMLElement,
    enterCallback: Function,
    exitCallback: Function,
    options?: IOptions
  ): void {
    if (!element || !options) {
      return;
    }

    this.elementRegistry.addElement(element, options);

    this.setupObserver(element, enterCallback, exitCallback, options);
  }

  /**
   * Unobserve target element and remove element from static admin
   *
   * @method unobserve
   * @param {HTMLElement|Window} target
   * @param {Object} options
   * @param {String} scrollableArea
   * @public
   */
  public unobserve(
    target: HTMLElement,
    options: IOptions,
    scrollableArea: string
  ): void {
    const matchingRootEntry:
      | Root
      | undefined = this._findMatchingRootEntry(options);

    if (matchingRootEntry) {
      const { intersectionObserver } = matchingRootEntry;
      intersectionObserver.unobserve(target);
    }
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

  protected setupObserver(element: HTMLElement, enterCallback: Function, exitCallback: Function, options: IOptions): void {
    const { root = window } = options;

    // find shared root element (window or scrollable area)
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
      elements.push({ element, enterCallback, exitCallback });
      if (intersectionObserver) {
        intersectionObserver.observe(element);
      }
    } else {
      // otherwise start observing this element if applicable
      // watcher is an instance that has an observe method
      const intersectionObserver = this.newObserver(element, options);

      const observerEntry: Root = {
        elements: [{ element, enterCallback, exitCallback }],
        options,
        intersectionObserver
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
        this.elementRegistry.addElement(root, { [stringifiedOptions]: observerEntry });
      }
    }
  }

  private newObserver(
    element: HTMLElement,
    options: IOptions
  ): IntersectionObserver {
    // No matching entry for root in static admin, thus create new IntersectionObserver instance
    const { root, rootMargin, threshold } = options

    const newIO = new IntersectionObserver(
      this.setupOnIntersection(options).bind(this),
      { root, rootMargin, threshold }
    );
    newIO.observe(element);

    return newIO;
  }

  /**
   * use function composition to curry options
   *
   * @method setupOnIntersection
   * @param {Object} options
   * @param {String} scrollableArea
   */
  protected setupOnIntersection(
    options: IOptions
  ): Function {
    return (ioEntries: any) => {
      return this.onIntersection(options, ioEntries);
    };
  }

  /**
   * IntersectionObserver callback when element is intersecting viewport
   *
   * @method onIntersection
   * @param {Object} options
   * @param {String} scrollableArea
   * @param {Array} ioEntries
   * @private
   */
  private onIntersection(
    options: IOptions,
    ioEntries: Array<any>
  ): void {
    ioEntries.forEach(entry => {
      const { isIntersecting, intersectionRatio } = entry;

      // first determine if entry intersecting
      if (isIntersecting) {
        // then find entry's callback in static administration
        const matchingRootEntry:
          | Root
          | undefined = this._findMatchingRootEntry(options);

        if (matchingRootEntry) {
          matchingRootEntry.elements.some((obj: IndividualEntry) => {
            if (obj.element === entry.target) {
              // call entry's enter callback
              if (obj.enterCallback) {
                obj.enterCallback();
              }
              return true;
            }
            return false;
          });
        }
      } else if (intersectionRatio <= 0) {
        // then find entry's callback in static administration
        const matchingRootEntry:
          | Root
          | undefined = this._findMatchingRootEntry(options);

        if (matchingRootEntry) {
          matchingRootEntry.elements.some((obj: IndividualEntry) => {
            if (obj.element === entry.target) {
              // call entry's enter callback
              if (obj.exitCallback) {
                obj.exitCallback();
              }
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
  private _findMatchingRootEntry(options: IOptions): Root | undefined {
    const { root = window } = options;
    const matchingRoot: PotentialRootEntry | null | undefined = this._findRoot(root);

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
  ): Root | undefined {
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
   * @param {Object} options
   * @param {Object} comparableOptions
   * @private
   * @return {Boolean}
   */
  private _areOptionsSame(
    options: IOptions,
    comparableOptions: IOptions
  ): boolean {
    // simple comparison of string, number or even null/undefined
    const type1 = Object.prototype.toString.call(options);
    const type2 = Object.prototype.toString.call(comparableOptions);
    if (type1 !== type2) {
      return false;
    } else if (type1 !== '[object Object]' && type2 !== '[object Object]') {
      return options === comparableOptions;
    }

    // complex comparison for only type of [object Object]
    for (const key in options) {
      if (options.hasOwnProperty(key)) {
        // recursion to check nested
        if (
          this._areOptionsSame(options[key], comparableOptions[key]) === false
        ) {
          return false;
        }
      }
    }
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
    const { scrollableArea } = options;

    const replacer = (key: string, value: string): string => {
      if (key === 'root' && scrollableArea) {
        return scrollableArea;
      }
      return value;
    };

    return JSON.stringify(options, replacer);
  }
}
