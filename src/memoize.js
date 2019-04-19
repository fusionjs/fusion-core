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
  const wm = new WeakMap();
  return ctx => {
    if (wm.has(ctx)) {
      return ((wm.get(ctx): any): A); // Refinement with `has` doesn't seem to work
    }
    const result = fn(ctx);
    wm.set(ctx, result);
    return result;
  };
}
