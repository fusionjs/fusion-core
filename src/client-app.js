/* @flow */
/* eslint-env browser */
import {compose} from './compose.js';
import timing, {TimingToken} from './plugins/timing';
import BaseApp from './base-app';
import createClientHydrate from './plugins/client-hydrate';
import createClientRenderer from './plugins/client-renderer';
import {RenderToken, ElementToken} from './tokens';

export default function(): typeof BaseApp {
  return class ClientApp extends BaseApp {
    constructor(el, render) {
      super(el, render);
      this.register(TimingToken, timing);
      this.middleware({element: ElementToken}, createClientHydrate);
    }
    resolve() {
      this.middleware({render: RenderToken}, createClientRenderer);
      return super.resolve();
    }
    callback() {
      this.resolve();
      const middleware = compose(this.plugins);
      return () => {
        // TODO(#62): Create noop context object to match server api
        const ctx = {
          url: window.location.path + window.location.search,
          element: null,
          body: null,
        };
        // $FlowFixMe
        return middleware(ctx, () => Promise.resolve()).then(() => ctx);
      };
    }
  };
}
