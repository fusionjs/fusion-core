/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * Legacy route prefix
 */

import {createPlugin} from '../create-plugin';
import {dangerouslySetHTML} from '../sanitization';

export default createPlugin({
  provides: () => {
    if (__NODE__) {
      return process.env.ROUTE_PREFIX;
    }
    if (__BROWSER__) {
      return window.__ROUTE_PREFIX__;
    }
  },
  middleware: (_, routePrefix) => (ctx, next) => {
    if (__NODE__) {
      if (ctx.element) {
        ctx.template.head.push(
          dangerouslySetHTML(
            `<script nonce="${ctx.nonce}">__ROUTE_PREFIX__ = ${JSON.stringify(
              routePrefix
            )}</script>`
          )
        );
      }
    }
    return next();
  },
});
