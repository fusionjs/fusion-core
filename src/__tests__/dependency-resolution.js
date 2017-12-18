import tape from 'tape-cup';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {withDependencies} from '../with-dependencies';
import {withMiddleware} from '../with-middleware';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();

const TokenA = 'TokenA';
const TokenB = 'TokenB';
const TokenC = 'TokenC';

tape('dependency registration', t => {
  const app = new App('el', el => el);
  t.ok(app, 'creates an app');

  const PluginA = deps => {
    return {
      deps,
      name: 'PluginA',
    };
  };
  const PluginB = withDependencies({a: TokenA})(deps => {
    return {
      deps,
      name: 'PluginB',
    };
  });
  const PluginC = withDependencies({a: TokenA, b: TokenB})(deps => {
    return {
      deps,
      name: 'PluginC',
    };
  });

  app.register(PluginA, TokenA);
  app.register(PluginB, TokenB);
  app.register(PluginC, TokenC);
  app.register(
    withDependencies({a: TokenA, b: TokenB, c: TokenC})(deps => {
      t.deepLooseEqual(
        deps.a,
        deps.b.deps.a,
        'only instantiates dependencies once'
      );
      t.deepLooseEqual(
        deps.a,
        deps.c.deps.a,
        'only instantiates dependencies once'
      );
      t.deepLooseEqual(
        deps.b,
        deps.c.deps.b,
        'only instantiates dependencies once'
      );
      t.deepLooseEqual(
        deps.b.name,
        'PluginB',
        'passes dependencies through correctly'
      );
      t.deepLooseEqual(
        deps.a.name,
        'PluginA',
        'passes dependencies through correctly'
      );
      t.deepLooseEqual(
        deps.c.name,
        'PluginC',
        'passes dependencies through correctly'
      );
      return {};
    })
  );
  app.resolve();
  t.end();
});

tape('dependency registration with middleware', t => {
  const app = new App('el', el => el);
  t.ok(app, 'creates an app');
  const PluginA = deps => {
    return withMiddleware((ctx, next) => next(), {
      deps,
      name: 'PluginA',
    });
  };
  const PluginB = withDependencies({a: TokenA})(deps => {
    return {
      deps,
      name: 'PluginB',
    };
  });
  const PluginC = withDependencies({a: TokenA, b: TokenB})(deps => {
    return withMiddleware((ctx, next) => next(), {
      deps,
      name: 'PluginC',
    });
  });
  app.register(PluginA, TokenA);
  app.register(PluginB, TokenB);
  app.register(PluginC, TokenC);
  app.register(
    withDependencies({a: TokenA, b: TokenB, c: TokenC})(deps => {
      t.deepLooseEqual(
        deps.a,
        deps.b.deps.a,
        'only instantiates dependencies once'
      );
      t.deepLooseEqual(
        deps.a,
        deps.c.deps.a,
        'only instantiates dependencies once'
      );
      t.deepLooseEqual(
        deps.b,
        deps.c.deps.b,
        'only instantiates dependencies once'
      );
      t.deepLooseEqual(
        deps.b.name,
        'PluginB',
        'passes dependencies through correctly'
      );
      t.deepLooseEqual(
        deps.a.name,
        'PluginA',
        'passes dependencies through correctly'
      );
      t.deepLooseEqual(
        deps.c.name,
        'PluginC',
        'passes dependencies through correctly'
      );
      return withMiddleware((ctx, next) => next());
    })
  );
  app.resolve();
  t.end();
});
