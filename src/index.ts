type IndividualEntry = {
  element?: HTMLElement | Window;
  enterCallback?: Function;
  exitCallback?: Function;
};

export interface IObserverOption {
  root?: HTMLElement;
  rootMargin?: string;
  threshold?: number;
  [key: string]: any;
}

type RootEntry = {
  elements: [IndividualEntry];
  observerOptions: IObserverOption;
  intersectionObserver: any;
};

type PotentialRootEntry = {
  [stringifiedOptions: string]: RootEntry;
};

export default class IntersectionObserverAdmin {
  private DOMRef: WeakMap<HTMLElement | Window, PotentialRootEntry> | null;

  constructor() {
    this.DOMRef = new WeakMap();
  }

  /**
   * Adds element to observe via IntersectionObserver and stores element + relevant callbacks and observer options in static
   * administrator for lookup in the future
   *
   * @method add
   * @param {HTMLElement | Window} element
   * @param {Function} enterCallback
   * @param {Function} exitCallback
   * @param {Object} observerOptions
   * @param {String} scrollableArea
   * @public
   */
  public add(
    element: HTMLElement,
    enterCallback: Function,
    exitCallback: Function,
    observerOptions?: IObserverOption,
    scrollableArea?: string
  ): void {
    if (!element || !observerOptions) {
      return;
    }
    const { root = window } = observerOptions;

    // first find shared root element (window or scrollable area)
    const potentialRootMatch:
      | PotentialRootEntry
      | null
      | undefined = this._findRoot(root);
    // second if there is a matching root, find an entry with the same observerOptions
    let matchingEntryForRoot;
    if (potentialRootMatch) {
      matchingEntryForRoot = this._determineMatchingElements(
        observerOptions,
        potentialRootMatch
      );
    }

    if (matchingEntryForRoot) {
      const { elements, intersectionObserver } = matchingEntryForRoot;
      elements.push({ element, enterCallback, exitCallback });
      intersectionObserver.observe(element);
      return;
    }

    // No matching entry for root in static admin, thus create new IntersectionObserver instance
    const newIO = new IntersectionObserver(
      this._setupOnIntersection(observerOptions, scrollableArea).bind(this),
      observerOptions
    );
    newIO.observe(element);

    const observerEntry: RootEntry = {
      elements: [{ element, enterCallback, exitCallback }],
      intersectionObserver: newIO,
      observerOptions
    };

    const stringifiedOptions: string = this._stringifyObserverOptions(
      observerOptions,
      scrollableArea
    );
    if (potentialRootMatch) {
      // if share same root and need to add new entry to root match
      potentialRootMatch[stringifiedOptions] = observerEntry;
    } else {
      // no root exists, so add to WeakMap
      if (this.DOMRef) {
        this.DOMRef.set(root, { [stringifiedOptions]: observerEntry });
      }
    }
  }

  /**
   * Unobserve target element and remove element from static admin
   *
   * @method unobserve
   * @param {HTMLElement|Window} target
   * @param {Object} observerOptions
   * @param {String} scrollableArea
   * @public
   */
  public unobserve(
    target: HTMLElement,
    observerOptions: IObserverOption,
    scrollableArea: string
  ): void {
    const matchingRootEntry:
      | RootEntry
      | undefined = this._findMatchingRootEntry(
      observerOptions,
      scrollableArea
    );

    if (matchingRootEntry) {
      const { intersectionObserver, elements } = matchingRootEntry;
      intersectionObserver.unobserve(target);

      // important to do this in reverse order
      for (let i = elements.length - 1; i >= 0; i--) {
        if (elements[i] && elements[i].element === target) {
          elements.splice(i, 1);
          break;
        }
      }
    }
  }

  /**
   * cleanup data structures and unobserve elements
   *
   * @method destroy
   * @public
   */
  public destroy(): void {
    this.DOMRef = null;
  }

  /**
   * use function composition to curry observerOptions
   *
   * @method _setupOnIntersection
   * @param {Object} observerOptions
   * @param {String} scrollableArea
   */
  protected _setupOnIntersection(
    observerOptions: IObserverOption,
    scrollableArea: string | undefined
  ): Function {
    return (entries: any) => {
      return this._onIntersection(observerOptions, scrollableArea, entries);
    };
  }

