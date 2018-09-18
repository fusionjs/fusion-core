/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import App from '../index';
import {run} from './test-helper';
import {SSRDeciderToken, SSRBodyTemplateToken} from '../tokens';
import {createPlugin} from '../create-plugin';
import BaseApp from '../base-app';

test('ssr with accept header', async t => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
    return 'lol';
  };
  const app = new App(element, render);

  app.middleware(async (ctx, next) => {
    t.equals(ctx.element, element, 'sets ctx.element');
    t.equals(ctx.type, 'text/html', 'sets ctx.type');
    t.equals(typeof ctx.template, 'object', 'sets ctx.template');
    t.equals(typeof ctx.template.title, 'string', 'sets ctx.template.title');
    t.equals(typeof ctx.template.htmlAttrs, 'object', 'ctx.template.htmlAttrs');
    // $FlowFixMe
    t.equals(typeof ctx.template.bodyAttrs, 'object', 'ctx.template.bodyAttrs');
    t.ok(ctx.template.head instanceof Array, 'ctx.template.head');
    t.ok(ctx.template.body instanceof Array, 'ctx.template.body');
    await next();
    t.equals(
      typeof ctx.template,
      'object',
      'ctx.template keeps structure on upstream'
    );
    t.equals(
      typeof ctx.template.title,
      'string',
      'ctx.template.title keeps structure on upstream'
    );
    t.equals(
      typeof ctx.template.htmlAttrs,
      'object',
      'ctx.template.htmlAttrs keeps structure on upstream'
    );
    t.equals(
      // $FlowFixMe
      typeof ctx.template.bodyAttrs,
      'object',
      'ctx.template.bodyAttrs keeps structure on upstream'
    );
    t.ok(
      ctx.template.head instanceof Array,
      'ctx.template.head keeps structure on upstream'
    );
    t.ok(
      ctx.template.body instanceof Array,
      'ctx.template.body keeps structure on upstream'
    );
  });
  try {
    // $FlowFixMe
    const ctx = await run(app);
    t.equals(typeof ctx.rendered, 'string', 'ctx.rendered');
    // t.equals(typeof ctx.body, 'string', 'renders ctx.body to string');
    // t.ok(!ctx.body.includes(element), 'does not renders element into ctx.body');
    t.ok(flags.render, 'calls render');
  } catch (e) {
    t.ifError(e, 'should not error');
  }
  t.end();
});

test('ssr without valid accept header', async t => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
  };
  const app = new App(element, render);
  let initialCtx = {
    headers: {accept: '*/*'},
  };
  try {
    // $FlowFixMe
    const ctx = await run(app, initialCtx);
    t.notok(ctx.element, 'does not set ctx.element');
    t.notok(ctx.type, 'does not set ctx.type');
    t.notok(ctx.body, 'does not set ctx.body');
    t.ok(!flags.render, 'does not call render');
    t.notok(ctx.body, 'does not render ctx.body to string');
  } catch (e) {
    t.ifError(e, 'does not error');
  }
  t.end();
});

test('disable SSR by composing SSRDecider with a plugin', async t => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
  };

  function buildApp() {
    const app = new App(element, render);

    app.middleware((ctx, next) => {
      ctx.body = '_NO_SSR_';
      return next();
    });

    const SSRDeciderEnhancer = ssrDecider => {
      return createPlugin({
        provides: () => {
          return ctx => {
            return (
              ssrDecider(ctx) &&
              !ctx.path.startsWith('/foo') &&
              !ctx.path.startsWith('/bar')
            );
          };
        },
      });
    };
    app.enhance(SSRDeciderToken, SSRDeciderEnhancer);
    return app;
  }

  try {
    let initialCtx = {
      path: '/foo',
    };
    // $FlowFixMe
    const ctx = await run(buildApp(), initialCtx);

    t.notok(ctx.element, 'non-ssr route does not set ctx.element');
    t.notok(ctx.type, 'non-ssr route does not set ctx.type');
    t.ok(!flags.render, 'non-ssr route does not call render');
    t.equals(ctx.body, '_NO_SSR_', 'can set body in plugin during non-ssr');

    let validSSRPathCtx = {
      path: '/some-path',
    };
    // $FlowFixMe
    const renderCtx = await run(buildApp(), validSSRPathCtx);
    t.equals(renderCtx.element, element, 'ssr route sets ctx.element');
    t.equals(renderCtx.type, 'text/html', 'ssr route sets ctx.type');
  } catch (e) {
    t.ifError(e, 'does not error');
  }
  t.end();
});

test('disable SSR by composing SSRDecider with a function', async t => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
  };

  function buildApp() {
    const app = new App(element, render);

    app.middleware((ctx, next) => {
      ctx.body = '_NO_SSR_';
      return next();
    });

    app.enhance(SSRDeciderToken, decide => ctx =>
      decide(ctx) && !ctx.path.startsWith('/foo')
    );
    return app;
  }

  try {
    let initialCtx = {
      path: '/foo',
    };
    // $FlowFixMe
    const ctx = await run(buildApp(), initialCtx);

    t.notok(ctx.element, 'non-ssr route does not set ctx.element');
    t.notok(ctx.type, 'non-ssr route does not set ctx.type');
    t.ok(!flags.render, 'non-ssr route does not call render');
    t.equals(ctx.body, '_NO_SSR_', 'can set body in plugin during non-ssr');

    let validSSRPathCtx = {
      path: '/some-path',
    };
    // $FlowFixMe
    const renderCtx = await run(buildApp(), validSSRPathCtx);
    t.equals(renderCtx.element, element, 'ssr route sets ctx.element');
    t.equals(renderCtx.type, 'text/html', 'ssr route sets ctx.type');
  } catch (e) {
    t.ifError(e, 'does not error');
  }
  t.end();
});

