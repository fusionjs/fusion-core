/* @flow */
export function withDependencies<Dependencies, Service>(
  deps: Dependencies
): PluginLoader<Dependencies, Service> {
  return function withService(
    serviceLoader: FusionPlugin<Dependencies, Service>
  ) {
    serviceLoader.__deps__ = deps;
    return serviceLoader;
  };
}
