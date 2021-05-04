intersection-observer-admin
==============================================================================
![Download count all time](https://img.shields.io/npm/dt/intersection-observer-admin.svg)
[![npm version](https://badge.fury.io/js/intersection-observer-admin.svg)](http://badge.fury.io/js/intersection-observer-admin)

Why use an administrator to manage all the elements on my page?
------------------------------------------------------------------------------
This library is used in [ember-in-viewport](https://github.com/DockYard/ember-in-viewport) and [ember-infinity](https://github.com/ember-infinity/ember-infinity).  This library is particularly important for re-using the IntersectionObserver API.

Most implementations have one Intersection Observer for each target element or so called `sentinel`.  However, [IntersectionObserver.observe](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/observe) can observer multiple `sentinels`.  So this library will resuse the IntersectionObserver instance for another element on the page with the same set of observer options and root element.  This can dramatically improve performance for pages with lots of elements and observers.

_Note: A companion library is also available for requestAnimationFrame: https://github.com/snewcomer/raf-pool_

Installation
------------------------------------------------------------------------------

```
npm install intersection-observer-admin --save
```

Usage
------------------------------------------------------------------------------
## API

1. element: DOM Node to observe
2. enterCallback: Function
    - callback function to perform logic in your own application
3. exitCallback: Function
    - callback function to perform when element is leaving the viewport
4. observerOptions: Object
    - list of options to pass to Intersection Observer constructor (https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/IntersectionObserver)

```js
import IntersectionObserverAdmin from 'intersection-observer-admin';

const intersectionObserverAdmin = new IntersectionObserverAdmin();

// Add callbacks that will be called when observer detects entering and leaving viewport
intersectionObserverAdmin.addEnterCallback(element, enterCallback);
intersectionObserverAdmin.addExitCallback(element, exitCallback);

// add an element to static administrator with window as scrollable area
intersectionObserverAdmin.observe(element, { root, rootMargin: '0px 0px 100px 0px', threshold: 0 });

// add an element in a scrolling container
intersectionObserverAdmin.observe(element, { root, rootMargin: '0px 0px 100px 0px', threshold: 0 });

// Use in cleanup lifecycle hooks (if applicable) from the element being observed
intersectionObserverAdmin.unobserve(element, observerOptions);

// Use in cleanup lifecycle hooks of your application as a whole
// This will remove the in memory data store holding onto all of the observers
intersectionObserverAdmin.destroy();
```

[IntersectionObserver's Browser Support](https://platform-status.mozilla.org/)
------------------------------------------------------------------------------
### Out of the box

<table>
    <tr>
        <td>Chrome</td>
        <td>51 <sup>[1]</sup></td>
    </tr>
    <tr>
        <td>Firefox (Gecko)</td>
        <td>55 <sup>[2]</sup></td>
    </tr>
    <tr>
        <td>MS Edge</td>
        <td>15</td>
    </tr>
    <tr>
        <td>Internet Explorer</td>
        <td>Not supported</td>
    </tr>
    <tr>
        <td>Opera <sup>[1]</sup></td>
        <td>38</td>
    </tr>
    <tr>
        <td>Safari</td>
        <td>12.1</td>
    </tr>
    <tr>
        <td>Chrome for Android</td>
        <td>59</td>
    </tr>
    <tr>
        <td>Android Browser</td>
        <td>56</td>
    </tr>
    <tr>
        <td>Opera Mobile</td>
        <td>37</td>
    </tr>
</table>

* [1] [Reportedly available](https://www.chromestatus.com/features/5695342691483648), it didn't trigger the events on initial load and lacks `isIntersecting` until later versions.
* [2] This feature was implemented in Gecko 53.0 (Firefox 53.0 / Thunderbird 53.0 / SeaMonkey 2.50) behind the preference `dom.IntersectionObserver.enabled`.
