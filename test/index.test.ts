import IntersectionObserverAdmin from '../src/index';

class IntersectionObserver {
  public root = null;
  public rootMargin = '';
  public thresholds = [];

  public disconnect() {
    return null;
  }

  public observe() {
    return null;
  }

  public takeRecords() {
    return [];
  }

  public unobserve() {
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
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    const el3 = document.createElement('div');
    const ioAdmin = new IntersectionObserverAdmin();

    ioAdmin.observe(el1);
    ioAdmin.observe(el2);
    ioAdmin.observe(el3);

    expect(ioAdmin.elementExists(el1)).toBeTruthy();
    expect(ioAdmin.elementExists(el2)).toBeTruthy();
    expect(ioAdmin.elementExists(el3)).toBeTruthy();
  });

  it('unobserve', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    const el3 = document.createElement('div');
    const ioAdmin = new IntersectionObserverAdmin();

    ioAdmin.observe(el1);
    ioAdmin.observe(el2);
    ioAdmin.observe(el3);

    ioAdmin.unobserve(el1, {});
    ioAdmin.unobserve(el3, {});

    expect(ioAdmin.elementExists(el1)).toBeFalsy();
    expect(ioAdmin.elementExists(el2)).toBeTruthy();
    expect(ioAdmin.elementExists(el3)).toBeFalsy();
  });
});
