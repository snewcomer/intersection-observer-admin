import IntersectionObserverAdmin from '../src/index';

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
