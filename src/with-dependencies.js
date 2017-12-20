/* @flow */
export function withDependencies<Dependencies, Service>(
  deps: Dependencies
): (
  FusionPlugin<Dependencies, Service>
) => FusionPlugin<Dependencies, Service> {
  return function withService(
    serviceLoader: FusionPlugin<Dependencies, Service>
  ) {
    serviceLoader.__deps__ = deps;
    return serviceLoader;
  };
}
