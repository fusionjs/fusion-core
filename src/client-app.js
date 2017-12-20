/* @flow */
/* eslint-env browser */
import {compose} from './compose.js';
import timing, {TimingToken} from './plugins/timing';
import BaseApp from './base-app';
import createClientHydrate from './plugins/client-hydrate';
import createClientRenderer from './plugins/client-renderer';

export default function(): Class<FusionApp> {
  return class ClientApp extends BaseApp {
    // TODO: More specific types
    constructor(element: any, render: (el: any) => Promise<any>) {
      super();
      this.register(TimingToken, timing);
      this.middleware(createClientHydrate(element));
      this.renderer = createClientRenderer(render);
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
        // $FlowFixMe
        return middleware(ctx, () => Promise.resolve()).then(() => ctx);
      };
    }
  };
}
