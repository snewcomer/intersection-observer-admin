import IntersectionObserverAdmin from '../src/index';

describe('add entry', () => {
  it('no options', () => {
    const el = document.createElement('div');
    const ioAdmin = new IntersectionObserverAdmin();
    const noop = () => 'hi';
    ioAdmin.observe(el, noop, noop);
  });
});
