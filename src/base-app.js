import {withMiddleware} from './with-middleware';
import {withDependencies} from './with-dependencies';
import {ElementToken, RenderToken} from './tokens';

class FusionApp {
  constructor(element, render) {
    this.registered = new Map();
    this.plugins = [];
    this.configure(ElementToken, element);
    this.configure(RenderToken, render);
  }
  register(token, value) {
    if (value === undefined) {
      value = token;
    }
    // the renderer is a special case, since it needs to be always run last
    if (token !== RenderToken) {
      this.plugins.push(token);
    }
    return this._set(token, value);
  }
  configure(token, value) {
    this._set(token, () => value);
  }
  _set(token, value) {
    const aliases = new Map();
    this.registered.set(token, {value, aliases});
    function alias(sourceToken, destToken) {
      aliases.set(sourceToken, destToken);
      return {alias};
    }
    return {alias};
  }
  middleware(deps, middleware) {
    if (middleware === undefined) {
      middleware = deps;
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
    const resolved = new Map();
    const resolving = new Set();
    const registered = this.registered;
    const resolvedPlugins = [];
    const resolveToken = (token, tokenAliases) => {
      // if we have already resolved the type, return it
      if (tokenAliases && tokenAliases.has(token)) {
        token = tokenAliases.get(token);
      }
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
        // Attempt to get default value
        // NOTE: As of now, default values can only be configuration, not full blown plugins
        this.configure(token, token());
      }
      // get the registered type and resolve it
      resolving.add(token);
      let {value, aliases} = registered.get(token);
      if (typeof value.__middleware__ !== 'function') {
        const registeredDeps = value.__deps__ || {};
        const resolvedDeps = {};
        for (const key in registeredDeps) {
          const registeredToken = registeredDeps[key];
          resolvedDeps[key] = resolveToken(registeredToken, aliases);
        }
        value = value(resolvedDeps);
      }
      resolved.set(token, value);
      resolving.delete(token);
      resolvedPlugins.push(value);
      return value;
    };
    for (let i = 0; i < this.plugins.length; i++) {
      resolveToken(this.plugins[i]);
    }

    this.plugins = resolvedPlugins;
  }
}

export default FusionApp;
