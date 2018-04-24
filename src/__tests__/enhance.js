/* @flow */

import tape from 'tape-cup';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {createPlugin} from '../create-plugin';
import {createToken} from '../create-token';
import type {FusionPlugin, Token} from '../types.js';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();

tape('enhancement', t => {
  const app = new App('el', el => el);

  type FnType = string => string;
  const FnToken: Token<FnType> = createToken('FnType');
  const BaseFn: FusionPlugin<void, FnType> = createPlugin({
    provides: () => {
      return arg => arg;
    },
  });
  const BaseFnEnhancer = (fn: FnType): FnType => {
    return arg => {
      return fn(arg) + ' enhanced';
    };
  };
  app.register(FnToken, BaseFn);
  app.enhance(FnToken, BaseFnEnhancer);
  app.middleware({fn: FnToken}, ({fn}) => {
    t.equal(fn('hello'), 'hello enhanced');
    t.end();
    return (ctx, next) => next();
  });
  app.resolve();
});

tape('enhancement with a plugin', t => {
  const app = new App('el', el => el);

  type FnType = string => string;
  const FnToken: Token<FnType> = createToken('FnType');
  const BaseFn: FusionPlugin<void, FnType> = createPlugin({
    provides: () => {
      return arg => arg;
    },
  });
  const BaseFnEnhancer = (fn: FnType): FusionPlugin<void, FnType> => {
    return createPlugin({
      provides: () => {
        return arg => {
          return fn(arg) + ' enhanced';
        };
      },
    });
  };
  app.register(FnToken, BaseFn);
  app.enhance(FnToken, BaseFnEnhancer);
  app.middleware({fn: FnToken}, ({fn}) => {
    t.equal(fn('hello'), 'hello enhanced');
    t.end();
    return (ctx, next) => next();
  });
  app.resolve();
});

tape('enhancement with a plugin with deps', t => {
  const app = new App('el', el => el);

  const DepAToken: Token<string> = createToken('DepA');
  const DepBToken: Token<string> = createToken('DepB');

  const DepA = 'test-dep-a';
  const DepB: FusionPlugin<{a: Token<string>}, string> = createPlugin({
    deps: {
      a: DepAToken,
    },
    provides: ({a}) => {
      t.equal(a, DepA);
      return 'test-dep-b';
    },
  });

  type FnType = string => string;
  const FnToken: Token<FnType> = createToken('FnType');
  const BaseFn: FusionPlugin<void, FnType> = createPlugin({
    provides: () => {
      return arg => arg;
    },
  });
  const BaseFnEnhancer = (
    fn: FnType
  ): FusionPlugin<{a: Token<string>, b: Token<string>}, FnType> => {
    return createPlugin({
      deps: {
        a: DepAToken,
        b: DepBToken,
      },
      provides: ({a, b}) => {
        t.equal(a, 'test-dep-a');
        t.equal(b, 'test-dep-b');
        return arg => {
          return fn(arg) + ' enhanced';
        };
      },
    });
  };
  app.register(DepAToken, DepA);
  app.register(DepBToken, DepB);
  app.register(FnToken, BaseFn);
  app.enhance(FnToken, BaseFnEnhancer);
  app.middleware({fn: FnToken}, ({fn}) => {
    t.equal(fn('hello'), 'hello enhanced');
    t.end();
    return (ctx, next) => next();
  });
  app.resolve();
});

tape('enhancement with a plugin with missing deps', t => {
  const app = new App('el', el => el);

  const DepAToken: Token<string> = createToken('DepA');
  const DepBToken: Token<string> = createToken('DepB');

  const DepB = 'test-dep-b';

  type FnType = string => string;
  const FnToken: Token<FnType> = createToken('FnType');
  const BaseFn: FusionPlugin<void, FnType> = createPlugin({
    provides: () => {
      return arg => arg;
    },
  });
  const BaseFnEnhancer = (
    fn: FnType
  ): FusionPlugin<{a: Token<string>, b: Token<string>}, FnType> => {
    return createPlugin({
      deps: {
        a: DepAToken,
        b: DepBToken,
      },
      provides: () => {
        t.fail('should not get here');
        return arg => {
          return fn(arg) + ' enhanced';
        };
      },
    });
  };
  app.register(DepBToken, DepB);
  app.register(FnToken, BaseFn);
  app.enhance(FnToken, BaseFnEnhancer);
  app.middleware({fn: FnToken}, ({fn}) => {
    t.equal(fn('hello'), 'hello enhanced');
    t.end();
    return (ctx, next) => next();
  });
  t.throws(
    () => app.resolve(),
    /Could not resolve token: "DepA", which is required by plugins registered with tokens: "EnhancerOf<FnType>"./
  );
  t.end();
});
