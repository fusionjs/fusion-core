export const withMiddleware = (middleware, service) => {
  // This currently allows us to do things like [].map(withMiddleware)
  if (Object(service) !== service) {
    service = {};
  }
  service.__middleware__ = middleware;
  return service;
};
