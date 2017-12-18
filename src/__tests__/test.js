import tape from 'tape-cup';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {withDependencies} from '../plugin/with-dependencies';
import {withMiddleware} from '../plugin/with-middleware';
import {Plugin} from '../index';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();

const TokenA = 'TokenA';
const TokenB = 'TokenB';
const TokenC = 'TokenC';
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

tape.only('testing new register', t => {
  const app = new App('el', el => el);
  t.ok(app, 'creates an app');
  app._register(PluginA, TokenA);
  app._register(PluginB, TokenB);
  app._register(PluginC, TokenC);
  app._register(
    withDependencies({a: TokenA, b: TokenB, c: TokenC})(deps => {
      t.deepLooseEqual(
        deps.a,
        deps.b.deps.a,
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
