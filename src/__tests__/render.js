import test from '../test-helper';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {compose} from '../compose';
import {withMiddleware} from '../with-middleware';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();

function getContext() {
  return __BROWSER__
    ? {}
    : {
        path: '/',
        headers: {
          accept: 'text/html',
        },
      };
}

function run(app) {
  const ctx = getContext();
  app.resolve();
  return compose(app.plugins)(ctx, () => Promise.resolve()).then(() => ctx);
}

function delay() {
  return new Promise(resolve => {
    setTimeout(resolve, 1);
  });
}

test('async render', async t => {
  let numRenders = 0;
  const element = 'hi';
  const renderFn = el => {
    t.equals(el, element, 'render receives correct args');
    return delay().then(() => {
      numRenders++;
      return el;
    });
  };
  const app = new App(element, renderFn);
  const ctx = await run(app);
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render once');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});

test('sync render', async t => {
  let numRenders = 0;
  const element = 'hi';
  const renderFn = el => {
    numRenders++;
    t.equals(el, element, 'render receives correct args');
    return el;
  };
  const app = new App(element, renderFn);
  const ctx = await run(app);
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render once');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});

test('app.register - async render with async middleware', async t => {
  let numRenders = 0;
  const element = 'hi';
  const renderFn = el => {
    t.equals(el, element, 'render receives correct args');
    return delay().then(() => {
      numRenders++;
      return el;
    });
  };
  const app = new App(element, renderFn);
  app.register(
    withMiddleware(async (ctx, next) => {
      t.equal(ctx.element, element);
      t.equal(numRenders, 0);
      t.notok(ctx.rendered);
      await next();
      t.equal(numRenders, 1);
      t.equal(ctx.rendered, element);
    })
  );
  const ctx = await run(app);
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});
