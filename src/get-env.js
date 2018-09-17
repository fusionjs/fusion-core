/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */
import assert from 'assert';
import {URL} from 'url';

export default (__BROWSER__ ? () => {} : loadEnv());

function load(key) {
  const value = process.env[key];
  if (value === null) {
    return void 0;
  }
  return value;
}

export function loadEnv() {
  let prefix = load('ROUTE_PREFIX');
  if (typeof prefix === 'string') {
    assert(!prefix.endsWith('/'), 'ROUTE_PREFIX must not end with /');
    assert(prefix.startsWith('/'), 'ROUTE_PREFIX must start with /');
  }

  let cdnUrl = load('CDN_URL');
  if (typeof cdnUrl === 'string') {
    assert(!cdnUrl.endsWith('/'), 'CDN_URL must not end with /');
    assert(new URL(cdnUrl), 'CDN_URL must be valid absolute URL');
  }

  return function loadEnv(): Env {
    return {
      prefix,
      cdnUrl,
    };
  };
}

// Handle flow-types for export so browser export is ignored.
type Env = {
  prefix?: string,
  cdnUrl?: string,
};
declare export default () => Env;
