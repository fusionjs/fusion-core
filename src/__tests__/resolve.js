import tape from 'tape-cup';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {createServer} from 'http';
import fetch from 'node-fetch';
import {BasePlugin} from '../base-plugin';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();

class Thing {
  constructor(name) {
    this.name = name;
  }
}

const aSingleton = new Thing('a-singleton');
const aFactory = new Thing('a-factory');
const bSingleton = new Thing('b-singleton');
const bFactory = new Thing('b-factory');
const cSingleton = new Thing('c-singleton');
const cFactory = new Thing('c-factory');
let middlewareCalls = [];

class DepA extends BasePlugin {
  singleton() {
    return aSingleton;
  }
  factory() {
    return aFactory;
  }
  async middleware(ctx, next) {
    middlewareCalls.push('downstream-a');
    await next();
    middlewareCalls.push('upstream-a');
  }
}

class DepB extends BasePlugin {
  static dependencies = ['DepA'];
  constructor(a) {
    super();
    this.a = a;
  }
  singleton() {
    return {
      a: this.a.singleton(),
      b: bSingleton,
    };
  }
  factory(ctx) {
    return {
      a: this.a.factory(ctx),
      b: bFactory,
    };
  }
  async middleware(ctx, next) {
    middlewareCalls.push('downstream-b');
    await next();
    middlewareCalls.push('upstream-b');
  }
}

class DepC extends BasePlugin {
  static dependencies = ['DepA', 'DepB'];
  constructor(a, b) {
    super();
    this.a = a;
    this.b = b;
  }
  singleton() {
    return {
      a: this.a.singleton(),
      b: this.b.singleton(),
      c: cSingleton,
    };
  }
  factory(ctx) {
    return {
      a: this.a.factory(ctx),
      b: this.b.factory(ctx),
      c: cFactory,
    };
  }
  async middleware(ctx, next) {
    middlewareCalls.push('downstream-c');
    if (__NODE__) {
      ctx.body = 'OK';
    }
    await next();
    middlewareCalls.push('upstream-c');
  }
}

tape('dependency resolution', async t => {
  middlewareCalls = [];
  const app = new App('fake-element', el => el);
  app.register('DepA', DepA);
  app.register('DepB', DepB);
  app.register('DepC', DepC);

  app.callback();

  const a = app.get('DepA');
  const b = app.get('DepB');
  const c = app.get('DepC');

  t.equal(a.singleton(), aSingleton);
  t.equal(b.singleton().b, bSingleton);
  t.equal(b.singleton().a, aSingleton);
  t.equal(c.singleton().a, aSingleton);
  t.equal(c.singleton().b.b, bSingleton);
  t.equal(c.singleton().c, cSingleton);
  t.equal(a.factory({}), aFactory);
  t.equal(b.factory({}).b, bFactory);
  t.equal(b.factory({}).a, aFactory);
  t.equal(c.factory({}).a, aFactory);
  t.equal(c.factory({}).b.b, bFactory);
  t.equal(c.factory({}).c, cFactory);
  t.end();
});

tape('dependency middleware execution', async t => {
  middlewareCalls = [];
  const app = new App('fake-element', el => el);
  app.plugin(() => async (ctx, next) => {
    middlewareCalls.push('downstream-plugin-1');
    await next();
    middlewareCalls.push('upstream-plugin-1');
  });
  app.register('DepA', DepA);
  app.plugin(() => async (ctx, next) => {
    middlewareCalls.push('downstream-plugin-2');
    await next();
    middlewareCalls.push('upstream-plugin-2');
  });
  app.register('DepB', DepB);
  app.register('DepC', DepC);
  app.plugin(() => async (ctx, next) => {
    middlewareCalls.push('downstream-plugin-3');
    await next();
    middlewareCalls.push('upstream-plugin-3');
  });

  const cb = app.callback();
  t.equal(typeof cb, 'function');

  if (__NODE__) {
    const server = createServer(cb);
    await new Promise(resolve => server.listen(3000, resolve));
    const res = await fetch('http://localhost:3000/');
    t.equal(res.status, 200);
    server.close();
  } else {
    await cb();
  }

  t.equal(middlewareCalls.shift(), 'downstream-plugin-1');
  t.equal(middlewareCalls.shift(), 'downstream-a');
  t.equal(middlewareCalls.shift(), 'downstream-plugin-2');
  t.equal(middlewareCalls.shift(), 'downstream-b');
  t.equal(middlewareCalls.shift(), 'downstream-c');
  t.equal(middlewareCalls.shift(), 'downstream-plugin-3');
  t.equal(middlewareCalls.shift(), 'upstream-plugin-3');
  t.equal(middlewareCalls.shift(), 'upstream-c');
  t.equal(middlewareCalls.shift(), 'upstream-b');
  t.equal(middlewareCalls.shift(), 'upstream-plugin-2');
  t.equal(middlewareCalls.shift(), 'upstream-a');
  t.equal(middlewareCalls.shift(), 'upstream-plugin-1');
  t.end();
});

tape('application missing dependency', t => {
  const app = new App('fake-element', el => el);
  app.register('DepA', DepA);
  app.register('DepC', DepC);
  t.throws(() => app.callback());
  t.end();
});

tape('application with non-plugin dependencies', t => {
  const app = new App('fake-element', el => el);
  class SomeDep extends BasePlugin {
    static dependencies = ['SomeString'];
    constructor(a) {
      super();
      this.a = a;
    }
    singleton() {
      return this.a;
    }
  }
  app.register('SomeDep', SomeDep);
  app.register('SomeString', 'hello world');
  app.callback();
  t.equal(app.get('SomeString'), 'hello world');
  t.equal(app.get('SomeDep').singleton(), 'hello world');
  t.end();
});

tape('application with class non-plugin dependencies', t => {
  const app = new App('fake-element', el => el);
  class SomeDep extends BasePlugin {
    static dependencies = ['SomeClass'];
    constructor(a) {
      super();
      this.a = a;
    }
    singleton() {
      return this.a;
    }
  }
  app.register('SomeDep', SomeDep);
  app.register('SomeClass', Thing);
  app.callback();
  t.equal(app.get('SomeClass'), Thing);
  t.equal(app.get('SomeDep').singleton(), Thing);
  t.end();
});

tape('plugin can use itself as key', t => {
  const app = new App('fake-element', el => el);
  class SomeDep extends BasePlugin {
    static dependencies = ['DepA'];
    constructor(a) {
      super();
      this.a = a;
    }
    singleton() {
      return this.a;
    }
  }
  app.register('DepA', DepA);
  app.register(SomeDep);
  app.callback();
  const a = app.get('DepA');
  const some = app.get(SomeDep);
  t.equal(some.singleton(), a);
  t.end();
});

tape('app.middleware', async t => {
  const app = new App('fake-element', el => el);
  let called = false;
  app.register('DepA', DepA);
  app.register('DepB', DepB);
  app.register('DepC', DepC);
  app.middleware(['DepA', 'DepB', 'DepC'], (A, B, C) => (ctx, next) => {
    called = true;
    t.equal(A, app.get('DepA'));
    t.equal(B, app.get('DepB'));
    t.equal(C, app.get('DepC'));
    if (__NODE__) {
      ctx.body = 'OK';
    }
    return next();
  });

  const cb = app.callback();

  if (__NODE__) {
    const server = createServer(cb);
    await new Promise(resolve => server.listen(3000, resolve));
    const res = await fetch('http://localhost:3000/');
    t.equal(res.status, 200);
    server.close();
  } else {
    await cb();
  }
  t.ok(called);
  t.end();
});
