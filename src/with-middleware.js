// TODO: fix this with flow
export const withMiddleware = (middleware, service) => {
  // TODO: potentially remove this to be a truthy check instead...
  // This currently allows us to do things like [].map(withMiddleware)
  if (Object(service) !== service) {
    service = {};
  }
  service.__middleware__ = middleware;
  return service;
};
