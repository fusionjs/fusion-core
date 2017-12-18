// TODO: Use real token with type signature
import {withMiddleware} from './with-middleware';
export const TimingToken = 'TimingToken';

class Timing {
  constructor() {
    this.render = deferred();
    this.end = deferred();
    this.downstream = deferred();
    this.upstream = deferred();
  }
}

const timing = {
  from(ctx) {
    return ctx.memoize(() => new Timing());
  },
};

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
  const {render, end, downstream, upstream} = timing.from(ctx);
  ctx.timing = {
    start: now(),
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
export default withMiddleware(middleware, timing);

export function now() {
  if (__NODE__) {
    const [seconds, ns] = process.hrtime();
    return Math.round(seconds * 1000 + ns / 1e6);
  } else if (__BROWSER__) {
    if (window.performance && window.performance.now) {
      return Math.round(window.performance.now());
    }
    return Date.now();
  }
}

function deferred() {
  let resolve = null;
  let reject = null;
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
