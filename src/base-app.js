import {createPlugin} from './create-plugin';
import {ElementToken, RenderToken} from './tokens';

class FusionApp {
  constructor(element, render) {
    this.registered = new Map();
    this.plugins = [];
    element && this.register(ElementToken, element);
    render && this.register(RenderToken, render);
  }
  register(token, value) {
    if (value === undefined) {
      value = token;
    }
    // the renderer is a special case, since it needs to be always run last
    this.plugins.push(token);
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
      middleware = () => deps;
    }
    this.register(createPlugin({deps, middleware}));
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
        const defaultValue = token();
        if (defaultValue === undefined) {
          throw new Error(
            `Cannot resolve to a default value of 'undefined' for token: ${token.toString()}`
          );
        }
        this.register(token, defaultValue);
      }
      // get the registered type and resolve it
      resolving.add(token);
      let {value, aliases} = registered.get(token);
      let provides = value;

      if (value && value.__plugin__) {
        const registeredDeps = value.deps || {};
        const resolvedDeps = {};
        for (const key in registeredDeps) {
          const registeredToken = registeredDeps[key];
          resolvedDeps[key] = resolveToken(registeredToken, aliases);
        }
        // `provides` should be undefined if the plugin does not have a `provides` function
        provides = value.provides ? value.provides(resolvedDeps) : undefined;
        if (value.middleware) {
          resolvedPlugins.push(value.middleware(resolvedDeps, provides));
        }
      }
      resolved.set(token, provides);
      resolving.delete(token);
      return provides;
    };
    for (let i = 0; i < this.plugins.length; i++) {
      resolveToken(this.plugins[i]);
    }
    this.plugins = resolvedPlugins;
  }
}

export default FusionApp;
