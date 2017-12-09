import createServerPlugin from './plugin/create-plugin-server';
import createBrowserPlugin from './plugin/create-plugin-browser';
import resolvePlugins from './resolve';
import {BasePlugin} from './base-plugin';
const createPlugin = __BROWSER__ ? createBrowserPlugin : createServerPlugin;

// export interface Plugin<A> {
//   +factory?: (ctx: string) => A;
//   +singleton?: () => A;
//   +middleware?: (ctx: any, next: any) => Promise<any>;
// }
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
  get(type) {
    if (!this.resolved.has(type)) {
      throw new Error(`No Plugin registered for type: ${type}`);
    }
    return this.resolved.get(type);
  }
  resolve() {
    this.resolved = resolvePlugins(this.registered);
    this.plugins = this.plugins.map(p => {
      if (this.resolved.has(p)) {
        return this.resolved.get(p);
      }
      return p;
    });
  }
}
