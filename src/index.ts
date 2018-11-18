export class IntersectionObserverAdmin {
  constructor() {
    this._DOMRef = new WeakMap();
  }

  /**
   * Adds element to observe via IntersectionObserver and stores element + relevant callbacks and observer options in static
   * administrator for lookup in the future
   *
   * @method add
   * @param {Node} element
   * @param {Function} enterCallback
   * @param {Function} exitCallback
   * @param {Object} observerOptions
   * @param {String} [scrollableArea]
   * @public
   */
  add(element, enterCallback, exitCallback, observerOptions, scrollableArea) {
  }

  /**
   * Unobserve target element and remove element from static admin
   *
   * @method unobserve
   * @param {Node|window} target
   * @param {Object} observerOptions
   * @param {String} scrollableArea
   * @public
   */
  unobserve(target, observerOptions, scrollableArea) {
  }

  destroy() {
    this._DOMRef = null;
  }
}
