intersection-observer-admin
==============================================================================
![Download count all time](https://img.shields.io/npm/dt/intersection-observer-admin.svg)
[![npm version](https://badge.fury.io/js/intersection-observer-admin.svg)](http://badge.fury.io/js/intersection-observer-admin)

[![Dependency Status](https://david-dm.org/snewcomer/intersection-observer-admin.svg)](https://david-dm.org/snewcomer/intersection-observer-admin)
[![devDependency Status](https://david-dm.org/snewcomer/intersection-observer-admin/dev-status.svg)](https://david-dm.org/snewcomer/intersection-observer-admin#info=devDependencies)

Why use this?
------------------------------------------------------------------------------
This library is used in [ember-in-viewport](https://github.com/DockYard/ember-in-viewport).  This library is particularly important for re-using the IntersectionObserver API.  [IntersectionObserver.observer](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/observe) can observer multiple elements.  So this library will resuse the IntersectionObserver instance for another element on the page with the same set of observer options and root element.

Installation
------------------------------------------------------------------------------

```
npm install intersection-observer-admin --save
```

Usage
------------------------------------------------------------------------------
### API

1. element: DOM Node to observe
2. enterCallback: Function
  - callback function to perform logic in your own application
3. exitCallback: Function
  - callback function to perform when element is leaving the viewport
4. scrollableArea: String
  - used for determining if element should use existing or new IntersectionObserver

```js
import intersectionObserverAdmin from 'intersection-observer-admin';

intersectionObserverAdmin.add(element, enterCallback, exitCallback, { root, rootMargin: '0px 0px 100px 0px', threshold: 0 });

intersectionObserverAdmin.add(element, enterCallback, exitCallback, { root, rootMargin: '0px 0px 100px 0px', threshold: 0 }, '.my-list');

// Use in cleanup lifecycle hooks (if applicable) from the element being observed
intersectionObserverAdmin.unobserve(element, observerOptions, scrollableArea);

// Use in cleanup lifecycle hooks of your application as a whole
// This will remove the in memory data store holding onto all of the observers
intersectionObserverAdmin.destroy();
```

Options passed to `add` are the same options available to the Instersection Observer [API](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/IntersectionObserver)
