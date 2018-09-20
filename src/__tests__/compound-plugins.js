/* @flow */
import tape from 'tape-cup';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {createPlugin} from '../create-plugin';
import {createToken, createArrayToken} from '../create-token';
import type {FusionPlugin, Token, ArrayToken} from '../types.js';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();
type DepsType = {
  dep: string,
};
type AType = {
  a: string,
};

const TokenA: ArrayToken<AType> = createArrayToken('TokenA');
const TokenDep1: Token<DepsType> = createToken('TokenDep1');
const TokenDep2: Token<DepsType> = createToken('TokenDep2');

tape('compound tokens support dependencies', t => {
  const app = new App('el', el => el);
  t.ok(app, 'creates an app');
  const counters = {
    deps: 0,
    a: 0,
    b: 0,
  };
  const PluginDeps: FusionPlugin<{}, DepsType> = createPlugin({
    provides: () => {
      counters.deps++;
      t.equal(counters.deps, 1, 'only instantiates once');
      return {
        dep: 'PluginDep',
      };
    },
  });

  const PluginA: FusionPlugin<void, AType> = createPlugin({
    provides: () => {
      counters.a++;
      t.equal(counters.a, 1, 'only instantiates once');
      return {
        a: 'PluginA',
      };
    },
  });

  type PluginBType = FusionPlugin<{dep: Token<DepsType>}, AType>;
  const PluginB: PluginBType = createPlugin({
    deps: {dep: TokenDep1},
    provides: deps => {
      counters.b++;
      t.equal(deps.dep.dep, 'PluginDep');
      t.equal(counters.b, 1, 'only instantiates once');
      return {
        a: 'PluginB',
      };
    },
  });

  app.register(TokenA, PluginA);
  app.register(TokenA, PluginB);
  // $FlowFixMe
  app.register(TokenA, 'value');
  app.register(TokenDep1, PluginDeps);
  app.register(
    createPlugin({
      deps: {a: TokenA},
      provides: deps => {
        t.equal(deps.a[0].a, 'PluginA');
        t.equal(deps.a[1].a, 'PluginB');
        t.equal(deps.a[2], 'value');
      },
    })
  );
  t.equal(counters.a, 0, 'does not instantiate until resolve is called');
  t.equal(counters.b, 0, 'does not instantiate until resolve is called');
  t.equal(counters.deps, 0, 'does not instantiate until resolve is called');
  app.resolve();
  t.equal(counters.a, 1, 'only instantiates once');
  t.equal(counters.b, 1, 'only instantiates once');
  t.equal(counters.deps, 1, 'only instantiates once');
  t.end();
});

tape('dependency registration with aliases', t => {
  const app = new App('el', el => el);
  t.ok(app, 'creates an app');
  const counters = {
    dep1: 0,
    dep2: 0,
    a: 0,
    b: 0,
  };
  const PluginDep1: FusionPlugin<{}, DepsType> = createPlugin({
    provides: () => {
      counters.dep1++;
      t.equal(counters.dep1, 1, 'only instantiates once');
      return {
        dep: 'PluginDep1',
      };
    },
  });
  const PluginDep2: FusionPlugin<{}, DepsType> = createPlugin({
    provides: () => {
      counters.dep2++;
      t.equal(counters.dep2, 1, 'only instantiates once');
      return {
        dep: 'PluginDep2',
      };
    },
  });

  const PluginA: FusionPlugin<{dep: Token<DepsType>}, AType> = createPlugin({
    deps: {dep: TokenDep1},
    provides: deps => {
      counters.a++;
      t.equal(deps.dep.dep, 'PluginDep2');
      t.equal(counters.a, 1, 'only instantiates once');
      return {
        a: 'PluginA',
      };
    },
  });

  type PluginBType = FusionPlugin<{dep: Token<DepsType>}, AType>;
  const PluginB: PluginBType = createPlugin({
    deps: {dep: TokenDep1},
    provides: deps => {
      counters.b++;
      t.equal(deps.dep.dep, 'PluginDep2');
      t.equal(counters.b, 1, 'only instantiates once');
      return {
        a: 'PluginB',
      };
    },
  });

  app.register(TokenA, PluginA);
  app.register(TokenA, PluginB).alias(TokenDep1, TokenDep2);
  app.register(TokenDep1, PluginDep1);
  app.register(TokenDep2, PluginDep2);
  app.register(
    createPlugin({
      deps: {a: TokenA},
      provides: deps => {
        t.equal(deps.a[0].a, 'PluginA');
        t.equal(deps.a[1].a, 'PluginB');
      },
    })
  );
  t.equal(counters.a, 0, 'does not instantiate until resolve is called');
  t.equal(counters.b, 0, 'does not instantiate until resolve is called');
  t.equal(counters.dep1, 0, 'does not instantiate until resolve is called');
  t.equal(counters.dep2, 0, 'does not instantiate until resolve is called');
  app.resolve();
  t.equal(counters.a, 1, 'only instantiates once');
  t.equal(counters.b, 1, 'only instantiates once');
  t.equal(counters.dep1, 1, 'only instantiates once');
  t.equal(counters.dep2, 1, 'only instantiates once');
  t.end();
});
