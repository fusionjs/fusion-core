import test from 'tape-cup';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {compose} from '../compose';
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

test('timing plugin', async t => {
  const element = 'hi';
  const renderFn = el => {
    return el;
  };
  const app = new App(element, renderFn);
  const ctx = await run(app);
  t.equal(typeof ctx.timing.start, 'number', 'sets up ctx.timing.start');
  t.ok(
    ctx.timing.end instanceof Promise,
    'sets up ctx.timing.end to be a promise'
  );
  ctx.timing.downstream.then(result => {
    t.equal(typeof result, 'number', 'sets downstream timing result');
  });
  ctx.timing.render.then(result => {
    t.equal(typeof result, 'number', 'sets render timing result');
  });
  ctx.timing.upstream.then(result => {
    t.equal(typeof result, 'number', 'sets upstream timing result');
  });
  ctx.timing.end.then(result => {
    t.equal(typeof result, 'number', 'sets end timing result');
    t.end();
  });
});
