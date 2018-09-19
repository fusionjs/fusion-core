/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Context} from './types.js';

type MemoizeFn<A> = (ctx: Context) => A;

export function memoize<A>(fn: MemoizeFn<A>): MemoizeFn<A> {
  if (__BROWSER__) {
    return browserMemoize(fn);
  }

  const wm = new WeakMap();
  return ctx => {
    if (wm.has(ctx)) {
      return ((wm.get(ctx): any): A); // Refinement doesn't seem to work
    } else {
      const result = fn(ctx);
      wm.set(ctx, result);
      return result;
    }
  };
}

/**
 * There is only ever a single ctx object in the browser.
 * Therefore we can use a simple memoization function.
 */
function browserMemoize<A>(fn: MemoizeFn<A>): MemoizeFn<A> {
  let memoized;
  let called = false;
  return ctx => {
    if (!called) {
      memoized = fn(ctx);
      called = true;
    }
    return memoized;
  };
}
