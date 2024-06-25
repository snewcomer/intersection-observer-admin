import IntersectionObserverAdmin from '../src/index';

class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];

  disconnect() {
    return null;
  }

  observe() {
    return null;
  }

  takeRecords() {
    return [];
  }

  unobserve() {
    return null;
  }
}

describe('add entry', () => {
  it('observe exists', () => {
    const el = document.createElement('div');
    const ioAdmin = new IntersectionObserverAdmin();
    expect(ioAdmin.observe).toBeDefined();
    expect(ioAdmin.unobserve).toBeDefined();
  });

  it('callbacks', () => {
    const el = document.createElement('div');
    const ioAdmin = new IntersectionObserverAdmin();
    expect(ioAdmin.addEnterCallback).toBeDefined();
    expect(ioAdmin.addExitCallback).toBeDefined();
    expect(ioAdmin.dispatchEnterCallback).toBeDefined();
    expect(ioAdmin.dispatchExitCallback).toBeDefined();
  });
});

describe('elements', () => {
  beforeEach(() => {
    globalThis.IntersectionObserver = IntersectionObserver;
  });

  it('observe', () => {
    const el_1 = document.createElement('div');
    const el_2 = document.createElement('div');
    const el_3 = document.createElement('div');
    const ioAdmin = new IntersectionObserverAdmin();

    ioAdmin.observe(el_1);
    ioAdmin.observe(el_2);
    ioAdmin.observe(el_3);

    expect(ioAdmin.elementExists(el_1)).toBeTruthy();
    expect(ioAdmin.elementExists(el_2)).toBeTruthy();
    expect(ioAdmin.elementExists(el_3)).toBeTruthy();
  });

  it('unobserve', () => {
    const el_1 = document.createElement('div');
    const el_2 = document.createElement('div');
    const el_3 = document.createElement('div');
    const ioAdmin = new IntersectionObserverAdmin();

    ioAdmin.observe(el_1);
    ioAdmin.observe(el_2);
    ioAdmin.observe(el_3);

    ioAdmin.unobserve(el_1, {});
    ioAdmin.unobserve(el_3, {});

    expect(ioAdmin.elementExists(el_1)).toBeFalsy();
    expect(ioAdmin.elementExists(el_2)).toBeTruthy();
    expect(ioAdmin.elementExists(el_3)).toBeFalsy();
  });
});
