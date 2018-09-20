/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import uuidv4 from 'uuid/v4';
import UAParser from 'ua-parser-js';
import getEnv from '../get-env.js';

import type {Context} from '../types.js';
// Flow workaround: https://github.com/facebook/flow/issues/285#issuecomment-382044301
const {defineProperty} = Object;

let envVars = null;
const lazyEnv = new Proxy(
  {},
  {
    get(_, prop) {
      if (!envVars) {
        envVars = getEnv();
      }
      return envVars[prop];
    },
  }
);

export default function middleware(ctx: Context, next: () => Promise<void>) {
  let deprecated = (property, value, details) => {
    defineProperty(ctx, property, {
      enumerable: true,
      configurable: true,
      set(newValue) {
        value = newValue;
      },
      get() {
        // eslint-disable-next-line no-console
        console.warn(
          `Warning: ctx.${property} is deprecated and may be incorrect or inaccurate. ctx.${property} should no longer be used.`
        );
        if (details) {
          // eslint-disable-next-line no-console
          console.warn(details);
        }
        return value;
      },
    });
  };

  // env vars (deprecated)
  deprecated('rootDir', lazyEnv.rootDir);
  deprecated('env', lazyEnv.env);
  deprecated(
    'prefix',
    lazyEnv.prefix,
    [
      'To retrieve the route prefix, depend on the RoutePrefixToken instead.',
      'You may be able to resolve this warning by upgrading fusion-plugin-react-router, and/or fusion-plugin-error-handling.',
    ].join(' ')
  );
  deprecated('assetPath', lazyEnv.assetPath);
  deprecated('cdnUrl', lazyEnv.cdnUrl);

  // webpack-related things (deprecated)
  deprecated(
    'preloadChunks',
    [],
    'You may be able to resolve this warning by upgrading fusion-react, fusion-react-async, and/or fusion-cli.'
  );
  deprecated(
    'webpackPublicPath',
    ctx.webpackPublicPath || lazyEnv.cdnUrl || lazyEnv.assetPath,
    [
      'Use __webpack_public_path__ instead.',
      'You may be able to resolve this warning by upgrading fusion-cli.',
    ].join(' ')
  );

  // these are set by fusion-cli, however since fusion-cli plugins are not added when
  // running simulation tests, it is good to default them here
  // (deprecated)
  deprecated(
    'syncChunks',
    ctx.syncChunks || [],
    [
      'To retrieve the route prefix, depend on the RoutePrefixToken instead.',
      'You may be able to resolve this warning by upgrading fusion-plugin-i18n and/or fusion-cli.',
    ].join(' ')
  );
  deprecated(
    'chunkUrlMap',
    ctx.chunkUrlMap || new Map(),
    [
      'To retrieve the route prefix, depend on the RoutePrefixToken instead.',
      'You may be able to resolve this warning by upgrading fusion-cli.',
    ].join(' ')
  );

  ctx.nonce = uuidv4();
  ctx.useragent = new UAParser(ctx.headers['user-agent']).getResult();
  ctx.element = null;
  ctx.rendered = null;

  return next();
}
