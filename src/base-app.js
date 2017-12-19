/* @flow */
import {withMiddleware} from './with-middleware';
import {withDependencies} from './with-dependencies';
import type {PluginType, Middleware} from '../lib/index.js.flow';

export default class CoreApp {
  // TODO: More specific types
  registered: Map<any, any>;
  plugins: Array<any>;
  renderer: any;
  constructor() {
    this.registered = new Map();
    this.plugins = [];
  }
  register<A, B>(Plugin: PluginType<A, B>, type: B) {
    if (type === undefined) {
      // $FlowIgnore
      type = Plugin;
    }
    this.plugins.push(type);
    this.registered.set(type, Plugin);
  }
  middleware<Deps>(middleware: Deps => Middleware, deps?: Deps) {
    if (!deps) {
      // $FlowIgnore
      this.register(withMiddleware(middleware));
    } else {
      this.register(
        withDependencies(deps)(d => {
          return withMiddleware(middleware(d));
        })
      );
    }
  }
  resolve() {
    this.register(this.renderer);
    const resolved = new Map();
    const resolving = new Set();
    const registered = this.registered;
    const resolvedPlugins = [];
    // TODO: maybe could turn this into a map
    this.plugins.forEach(function resolveToken(token) {
      // if we have already resolved the type, return it
      if (resolved.has(token)) {
        return resolved.get(token);
      }
      // if currently resolving the same type, we have a circular dependency
      if (resolving.has(token)) {
        throw new Error(
          `Cannot resolve circular dependency: ${token.toString()}`
        );
      }
      // the type was never registered, throw error
      if (!registered.has(token)) {
        throw new Error(`Missing registration for type: ${token.toString()}`);
      }
      // get the registered type and resolve it
      resolving.add(token);
      let p = registered.get(token);
      if (typeof p === 'function') {
        const registeredDeps = p.__deps__ || {};
        const resolvedDeps = {};
        for (const key in registeredDeps) {
          const registeredToken = registeredDeps[key];
          resolvedDeps[key] = resolveToken(registeredToken);
        }
        // TODO: should we always call the function or only when the plugin
        // is used with `withDependencies`?
        p = p(resolvedDeps);
      }
      resolved.set(token, p);
      resolving.delete(token);
      resolvedPlugins.push(p);
      return p;
    });
    // TODO: potentially unnecessary
    this.plugins = resolvedPlugins;
  }
}
