export default class CoreApp {
  constructor() {
    this.registered = new Map();
  }
  plugin(plugin, dependencies) {
    const service = plugin(dependencies);
    this.plugins.splice(-1, 0, service);
    return service;
  }
  register(Plugin, type) {
    if (type === undefined) {
      type = Plugin;
    }
    this.plugins.splice(-1, 0, type);
    this.registered.set(type, Plugin);
  }
  resolve() {
    const resolved = new Map();
    const resolving = new Set();
    const registered = this.registered;
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
      const p = registered.get(token);
      const registeredDeps = p && p.__deps__ ? p.__deps__ : {};
      const resolvedDeps = {};
      for (const key in registeredDeps) {
        const registeredToken = registeredDeps[key];
        resolvedDeps[key] = resolveToken(registeredToken);
      }
      const resolvedPlugin = p(resolvedDeps);
      resolved.set(token, resolvedPlugin);
      resolving.delete(token);
      return resolvedPlugin;
    });
    // TODO: potentially unnecessary
    this.plugins = this.plugins.map(p => {
      if (resolved.has(p)) {
        return resolved.get(p);
      }
      return p;
    });
  }
}
