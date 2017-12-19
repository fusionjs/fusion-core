/* @flow */
// inline version of koa-compose to get around Rollup/CUP commonjs-related issue
import type {Middleware} from '../lib/index.js.flow';
function composeMiddleware(middleware): Middleware {
  if (!Array.isArray(middleware)) {
    throw new TypeError('Middleware stack must be an array!');
  }
  for (const fn of middleware) {
    if (typeof fn !== 'function') {
      throw new TypeError('Middleware must be composed of functions!');
    }
  }

  return function(context, next) {
    let index = -1;
    return dispatch(0);
    function dispatch(i) {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      index = i;
      let fn = middleware[i];
      if (i === middleware.length) fn = next;
      if (!fn) return Promise.resolve();
      try {
        // $FlowIgnore
        return fn(context, function next() {
          return dispatch(i + 1);
        });
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}

export function compose(plugins: Array<mixed>) {
  const middleware = plugins
    .map(p => {
      // $FlowIgnore
      if (Object(p) === p && typeof p.__middleware__ === 'function') {
        return p.__middleware__;
      }
      return false;
    })
    .filter(Boolean);
  return composeMiddleware(middleware);
}
