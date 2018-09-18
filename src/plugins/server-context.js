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

const envVars = getEnv();

export default function middleware(ctx: Context, next: () => Promise<void>) {
  let assetBase = '/_static/';
  if (envVars.cdnUrl) {
    assetBase = envVars.cdnUrl;
  } else if (envVars.prefix) {
    assetBase = envVars.prefix + assetBase;
  }

  ctx.prefix = envVars.prefix;
  ctx.assetBase = assetBase;
  ctx.assets = new Set();
  ctx.criticalAssets = new Set();
  ctx.chunkAssetIndex = new Map();
  ctx.nonce = uuidv4();
  ctx.useragent = new UAParser(ctx.headers['user-agent']).getResult();
  ctx.element = null;
  ctx.rendered = null;

  return next();
}
