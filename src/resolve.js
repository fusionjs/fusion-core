import {BasePlugin} from './base-plugin';
export default function resolve(registered) {
  const resolved = new Map();
  function resolveType(type) {
    if (resolved.has(type)) return resolved.get(type);
    resolved.set(type, _resolveType(type));
    return resolved.get(type);
  }
  function _resolveType(type) {
    const Plugin = registered.get(type);
    if (!registered.has(type)) {
      throw new Error(`Missing resolution for ${type}`);
    }
    if (!(Plugin.prototype instanceof BasePlugin)) {
      return Plugin;
    }
    let deps =
      Plugin.dependencies && Plugin.dependencies.length
        ? Plugin.dependencies.map(type => resolveType(type))
        : [];

    return new Plugin(...deps);
  }

  const types = registered.keys();
  for (const type of types) {
    resolveType(type);
  }
  return resolved;
}
