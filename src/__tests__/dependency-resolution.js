/* @flow */
import tape from 'tape-cup';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {withDependencies} from '../with-dependencies';
import {withMiddleware} from '../with-middleware';

function createToken(name): any {
  return () => {
    throw new Error(`Missing dependency: ${name}`);
  };
}

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
const TokenA: AType = createToken('TokenA');
const TokenB: BType = createToken('TokenB');
const TokenC: CType = createToken('TokenC');
const TokenD: BType = createToken('TokenD');

tape('dependency registration', t => {
  const app = new App('el', el => el);
  t.ok(app, 'creates an app');
  const counters = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  };

  const PluginA: FusionPlugin<void, AType> = () => {
    counters.a++;
    t.equal(counters.a, 1, 'only instantiates once');
    return {
      a: 'PluginA',
    };
  };
  const PluginB: FusionPlugin<{a: AType}, BType> = withDependencies({
    a: TokenA,
  })(deps => {
    counters.b++;
    t.equal(deps.a.a, 'PluginA');
    t.equal(counters.b, 1, 'only instantiates once');
    return {
      b: 'PluginB',
    };
  });

  type PluginCType = FusionPlugin<{a: AType, b: BType}, CType>;
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

tape('dependency registration with aliases', t => {
  const app = new App('el', el => el);
  t.ok(app, 'creates an app');
  const counters = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  };

  const PluginA: FusionPlugin<void, AType> = () => {
    counters.a++;
    t.equal(counters.a, 1, 'only instantiates once');
    return {
      a: 'PluginA',
    };
  };
  const PluginB: FusionPlugin<{a: AType}, BType> = withDependencies({
    a: TokenA,
  })(deps => {
    counters.b++;
    t.equal(deps.a.a, 'PluginA');
    t.equal(counters.b, 1, 'only instantiates once');
    return {
      b: 'PluginB',
    };
  });

  type PluginCType = FusionPlugin<{a: AType, b: BType}, CType>;
  const PluginC: PluginCType = withDependencies({
    a: TokenA,
    b: TokenB,
  })(deps => {
    counters.c++;
    t.equal(deps.a.a, 'PluginA');
    t.equal(deps.b.b, 'PluginD', 'uses correct alias');
    t.equal(counters.c, 1, 'only instantiates once');
    return {
      c: 'PluginC',
    };
  });

  const PluginD: FusionPlugin<{a: AType}, BType> = withDependencies({
    a: TokenA,
  })(deps => {
    counters.d++;
    t.equal(deps.a.a, 'PluginA');
    t.equal(counters.d, 1, 'only instantiates once');
    return {
      b: 'PluginD',
    };
  });

  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC).alias(TokenB, TokenD);
  app.register(TokenD, PluginD);
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

tape('dependency registration with no token', t => {
  const app = new App('el', el => el);
  const PluginA: FusionPlugin<void, AType> = () => {
    return {
      a: 'PluginA',
    };
  };
  const PluginB: FusionPlugin<{a: AType}, BType> = withDependencies({
    a: TokenA,
  })(deps => {
    t.equal(deps.a.a, 'PluginA');
    return {
      b: 'PluginB',
    };
  });

  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(
    withDependencies({a: TokenA, b: TokenB})(deps => {
      t.equal(deps.a.a, 'PluginA');
      t.equal(deps.b.b, 'PluginB');
    })
  );
  app.resolve();
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
    return withMiddleware(
      {
        a: 'PluginA',
      },
      (ctx, next) => next()
    );
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
    return withMiddleware(
      {
        c: 'PluginC',
      },
      (ctx, next) => next()
    );
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
    return withMiddleware(
      {
        a: 'PluginA',
      },
      (ctx, next) => next()
    );
  };
  const PluginC = withDependencies({a: TokenA, b: TokenB})(() => {
    return withMiddleware(
      {
        c: 'PluginC',
      },
      (ctx, next) => next()
    );
  });
  app.register(TokenA, PluginA);
  app.register(TokenC, PluginC);
  t.throws(() => app.resolve(), 'Catches missing dependencies');
  t.end();
});

tape('dependency registration with missing deep tree dependency', t => {
  const app = new App('el', el => el);
  const PluginA = () => {
    return withMiddleware(
      {
        a: 'PluginA',
      },
      (ctx, next) => next()
    );
  };
  const PluginB = withDependencies({a: TokenA, d: 'RANDOM-TOKEN'})(() => {
    return withMiddleware(
      {
        b: 'PluginB',
      },
      (ctx, next) => next()
    );
  });
  const PluginC = withDependencies({a: TokenA, b: TokenB})(() => {
    return withMiddleware(
      {
        c: 'PluginC',
      },
      (ctx, next) => next()
    );
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
    return withMiddleware(
      {
        b: 'PluginB',
      },
      (ctx, next) => next()
    );
  });
  const PluginC = withDependencies({b: TokenB})(() => {
    return withMiddleware(
      {
        c: 'PluginC',
      },
      (ctx, next) => next()
    );
  });
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC);
  t.throws(() => app.resolve(), 'Catches circular dependencies');
  t.end();
});

tape('dependency configuration', t => {
  const StringToken: string = (() => {}: any);
  const OtherStringToken: string = (() => {}: any);
  const NumberToken: number = (() => {}: any);
  const ObjectToken: {|
    a: string,
  |} = (() => {}: any);

  const app = new App('el', el => el);
  app.register(
    withDependencies({
      a: StringToken,
      b: OtherStringToken,
      c: NumberToken,
      d: ObjectToken,
    })(deps => {
      t.equal(deps.a, 'string-a');
      t.equal(deps.b, 'string-b');
      t.equal(deps.c, 5);
      t.deepLooseEqual(deps.d, {a: 'some-d'});
      t.end();
      return {};
    })
  );
  app.configure(StringToken, 'string-a');
  app.configure(OtherStringToken, 'string-b');
  app.configure(NumberToken, 5);
  app.configure(ObjectToken, {a: 'some-d'});
  app.resolve();
});

tape('dependency configuration with missing deps', t => {
  const StringToken: string = createToken('string-token');
  const OtherStringToken: string = createToken('other-string-token');

  const app = new App('el', el => el);
  app.register(
    withDependencies({
      a: StringToken,
      b: OtherStringToken,
    })(() => {
      t.fail('should not get here');
      return {};
    })
  );
  app.configure(StringToken, 'string-a');
  t.throws(() => app.resolve(), 'throws if dependencies are not configured');
  t.end();
});
