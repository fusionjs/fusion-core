/* @flow */
import tape from 'tape-cup';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {withDependencies} from '../with-dependencies';
import {withMiddleware} from '../with-middleware';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();
type AType = {
  a: string,
};
type BType = {
  b: string,
};
type CType = {
  c: string,
};
const TokenA: AType = ('TokenA': any);
const TokenB: BType = ('TokenB': any);
const TokenC: CType = ('TokenC': any);

tape('dependency registration', t => {
  const app = new App('el', el => el);
  t.ok(app, 'creates an app');
  const counters = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  };

  const PluginA: PluginType<void, AType> = () => {
    counters.a++;
    t.equal(counters.a, 1, 'only instantiates once');
    return {
      a: 'PluginA',
    };
  };
  const PluginB: PluginType<{a: AType}, BType> = withDependencies({a: TokenA})(
    deps => {
      counters.b++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(counters.b, 1, 'only instantiates once');
      return {
        b: 'PluginB',
      };
    }
  );

  type PluginCType = PluginType<{a: AType, b: BType}, CType>;
  const PluginC: PluginCType = withDependencies({
    a: TokenA,
    b: TokenB,
  })(deps => {
    counters.c++;
    t.equal(deps.a.a, 'PluginA');
    t.equal(deps.b.b, 'PluginB');
    t.equal(counters.c, 1, 'only instantiates once');
    return {
      c: 'PluginC',
    };
  });

  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC);
  app.register(
    withDependencies({a: TokenA, b: TokenB, c: TokenC})(deps => {
      counters.d++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(deps.b.b, 'PluginB');
      t.equal(deps.c.c, 'PluginC');
    })
  );
  t.equal(counters.a, 0, 'does not instantiate until resolve is called');
  t.equal(counters.b, 0, 'does not instantiate until resolve is called');
  t.equal(counters.c, 0, 'does not instantiate until resolve is called');
  t.equal(counters.d, 0, 'does not instantiate until resolve is called');
  app.resolve();
  t.equal(counters.a, 1, 'only instantiates once');
  t.equal(counters.b, 1, 'only instantiates once');
  t.equal(counters.c, 1, 'only instantiates once');
  t.equal(counters.d, 1, 'only instantiates once');
  t.end();
});

tape('dependency registration with middleware', t => {
  const counters = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  };
  const app = new App('el', el => el);
  t.ok(app, 'creates an app');
  const PluginA = () => {
    counters.a++;
    t.equal(counters.a, 1, 'only instantiates once');
    return withMiddleware((ctx, next) => next(), {
      a: 'PluginA',
    });
  };
  const PluginB = withDependencies({a: TokenA})(deps => {
    counters.b++;
    t.equal(deps.a.a, 'PluginA');
    t.equal(counters.b, 1, 'only instantiates once');
    return {
      b: 'PluginB',
    };
  });
  const PluginC = withDependencies({a: TokenA, b: TokenB})(deps => {
    counters.c++;
    t.equal(deps.a.a, 'PluginA');
    t.equal(deps.b.b, 'PluginB');
    t.equal(counters.c, 1, 'only instantiates once');
    return withMiddleware((ctx, next) => next(), {
      c: 'PluginC',
    });
  });
  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC);
  app.register(
    withDependencies({a: TokenA, b: TokenB, c: TokenC})(deps => {
      counters.d++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(deps.b.b, 'PluginB');
      t.equal(deps.c.c, 'PluginC');
      return withMiddleware((ctx, next) => next());
    })
  );
  t.equal(counters.a, 0, 'does not instantiate until resolve is called');
  t.equal(counters.b, 0, 'does not instantiate until resolve is called');
  t.equal(counters.c, 0, 'does not instantiate until resolve is called');
  t.equal(counters.d, 0, 'does not instantiate until resolve is called');
  app.resolve();
  t.equal(counters.a, 1, 'only instantiates once');
  t.equal(counters.b, 1, 'only instantiates once');
  t.equal(counters.c, 1, 'only instantiates once');
  t.equal(counters.d, 1, 'only instantiates once');
  t.end();
});

tape('dependency registration with missing dependency', t => {
  const app = new App('el', el => el);
  const PluginA = () => {
    return withMiddleware((ctx, next) => next(), {
      a: 'PluginA',
    });
  };
  const PluginC = withDependencies({a: TokenA, b: TokenB})(() => {
    return withMiddleware((ctx, next) => next(), {
      c: 'PluginC',
    });
  });
  app.register(TokenA, PluginA);
  app.register(TokenC, PluginC);
  t.throws(() => app.resolve(), 'Catches missing dependencies');
  t.end();
});

tape('dependency registration with missing deep tree dependency', t => {
  const app = new App('el', el => el);
  const PluginA = () => {
    return withMiddleware((ctx, next) => next(), {
      a: 'PluginA',
    });
  };
  const PluginB = withDependencies({a: TokenA, d: 'RANDOM-TOKEN'})(() => {
    return withMiddleware((ctx, next) => next(), {
      b: 'PluginB',
    });
  });
  const PluginC = withDependencies({a: TokenA, b: TokenB})(() => {
    return withMiddleware((ctx, next) => next(), {
      c: 'PluginC',
    });
  });
  app.register(TokenC, PluginC);
  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  t.throws(() => app.resolve(), 'Catches missing dependencies');
  t.end();
});

tape('dependency registration with circular dependency', t => {
  const app = new App('el', el => el);
  const PluginB = withDependencies({c: TokenC})(() => {
    return withMiddleware((ctx, next) => next(), {
      b: 'PluginB',
    });
  });
  const PluginC = withDependencies({b: TokenB})(() => {
    return withMiddleware((ctx, next) => next(), {
      c: 'PluginC',
    });
  });
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC);
  t.throws(() => app.resolve(), 'Catches circular dependencies');
  t.end();
});
