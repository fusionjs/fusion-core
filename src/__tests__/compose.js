import test from '../test-helper';
import {compose} from '../compose';
import {withMiddleware} from '../with-middleware';

test('composed middleware are executed correctly', t => {
  function A(ctx, next) {
    return next();
  }
  const p = withMiddleware(A);
  const middleware = compose([p]);
  const next = () => Promise.resolve();
  t.doesNotThrow(() => middleware({}, next), 'works with valid args');
  t.doesNotThrow(() => middleware(void 0, next), 'works with missing ctx');
  t.doesNotThrow(() => middleware(), 'works with missing next');
  t.end();
});

test('downstream and upstream run in same order as koa', t => {
  t.plan(6);
  function a(ctx, next) {
    t.equals(++ctx.number, 1, 'A downstream is called correctly');
    return next().then(() => {
      t.equals(++ctx.number, 6, 'A upstream is called correctly');
    });
  }
  const pa = withMiddleware(a);
  const pb = withMiddleware((ctx, next) => {
    t.equals(++ctx.number, 2, 'B downstream is called correctly');
    return next().then(() => {
      t.equals(++ctx.number, 5, 'B upstream is called correctly');
    });
  });
  // the middleware function is optional
  class C {}
  const pc = () => new C();
  function d(ctx, next) {
    t.equals(++ctx.number, 3, 'D downstream is called correctly');
    return next().then(() => {
      t.equals(++ctx.number, 4, 'D upstream is called correctly');
    });
  }
  const pd = withMiddleware(d);
  const middleware = compose([pa, pb, pc, pd]);
  const ctx = {number: 0};
  const next = () => Promise.resolve();
  middleware(ctx, next).then(t.end);
});

test('can compose empty plugin', t => {
  const middleware = compose([null, void 0]);
  const next = () => Promise.resolve();
  t.doesNotThrow(() => middleware({}, next), 'works with valid args');
  t.doesNotThrow(() => middleware(void 0, next), 'works with missing ctx');
  t.doesNotThrow(() => middleware(), 'works with missing next');
  t.end();
});
