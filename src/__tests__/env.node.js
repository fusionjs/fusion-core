/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */
import tape from 'tape-cup';
import {loadEnv} from '../get-env.js';

tape('loadEnv defaults', t => {
  const env = loadEnv()();
  t.deepEqual(env, {
    prefix: void 0,
    cdnUrl: void 0,
  });
  t.end();
});

tape('loadEnv overrides', t => {
  process.env.ROUTE_PREFIX = '/test_route_prefix';
  process.env.CDN_URL = 'https://cdn.com';

  const env = loadEnv()();
  t.deepEqual(env, {
    prefix: '/test_route_prefix',
    cdnUrl: 'https://cdn.com',
  });

  delete process.env.ROUTE_PREFIX;
  delete process.env.CDN_URL;
  t.end();
});

tape('loadEnv validation', t => {
  process.env.ROUTE_PREFIX = 'test/';
  t.throws(loadEnv, /ROUTE_PREFIX must not end with /);
  delete process.env.ROUTE_PREFIX;

  process.env.CDN_URL = 'https://cdn.com/test/';
  t.throws(loadEnv, /CDN_URL must not end with /);
  delete process.env.CDN_URL;
  t.end();
});
