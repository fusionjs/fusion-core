export default function createPlugin(P) {
  return class PluginWrapper extends P {
    constructor(...deps) {
      super(...deps);
      this.factoryCache = new WeakMap();
      this.singletonCache = null;
    }
    singleton() {
      if (typeof super.singleton !== 'function') {
        throw new Error(`Singleton not implemented by Plugin: ${P}`);
      }
      if (this.singletonCache === null) {
        this.singletonCache = super.singleton();
      }
      return this.singletonCache;
    }
    factory(ctx) {
      if (typeof super.factory !== 'function') {
        throw new Error(`Factory not implemented by Plugin: ${P}`);
      }
      if (this.factoryCache.has(ctx)) {
        return this.factoryCache.get(ctx);
      }
      const factoryInstance = super.factory(ctx);
      this.factoryCache.set(ctx, factoryInstance);
      return factoryInstance;
    }
  };
}
