export const withMiddleware = (service, middleware) => {
  if (!middleware) {
    middleware = service;
    service = {};
  }
  service.__middleware__ = middleware;
  return service;
};
