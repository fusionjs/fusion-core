import createServerPlugin from './plugin/create-plugin-server';
import createBrowserPlugin from './plugin/create-plugin-browser';
import {BasePlugin} from './base-plugin';
import {resolve} from 'path';

const createPlugin = __BROWSER__ ? createBrowserPlugin : createServerPlugin;
export default class CoreApp {
  constructor() {
    this.registered = new Map();
    this.resolved = new Map();
  }
  plugin(plugin, dependencies) {
    const service = plugin(dependencies);
    this.plugins.splice(-1, 0, service);
    return service;
  }
  middleware(dependencies, m) {
    if (m === undefined) {
      this.plugins.splice(-1, 0, dependencies);
    } else {
      class MiddlewarePlugin extends BasePlugin {
        static dependencies = dependencies;
        constructor(...deps) {
          super();
          this.middleware = m(...deps);
        }
      }
      this.register(MiddlewarePlugin);
    }
  }
  register(type, Plugin) {
    if (!type) {
      throw new Error(`Must register a valid truthy type. Received: ${type}`);
    }
    if (Plugin === undefined) {
      Plugin = type;
    }
    if (Plugin.prototype instanceof BasePlugin) {
      Plugin = createPlugin(Plugin);
      this.plugins.splice(-1, 0, type);
    }
    this.registered.set(type, Plugin);
  }
  _register(Plugin, type) {
    if (type === undefined) {
      type = Plugin;
    }
    this.plugins.splice(-1, 0, type);
    this.registered.set(type, Plugin);
  }
  get(type) {
    if (!this.resolved.has(type)) {
      throw new Error(`No Plugin registered for type: ${type}`);
    }
    return this.resolved.get(type);
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
