/* @flow */
import test, {run} from './test-helper';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {withMiddleware} from '../with-middleware';
import {withDependencies} from '../with-dependencies';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();
type AType = {
  a: string,
};
type BType = () => {
  b: string,
};
const TokenA: AType = (() => 'TokenA': any);
const TokenB: BType = (() => 'TokenB': any);

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

test('app.register - middleware execution respects registration order', async t => {
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
  let order = 0;
  app.register(
    withMiddleware(async (ctx, next) => {
      t.equal(order, 0, 'calls downstream in correct order');
      order++;
      t.equal(ctx.element, element);
      t.equal(numRenders, 0);
      t.notok(ctx.rendered);
      await next();
      t.equal(order, 3, 'calls upstream in correct order');
      t.equal(numRenders, 1);
      t.equal(ctx.rendered, element);
      order++;
    })
  );
  app.register(
    withMiddleware(async (ctx, next) => {
      t.equal(order, 1, 'calls downstream in correct order');
      order++;
      t.equal(ctx.element, element);
      t.equal(numRenders, 0);
      t.notok(ctx.rendered);
      await next();
      t.equal(order, 2, 'calls upstream in correct order');
      order++;
      t.equal(numRenders, 1);
      t.equal(ctx.rendered, element);
    })
  );
  const ctx = await run(app);
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render');
  t.equal(order, 4, 'calls middleware in correct order');
  t.end();
});

test('app.register - middleware execution respects dependency order', async t => {
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
  let order = 0;
  app.register(
    withMiddleware(async function first(ctx, next) {
      t.equal(order, 0, 'calls downstream in correct order');
      t.equal(numRenders, 0);
      order++;
      await next();
      t.equal(order, 7, 'calls upstream in correct order');
      t.equal(numRenders, 1);
      order++;
    })
  );
  app.register(
    TokenA,
    withDependencies({TokenB})(deps => {
      t.equal(deps.TokenB().b, 'something-b');
      return withMiddleware({a: 'something'}, async function second(ctx, next) {
        t.equal(order, 2, 'calls downstream in correct order');
        t.equal(numRenders, 0);
        order++;
        await next();
        t.equal(order, 5, 'calls upstream in correct order');
        t.equal(numRenders, 1);
        order++;
      });
    })
  );
  app.register(
    withMiddleware(async function third(ctx, next) {
      t.equal(order, 3, 'calls downstream in correct order');
      t.equal(numRenders, 0);
      order++;
      await next();
      t.equal(order, 4, 'calls upstream in correct order');
      t.equal(numRenders, 1);
      order++;
    })
  );
  app.register(
    TokenB,
    withMiddleware(() => ({b: 'something-b'}), async function fourth(
      ctx,
      next
    ) {
      t.equal(order, 1, 'calls downstream in correct order');
      t.equal(numRenders, 0);
      order++;
      await next();
      t.equal(order, 6, 'calls upstream in correct order');
      t.equal(numRenders, 1);
      order++;
    })
  );
  const ctx = await run(app);
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render');
  t.equal(order, 8, 'calls middleware in correct order');
  t.end();
});

test('app.middleware with dependencies', async t => {
  const TokenA = 'TokenA';
  const element = 'hi';
  const renderFn = el => {
    return el;
  };
  const app = new App(element, renderFn);
  let called = false;
  app.register(TokenA, () => 'Something');
  app.middleware({TokenA}, deps => {
    t.equal(deps.TokenA, 'Something');
    return (ctx, next) => {
      called = true;
      return next();
    };
  });
  await run(app);
  t.ok(called, 'calls middleware');
  t.end();
});

test('app.middleware with no dependencies', async t => {
  const element = 'hi';
  const renderFn = el => {
    return el;
  };
  const app = new App(element, renderFn);
  let called = false;
  app.middleware((ctx, next) => {
    called = true;
    return next();
  });
  await run(app);
  t.ok(called, 'calls middleware');
  t.end();
});
