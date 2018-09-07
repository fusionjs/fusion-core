/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createPlugin} from '../create-plugin';
import type {Context, SSRDecider as SSRDeciderService} from '../types.js';
import {header, footer} from './utils.js';
import string_stream from 'string-to-stream';
import multi_stream from 'multistream';

const SSRDecider = createPlugin({
  provides: () => {
    return ctx => {
      // If the request has one of these extensions, we assume it's not something that requires server-side rendering of virtual dom
      // TODO(#46): this check should probably look at the asset manifest to ensure asset 404s are handled correctly
      if (ctx.path.match(/\.(js|gif|jpg|png|pdf|json)$/)) return false;
      // The Accept header is a good proxy for whether SSR should happen
      // Requesting an HTML page via the browser url bar generates a request with `text/html` in its Accept headers
      // XHR/fetch requests do not have `text/html` in the Accept headers
      if (!ctx.headers.accept) return false;
      if (!ctx.headers.accept.includes('text/html')) return false;
      return true;
    };
  },
});
export {SSRDecider};

export default function createSSRPlugin({
  element,
  ssrDecider,
}: {
  element: any,
  ssrDecider: SSRDeciderService,
}) {
  return async function ssrPlugin(ctx: Context, next: () => Promise<void>) {
    if (!ssrDecider(ctx)) return next();

    const template = {
      htmlAttrs: {},
      bodyAttrs: {},
      title: '',
      head: [],
      body: [],
    };
    ctx.element = element;
    ctx.rendered = '';
    ctx.template = template;
    ctx.type = 'text/html';
    
    await next();

    // Allow someone to override the ssr by setting ctx.body
    // This is especially useful for things like ctx.redirect
    if (ctx.body && ctx.respond !== false) {
      return;
    }
                    
    ctx.body = multi_stream
    ([
      string_stream(header(ctx)),
      typeof ctx.rendered === 'string' ? string_stream(ctx.rendered) : ctx.rendered,
      string_stream(footer(ctx))
    ])         
  };
}
