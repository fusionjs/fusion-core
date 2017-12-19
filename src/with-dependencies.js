/* @flow */

export function withDependencies<Dependencies, Plugin>(
  deps: Dependencies
): PluginLoader<Dependencies, Plugin> {
  return function withService(serviceLoader: PluginType<Dependencies, Plugin>) {
    serviceLoader.__deps__ = deps;
    return serviceLoader;
  };
}