test('no SSR for asset paths', async t => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
  };

  function buildApp() {
    const app = new App(element, render);
    return app;
  }

  try {
    flags.render = false;
    let initialCtx = {
      path: `/_static/foo`,
    };
    // $FlowFixMe
    await run(buildApp(), initialCtx);
    t.equals(flags.render, false, `request to static asset dir should not ssr`);
  } catch (e) {
    t.ifError(e, 'does not error');
  }
  t.end();
});

test('SSR with redirects downstream', async t => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
    return 'lol';
  };
  const app = new App(element, render);

  app.middleware(async (ctx, next) => {
    t.equals(ctx.element, element, 'sets ctx.element');
    t.equals(ctx.type, 'text/html', 'sets ctx.type');
    t.equals(typeof ctx.template, 'object', 'sets ctx.template');
    t.equals(typeof ctx.template.title, 'string', 'sets ctx.template.title');
    t.equals(typeof ctx.template.htmlAttrs, 'object', 'ctx.template.htmlAttrs');
    // $FlowFixMe
    t.equals(typeof ctx.template.bodyAttrs, 'object', 'ctx.template.bodyAttrs');
    t.ok(ctx.template.head instanceof Array, 'ctx.template.head');
    t.ok(ctx.template.body instanceof Array, 'ctx.template.body');
    ctx.status = 302;
    ctx.body = 'redirect';
    await next();
    t.equals(
      typeof ctx.template,
      'object',
      'ctx.template keeps structure on upstream'
    );
    t.equals(
      typeof ctx.template.title,
      'string',
      'ctx.template.title keeps structure on upstream'
    );
    t.equals(
      typeof ctx.template.htmlAttrs,
      'object',
      'ctx.template.htmlAttrs keeps structure on upstream'
    );
    t.equals(
      // $FlowFixMe
      typeof ctx.template.bodyAttrs,
      'object',
      'ctx.template.bodyAttrs keeps structure on upstream'
    );
    t.ok(
      ctx.template.head instanceof Array,
      'ctx.template.head keeps structure on upstream'
    );
    t.ok(
      ctx.template.body instanceof Array,
      'ctx.template.body keeps structure on upstream'
    );
  });
  try {
    const ctx = await run(app);
    t.equal(ctx.status, 302, 'sends 302 status code');
    t.notok(ctx.rendered, 'does not render');
    t.equal(typeof ctx.body, 'string');
    t.notok(flags.render, 'does not call render');
  } catch (e) {
    t.ifError(e, 'should not error');
  }
  t.end();
});

test('SSR with redirects upstream', async t => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
    return 'lol';
  };
  const app = new App(element, render);

  app.middleware(async (ctx, next) => {
    t.equals(ctx.element, element, 'sets ctx.element');
    t.equals(ctx.type, 'text/html', 'sets ctx.type');
    t.equals(typeof ctx.template, 'object', 'sets ctx.template');
    t.equals(typeof ctx.template.title, 'string', 'sets ctx.template.title');
    t.equals(typeof ctx.template.htmlAttrs, 'object', 'ctx.template.htmlAttrs');
    // $FlowFixMe
    t.equals(typeof ctx.template.bodyAttrs, 'object', 'ctx.template.bodyAttrs');
    t.ok(ctx.template.head instanceof Array, 'ctx.template.head');
    t.ok(ctx.template.body instanceof Array, 'ctx.template.body');
    await next();
    ctx.status = 302;
    ctx.body = 'redirect';
    t.equals(
      typeof ctx.template,
      'object',
      'ctx.template keeps structure on upstream'
    );
    t.equals(
      typeof ctx.template.title,
      'string',
      'ctx.template.title keeps structure on upstream'
    );
    t.equals(
      typeof ctx.template.htmlAttrs,
      'object',
      'ctx.template.htmlAttrs keeps structure on upstream'
    );
    t.equals(
      // $FlowFixMe
      typeof ctx.template.bodyAttrs,
      'object',
      'ctx.template.bodyAttrs keeps structure on upstream'
    );
    t.ok(
      ctx.template.head instanceof Array,
      'ctx.template.head keeps structure on upstream'
    );
    t.ok(
      ctx.template.body instanceof Array,
      'ctx.template.body keeps structure on upstream'
    );
  });
  try {
    const ctx = await run(app);
    t.equal(ctx.status, 302, 'sends 302 status code');
    t.equal(ctx.rendered, 'lol', 'renders');
    t.equal(typeof ctx.body, 'string');
    t.ok(flags.render, 'calls render');
  } catch (e) {
    t.ifError(e, 'should not error');
  }
  t.end();
});

test('SSRBodyTemplate is used', async t => {
  const element = 'hi';
  const render = el => el;
  const app = new App(element, render);
  let called = false;
  app.register(SSRBodyTemplateToken, ctx => {
    called = true;
    return `<html>${ctx.rendered}</html>`;
  });

  try {
    // $FlowFixMe
    const ctx = await run(app);
    t.equal(ctx.body, `<html>hi</html>`);
    t.ok(called, 'ssrBodyTemplate called');
  } catch (e) {
    t.ifError(e, 'does not error');
  }
  t.end();
});

test('rendering error handling', async t => {
  const element = 'hi';
  const render = () => {
    return new Promise(() => {
      throw new Error('Test error');
    });
  };
  const app = new App(element, render);
  try {
    await run(app);
  } catch (e) {
    t.equal(e.message, 'Test error');
    t.end();
  }
});

test('app handles no render token', async t => {
  const app = new BaseApp('el', el => el);
  app.renderer = null;
  try {
    await app.resolve();
    t.end();
  } catch (e) {
    t.equal(e.message, 'Missing registration for RenderToken');
    t.end();
  }
});
