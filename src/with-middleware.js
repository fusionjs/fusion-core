/* @flow */
import type {Middleware} from '../lib/index.js.flow';
export function withMiddleware<Service>(
  middleware: Middleware,
  service?: Service
): Service {
  // TODO: potentially remove this to be a truthy check instead...
  // This currently allows us to do things like [].map(withMiddleware)
  // $FlowIgnore
  if (Object(service) !== service) {
    // $FlowIgnore
    service = {};
  }
  // $FlowIgnore
  service.__middleware__ = middleware;
  // $FlowIgnore
  return service;
}
