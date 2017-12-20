/* @flow */
/* eslint-env node */
import {compose} from './compose.js';
import Timing, {now, TimingToken} from './timing';
import BaseApp from './base-app';
import {withMiddleware} from './with-middleware';
import {withDependencies} from './with-dependencies';
import createSSRPlugin from './ssr';

export default function(): Class<FusionApp> {
  const Koa = require('koa');

  return class ServerApp extends BaseApp {
    // TODO: More specific types
    _app: Koa;
    // TODO: Potentially we can have the app depend on `element` and `render` functions, rather
    // than have them passed into the constructor. Doing DI all the way down could make testing easier
    // TODO: More specific types
    constructor(element: any, render: (el: any) => Promise<string>) {
      super();
      this._app = new Koa();
      this.register(TimingToken, Timing);
      this.register(withMiddleware(createSSRPlugin(element)));
      this.renderer = getRendererPlugin(render);
    }
    callback() {
      this.resolve();
      // $FlowFixMe
      this._app.use(compose(this.plugins));
      return this._app.callback();
    }
  };
}

function getRendererPlugin(render) {
  return withDependencies({timing: TimingToken})(({timing}) => {
    return withMiddleware(async function renderer(ctx, next) {
      const timer = timing.from(ctx);
      timer.downstream.resolve(now() - timer.start);

      if (ctx.element) {
        const renderStart = now();
        ctx.rendered = await render(ctx.element);
        timer.render.resolve(now() - renderStart);
      }

      const upstreamStart = now();
      await next();
      timer.upstream.resolve(now() - upstreamStart);
    });
  });
}
