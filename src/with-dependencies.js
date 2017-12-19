/* @flow */
import type {PluginType} from '../lib/index.js.flow';

type PluginLoader<Dependencies, Plugin> = (
  init: PluginType<Dependencies, Plugin>
) => PluginType<Dependencies, Plugin>;

export function withDependencies<Dependencies, Plugin>(
  deps: Dependencies
): PluginLoader<Dependencies, Plugin> {
  return function withService(serviceLoader: PluginType<Dependencies, Plugin>) {
    serviceLoader.__deps__ = deps;
    return serviceLoader;
  };
}
