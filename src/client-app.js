/* @flow */
/* eslint-env browser */
import {compose} from './compose.js';
import timing, {TimingToken} from './timing';
import BaseApp from './base-app';
import {withMiddleware} from './with-middleware';

export default function(): Class<FusionApp> {
  return class ClientApp extends BaseApp {
    // TODO: More specific types
    constructor(element: any, render: (el: any) => Promise<any>) {
      super();
      function ssr(ctx, next) {
        ctx.prefix = window.__ROUTE_PREFIX__ || ''; // serialized by ./server
        ctx.element = element;
        ctx.preloadChunks = [];
        return next();
      }
      function renderer(ctx, next) {
        const rendered = render(ctx.element);
        if (rendered instanceof Promise) {
          return rendered.then(r => {
            ctx.rendered = r;
            return next();
          });
        } else {
          ctx.rendered = rendered;
          return next();
        }
      }
      this.register(TimingToken, timing);
      this.register(withMiddleware(ssr));
      this.renderer = withMiddleware(renderer);
    }
    callback() {
      this.resolve();
      const middleware = compose(this.plugins);
      return () => {
        // TODO: Create noop context object to match server api
        const ctx = {
          url: window.location.path + window.location.search,
          element: null,
          body: null,
        };
        // $FlowIgnore
        return middleware(ctx, () => Promise.resolve()).then(() => ctx);
      };
    }
  };
}
