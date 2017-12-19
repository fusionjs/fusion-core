/* @flow */
// TODO: Use real token with type signature
import {withMiddleware} from './with-middleware';

type Deferred<T> = {
  promise: Promise<T>,
  resolve: (result: T) => void,
  reject: (error: Error) => void,
};

class Timing {
  start: number;
  render: Deferred<number>;
  end: Deferred<number>;
  downstream: Deferred<number>;
  upstream: Deferred<number>;
  constructor() {
    this.start = now();
    this.render = deferred();
    this.end = deferred();
    this.downstream = deferred();
    this.upstream = deferred();
  }
}
type TimingPlugin = {
  from(ctx: Object): Timing,
};
const timing: TimingPlugin = {
  from(ctx): Timing {
    return ctx.memoize(() => new Timing());
  },
};

export const TimingToken: TimingPlugin = (() => {}: any);

function middleware(ctx, next) {
  const memoCache = new Map();
  ctx.memoize = fn => {
    if (memoCache.has(fn)) {
      return memoCache.get(fn);
    }
    const result = fn();
    memoCache.set(fn, result);
    return result;
  };
  const {start, render, end, downstream, upstream} = timing.from(ctx);
  ctx.timing = {
    start,
    render: render.promise,
    end: end.promise,
    downstream: downstream.promise,
    upstream: upstream.promise,
  };
  return next().then(() => {
    const endTime = now() - ctx.timing.start;
    end.resolve(endTime);
  });
}

export default () => withMiddleware(middleware, timing);

export function now(): number {
  if (__NODE__) {
    const [seconds, ns] = process.hrtime();
    return Math.round(seconds * 1000 + ns / 1e6);
  } else {
    // eslint-disable-next-line cup/no-undef
    if (window.performance && window.performance.now) {
      // eslint-disable-next-line cup/no-undef
      return Math.round(window.performance.now());
    }
    return Date.now();
  }
}

function deferred<T>(): Deferred<T> {
  let resolve = () => {};
  let reject = () => {};
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve,
    reject,
  };
}
