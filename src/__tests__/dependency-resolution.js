/* @flow */
import tape from 'tape-cup';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {createPlugin} from '../create-plugin';

/* Copied from fusion-tokens/index.js */
const tokenTypes = {
  Required: 0,
  Optional: 1,
};
function Ref() {}
class TokenImpl {
  name: string;
  ref: mixed;
  type: $Values<typeof tokenTypes>;

  constructor(name: string, ref: mixed) {
    this.name = name;
    this.ref = ref || new Ref();
    this.type = ref ? tokenTypes.Optional : tokenTypes.Required;
    if (!ref) {
      // $FlowFixMe
      this.optional = () => new TokenImpl(name, this.ref);
    }
  }
}

type Token<T> = {
  (): T,
  optional: () => ?T,
};
function createToken(name: string): Token<any> {
  // $FlowFixMe
  return new TokenImpl(name);
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
type EType = {
  e: string,
};
const TokenA: Token<AType> = createToken('TokenA');
const TokenB: Token<BType> = createToken('TokenB');
const TokenC: Token<CType> = createToken('TokenC');
const TokenD: Token<BType> = createToken('TokenD');
const TokenEAsNullable: Token<?EType> = createToken('TokenEAsNullable');

tape('dependency registration', t => {
  const app = new App('el', el => el);
  t.ok(app, 'creates an app');
  const counters = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  };

  const PluginA: FusionPlugin<void, AType> = createPlugin({
    provides: () => {
      counters.a++;
      t.equal(counters.a, 1, 'only instantiates once');
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB: FusionPlugin<{a: Token<AType>}, BType> = createPlugin({
    deps: {
      a: TokenA,
    },
    provides: deps => {
      counters.b++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(counters.b, 1, 'only instantiates once');
      return {
        b: 'PluginB',
      };
    },
  });

  type PluginCType = FusionPlugin<{a: Token<AType>, b: Token<BType>}, CType>;
  const PluginC: PluginCType = createPlugin({
    deps: {
      a: TokenA,
      b: TokenB,
    },
    provides: deps => {
      counters.c++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(deps.b.b, 'PluginB');
      t.equal(counters.c, 1, 'only instantiates once');
      return {
        c: 'PluginC',
      };
    },
  });

  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC);
  app.register(
    createPlugin({
      deps: {a: TokenA, b: TokenB, c: TokenC},
      provides: deps => {
        counters.d++;
        t.equal(deps.a.a, 'PluginA');
        t.equal(deps.b.b, 'PluginB');
        t.equal(deps.c.c, 'PluginC');
      },
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

  const PluginA: FusionPlugin<void, AType> = createPlugin({
    provides: () => {
      counters.a++;
      t.equal(counters.a, 1, 'only instantiates once');
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB: FusionPlugin<{a: Token<AType>}, BType> = createPlugin({
    deps: {
      a: TokenA,
    },
    provides: deps => {
      counters.b++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(counters.b, 1, 'only instantiates once');
      return {
        b: 'PluginB',
      };
    },
  });

  type PluginCType = FusionPlugin<{a: Token<AType>, b: Token<BType>}, CType>;
  const PluginC: PluginCType = createPlugin({
    deps: {
      a: TokenA,
      b: TokenB,
    },
    provides: deps => {
      counters.c++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(deps.b.b, 'PluginD', 'uses correct alias');
      t.equal(counters.c, 1, 'only instantiates once');
      return {
        c: 'PluginC',
      };
    },
  });

  const PluginD: FusionPlugin<{a: Token<AType>}, BType> = createPlugin({
    deps: {
      a: TokenA,
    },
    provides: deps => {
      counters.d++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(counters.d, 1, 'only instantiates once');
      return {
        b: 'PluginD',
      };
    },
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

tape('dependency registration with aliasing non-plugins', t => {
  const app = new App('el', el => el);
  t.ok(app, 'creates an app');
  const counters = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  };

  const ValueA = 'some-value';
  const AliasedValue = 'some-aliased-value';
  const ValueTokenA: string = createToken('ValueA');
  const AliasedTokenA: string = createToken('AliasedTokenA');
  const PluginB: FusionPlugin<{a: string}, BType> = createPlugin({
    deps: {
      a: ValueTokenA,
    },
    provides: deps => {
      counters.b++;
      t.equal(deps.a, 'some-value');
      t.equal(counters.b, 1, 'only instantiates once');
      return {
        b: 'PluginB',
      };
    },
  });

  type PluginCType = FusionPlugin<{a: string}, CType>;
  const PluginC: PluginCType = createPlugin({
    deps: {
      a: ValueTokenA,
    },
    provides: deps => {
      counters.c++;
      t.equal(deps.a, 'some-aliased-value');
      t.equal(counters.c, 1, 'only instantiates once');
      return {
        c: 'PluginC',
      };
    },
  });

  app.register(ValueTokenA, ValueA);
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC).alias(ValueTokenA, AliasedTokenA);
  app.register(AliasedTokenA, AliasedValue);
  t.equal(counters.b, 0, 'does not instantiate until resolve is called');
  t.equal(counters.c, 0, 'does not instantiate until resolve is called');
  app.resolve();
  t.equal(counters.b, 1, 'only instantiates once');
  t.equal(counters.c, 1, 'only instantiates once');
  t.end();
});

tape('dependency registration with no token', t => {
  const app = new App('el', el => el);
  const PluginA: FusionPlugin<void, AType> = createPlugin({
    provides: () => {
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB: FusionPlugin<{a: Token<AType>}, BType> = createPlugin({
    deps: {
      a: TokenA,
    },
    provides: deps => {
      t.equal(deps.a.a, 'PluginA');
      return {
        b: 'PluginB',
      };
    },
  });

  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(
    createPlugin({
      deps: {a: TokenA, b: TokenB},
      provides: deps => {
        t.equal(deps.a.a, 'PluginA');
        t.equal(deps.b.b, 'PluginB');
      },
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
  const PluginA = createPlugin({
    provides: () => {
      counters.a++;
      t.equal(counters.a, 1, 'only instantiates once');
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB = createPlugin({
    deps: {a: TokenA},
    provides: deps => {
      counters.b++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(counters.b, 1, 'only instantiates once');
      return {
        b: 'PluginB',
      };
    },
  });
  const PluginC = createPlugin({
    deps: {a: TokenA, b: TokenB},
    provides: deps => {
      counters.c++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(deps.b.b, 'PluginB');
      t.equal(counters.c, 1, 'only instantiates once');
      return {
        c: 'PluginC',
      };
    },
    middleware: () => (ctx, next) => next(),
  });
  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC);
  t.equal(counters.a, 0, 'does not instantiate until resolve is called');
  t.equal(counters.b, 0, 'does not instantiate until resolve is called');
  t.equal(counters.c, 0, 'does not instantiate until resolve is called');
  app.resolve();
  t.equal(counters.a, 1, 'only instantiates once');
  t.equal(counters.b, 1, 'only instantiates once');
  t.equal(counters.c, 1, 'only instantiates once');
  t.end();
});

tape('dependency registration with missing dependency', t => {
  const app = new App('el', el => el);
  const PluginA = createPlugin({
    provides: () => {
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginC = createPlugin({
    deps: {a: TokenA, b: TokenB},
    provides: () => {
      return {
        c: 'PluginC',
      };
    },
  });
  app.register(TokenA, PluginA);
  app.register(TokenC, PluginC);
  t.throws(() => app.resolve(), 'Catches missing dependencies');
  t.end();
});

tape('dependency registration with null value', t => {
  const app = new App('el', el => el);

  t.doesNotThrow(() => {
    const PluginC = createPlugin({
      deps: {optionalNull: TokenEAsNullable},
      provides: deps => {
        t.equal(deps.optionalNull, null, 'null provided as expected');
      },
    });
    app.register(TokenEAsNullable, null);
    app.register(PluginC);
    app.resolve();
  });

  t.doesNotThrow(() => {
    const app = new App('el', el => el);
    // $FlowFixMe
    app.register('something', null);
    app.middleware({something: 'something'}, ({something}) => {
      t.equal(something, null, 'null provided as expected');
      return (ctx, next) => next();
    });
    app.resolve();
  });
  t.end();
});

// tape('dependency registration with undefined value', t => {
//   const app = new App('el', el => el);

//   t.plan(1);
//   const PluginC = createPlugin({
//     deps: {optionalUndefined: TokenOptionalWithUndefinedDefault},
//     provides: () => {
//       t.fail('should never reach here');
//     },
//   });
//   app.register(TokenC, PluginC);
//   t.throws(app.resolve, 'unable to resolve a default value of undefined');
//   t.end();
// });

tape('dependency registration with missing deep tree dependency', t => {
  const app = new App('el', el => el);
  const PluginA = createPlugin({
    provides: () => {
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB = createPlugin({
    deps: {a: TokenA, d: 'RANDOM-TOKEN'},
    provides: () => {
      return {
        b: 'PluginB',
      };
    },
  });
  const PluginC = createPlugin({
    deps: {a: TokenA, b: TokenB},
    provides: () => {
      return {
        c: 'PluginC',
      };
    },
  });
  app.register(TokenC, PluginC);
  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  t.throws(() => app.resolve(), 'Catches missing dependencies');
  t.end();
});

tape('dependency registration with circular dependency', t => {
  const app = new App('el', el => el);
  const PluginB = createPlugin({
    deps: {c: TokenC},
    provides: () => {
      return {
        b: 'PluginB',
      };
    },
  });
  const PluginC = createPlugin({
    deps: {b: TokenB},
    provides: () => {
      return {
        c: 'PluginC',
      };
    },
  });
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC);
  t.throws(() => app.resolve(), 'Catches circular dependencies');
  t.end();
});

// tape('dependency configuration', t => {
//   const StringToken: string = (() => {}: any);
//   const OtherStringToken: string = (() => {}: any);
//   const NumberToken: number = (() => {}: any);
//   const ObjectToken: {|
//     a: string,
//   |} = (() => {}: any);

//   const app = new App('el', el => el);
//   app.register(
//     createPlugin({
//       deps: {
//         a: StringToken,
//         b: OtherStringToken,
//         c: NumberToken,
//         d: ObjectToken,
//       },
//       provides: deps => {
//         t.equal(deps.a, 'string-a');
//         t.equal(deps.b, 'string-b');
//         t.equal(deps.c, 5);
//         t.deepLooseEqual(deps.d, {a: 'some-d'});
//         t.end();
//         return {};
//       },
//     })
//   );
//   app.register(StringToken, 'string-a');
//   app.register(OtherStringToken, 'string-b');
//   app.register(NumberToken, 5);
//   app.register(ObjectToken, {a: 'some-d'});
//   app.resolve();
// });

tape('dependency configuration with missing deps', t => {
  const StringToken: Token<string> = createToken('string-token');
  const OtherStringToken: Token<string> = createToken('other-string-token');

  const app = new App('el', el => el);
  app.register(
    createPlugin({
      deps: {
        a: StringToken,
        b: OtherStringToken,
      },
      provides: () => {
        t.fail('should not get here');
        return {};
      },
    })
  );
  app.register(StringToken, 'string-a');
  t.throws(() => app.resolve(), 'throws if dependencies are not configured');
  t.end();
});

tape('Extraneous dependencies', t => {
  const app = new App('el', el => el);
  const TestToken = createToken('test');
  app.register(TestToken, 'some-value');
  t.throws(() => app.resolve());
  t.end();
});
