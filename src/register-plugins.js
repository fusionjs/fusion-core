
import * as R from 'ramda';

const registerPlugins_ = (compose) => (app) => (plugins) => () =>
  compose(
    ...plugins
  )(app);

export const registerPlugins = (app, plugins) => {
  return registerPlugins_(R.compose)(app)(plugins);
}
