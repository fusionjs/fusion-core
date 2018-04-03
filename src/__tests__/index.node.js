import test from 'tape-cup';
import App, {html} from '../index';
import {run} from './test-helper';
import {SSRDeciderToken} from '../tokens';
import {createPlugin} from '../create-plugin';

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
    t.equals(typeof ctx.rendered, 'string', 'ctx.rendered');
    t.equals(typeof ctx.body, 'string', 'renders ctx.body to string');
    t.ok(!ctx.body.includes(element), 'does not renders element into ctx.body');
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
    const ctx = await run(buildApp(), initialCtx);

    t.notok(ctx.element, 'non-ssr route does not set ctx.element');
    t.notok(ctx.type, 'non-ssr route does not set ctx.type');
    t.ok(!flags.render, 'non-ssr route does not call render');
    t.equals(ctx.body, '_NO_SSR_', 'can set body in plugin during non-ssr');

    let validSSRPathCtx = {
      path: '/some-path',
    };
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
    const ctx = await run(buildApp(), initialCtx);

    t.notok(ctx.element, 'non-ssr route does not set ctx.element');
    t.notok(ctx.type, 'non-ssr route does not set ctx.type');
    t.ok(!flags.render, 'non-ssr route does not call render');
    t.equals(ctx.body, '_NO_SSR_', 'can set body in plugin during non-ssr');

    let validSSRPathCtx = {
      path: '/some-path',
    };
    const renderCtx = await run(buildApp(), validSSRPathCtx);
    t.equals(renderCtx.element, element, 'ssr route sets ctx.element');
    t.equals(renderCtx.type, 'text/html', 'ssr route sets ctx.type');
  } catch (e) {
    t.ifError(e, 'does not error');
  }
  t.end();
});

test('SSR extension handling', async t => {
  const extensionToSSRSupported = {
    js: false,
    gif: false,
    jpg: false,
    png: false,
    pdf: false,
    json: false,
    html: true,
  };

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
    for (let i in extensionToSSRSupported) {
      flags.render = false;
      let initialCtx = {
        path: `/some-path.${i}`,
      };
      await run(buildApp(), initialCtx);
      const shouldSSR = extensionToSSRSupported[i];
      t.equals(
        flags.render,
        shouldSSR,
        `extension of ${i} should ${shouldSSR ? '' : 'not'} have ssr`
      );
    }
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
    t.ok(ctx.rendered, 'should call render for SSR-based component redirects');
    t.equal(typeof ctx.body, 'string');
    t.ok(flags.render, 'calls render for SSR-based component redirects');
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

test('HTML escaping works', async t => {
  const element = 'hi';
  const render = el => el;
  const template = (ctx, next) => {
    ctx.template.htmlAttrs = {lang: '">'};
    ctx.template.bodyAttrs = {test: '">'};
    ctx.template.title = '</title>';
    return next();
  };
  const app = new App(element, render);
  app.middleware(template);

  try {
    const ctx = await run(app);
    t.ok(ctx.body.includes('<html lang="\\u0022\\u003E">'), 'lang works');
    t.ok(ctx.body.includes('<body test="\\u0022\\u003E">'), 'bodyAttrs work');
    t.ok(
      ctx.body.includes('<title>\\u003C\\u002Ftitle\\u003E</title>'),
      'title works'
    );
  } catch (e) {
    t.ifError(e, 'does not error');
  }
  t.end();
});

test('head and body must be sanitized', async t => {
  const element = 'hi';
  const render = el => el;
  const template = (ctx, next) => {
    ctx.template.head.push(html`<meta charset="${'">'}" />`);
    ctx.template.body.push(html`<div>${'">'}</div>`);
    return next();
  };
  const app = new App(element, render);
  app.middleware(template);
  try {
    const ctx = await run(app);
    t.ok(ctx.body.includes('<meta charset="\\u0022\\u003E" />'), 'head works');
    t.ok(ctx.body.includes('<div>\\u0022\\u003E</div>'), 'body works');
  } catch (e) {
    t.ifError(e, 'does not error');
  }
  t.end();
});

test('throws if head is not sanitized', async t => {
  const element = 'hi';
  const render = el => el;
  const template = (ctx, next) => {
    ctx.template.head.push(`<meta charset="${'">'}" />`);
    return next();
  };
  const app = new App(element, render);
  app.middleware(template);
  try {
    await run(app);
    t.fail('should throw');
  } catch (e) {
    t.ok(e, 'throws if head is not sanitized');
  }
  t.end();
});

test('throws if body is not sanitized', async t => {
  const element = 'hi';
  const render = el => el;
  const template = (ctx, next) => {
    ctx.template.body.push(`<meta charset="${'">'}" />`);
    return next();
  };
  const app = new App(element, render);
  app.middleware(template);

  try {
    await run(app);
    t.fail('should throw');
  } catch (e) {
    t.ok(e, 'throws if body is not sanitized');
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
