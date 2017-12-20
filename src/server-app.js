/* @flow */
/* eslint-env node */
import {compose} from './compose.js';
import Timing, {TimingToken} from './plugins/timing';
import BaseApp from './base-app';
import getRendererPlugin from './plugins/server-renderer';

import createSSRPlugin from './plugins/ssr';

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
      this.middleware(createSSRPlugin(element));
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
