/* eslint-env browser */
import {compose} from './compose.js';
import timing, {TimingToken} from './timing';
import BaseApp from './base-app';
import {withMiddleware} from './with-middleware';

export default function() {
  return class ClientApp extends BaseApp {
    constructor(element, render) {
      super();
      this.registered = new Map();
      this.resolved = new Map();
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
      this.register(timing, TimingToken);
      this.register(withMiddleware(ssr));
      this.renderer = withMiddleware(renderer);
    }
    onerror(e) {
      throw e;
    }
    callback() {
      this.resolve();
      const middleware = compose(this.plugins);
      return () => {
        const ctx = {
          url: window.location.path + window.location.search,
          element: null,
          body: null,
        };
        return middleware(ctx, () => Promise.resolve()).then(() => ctx);
      };
    }
  };
}
