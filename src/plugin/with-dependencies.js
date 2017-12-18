export function withDependencies(deps) {
  return function withService(serviceLoader) {
    serviceLoader.__deps__ = deps;
    return serviceLoader;
  };
}