  /**
   * IntersectionObserver callback when element is intersecting viewport
   *
   * @method _onIntersection
   * @param {Object} observerOptions
   * @param {String} scrollableArea
   * @param {Array} ioEntries
   * @private
   */
  protected _onIntersection(
    observerOptions: IObserverOption,
    scrollableArea: string | undefined,
    ioEntries: Array<any>
  ): void {
    ioEntries.forEach(entry => {
      const { isIntersecting, intersectionRatio } = entry;

      // first determine if entry intersecting
      if (isIntersecting) {
        // then find entry's callback in static administration
        const matchingRootEntry:
          | RootEntry
          | undefined = this._findMatchingRootEntry(
          observerOptions,
          scrollableArea
        );

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
          | RootEntry
          | undefined = this._findMatchingRootEntry(
          observerOptions,
          scrollableArea
        );

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
   * { root: { stringifiedOptions: { elements: []...] } }
   * @method _findRoot
   * @param {HTMLElement|Window} root
   * @private
   * @return {Object} of elements that share same root
   */
  protected _findRoot(
    root: HTMLElement | Window
  ): PotentialRootEntry | null | undefined {
    return this.DOMRef && this.DOMRef.get(root);
  }

  /**
   * Used for onIntersection callbacks and unobserving the IntersectionObserver
   * We don't care about observerOptions key order because we already added
   * to the static administrator or found an existing IntersectionObserver with the same
   * root && observerOptions to reuse
   *
   * @method _findMatchingRootEntry
   * @param {Object} observerOptions
   * @param {String} scrollableArea
   * @return {Object} entry with elements and other options
   */
  protected _findMatchingRootEntry(
    observerOptions: IObserverOption,
    scrollableArea: string | undefined
  ): RootEntry | undefined {
    const { root = window } = observerOptions;
    const matchingRoot: PotentialRootEntry | null | undefined = this._findRoot(
      root
    );
    if (matchingRoot) {
      const stringifiedOptions: string = this._stringifyObserverOptions(
        observerOptions,
        scrollableArea
      );
      return matchingRoot[stringifiedOptions];
    }
  }

  /**
   * Determine if existing elements for a given root based on passed in observerOptions
   * regardless of sort order of keys
   *
   * @method _determineMatchingElements
   * @param {Object} observerOptions
   * @param {Object} potentialRootMatch e.g. { stringifiedOptions: { elements: [], ... }, stringifiedOptions: { elements: [], ... }}
   * @private
   * @return {Object} containing array of elements and other meta
   */
  protected _determineMatchingElements(
    observerOptions: IObserverOption,
    potentialRootMatch?: PotentialRootEntry
  ): RootEntry | undefined {
    if (!potentialRootMatch) {
      return;
    }
    const matchingKey = Object.keys(potentialRootMatch).filter(key => {
      const { observerOptions: comparableOptions } = potentialRootMatch[key];
      return this._areOptionsSame(observerOptions, comparableOptions);
    })[0];

    return potentialRootMatch[matchingKey];
  }

  /**
   * recursive method to test primitive string, number, null, etc and complex
   * object equality.
   *
   * @method _areOptionsSame
   * @param {Object} observerOptions
   * @param {Object} comparableOptions
   * @private
   * @return {Boolean}
   */
  protected _areOptionsSame(
    observerOptions: IObserverOption,
    comparableOptions: IObserverOption
  ): boolean {
    // simple comparison of string, number or even null/undefined
    const type1 = Object.prototype.toString.call(observerOptions);
    const type2 = Object.prototype.toString.call(comparableOptions);
    if (type1 !== type2) {
      return false;
    } else if (type1 !== '[object Object]' && type2 !== '[object Object]') {
      return observerOptions === comparableOptions;
    }

    // complex comparison for only type of [object Object]
    for (const key in observerOptions) {
      if (observerOptions.hasOwnProperty(key)) {
        // recursion to check nested
        if (
          this._areOptionsSame(observerOptions[key], comparableOptions[key]) ===
          false
        ) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Stringify observerOptions for use as a key.
   * Excludes observerOptions.root so that the resulting key is stable
   *
   * @param {Object} observerOptions
   * @param {String} scrollableArea
   * @private
   * @return {String}
   */
  protected _stringifyObserverOptions(
    observerOptions: IObserverOption,
    scrollableArea: string | undefined
  ): string {
    const replacer = (key: string, value: string): string => {
      if (key === 'root' && scrollableArea) {
        return scrollableArea;
      }
      return value;
    };

    return JSON.stringify(observerOptions, replacer);
  }
}
