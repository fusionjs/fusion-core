# Plugin

A plugin is simply a function that returns a value. For example, the following is a valid plugin.

```js
// fusion-plugin-console-logger
const ConsoleLoggerPlugin = () => {
  return console;
}
```

In order to use plugins, you need to register them with your FusionJS application. You do this by calling
`app.register` with the plugin and a token for that plugin. The token is simply a value used to keep track of
what plugins are registered, and to allow plugins to depend on one another. You can think of Tokens like interfaces.
We keep a list of standard tokens in the `fusion-tokens` repository. Lets finish up this logger example:

```js
// src/main.js
import ConsoleLoggerPlugin from 'fusion-plugin-console-logger';
import {LoggerToken} from 'fusion-tokens';
import App from 'fusion-core';

export default function main() {
  const app = new App(...);
  app.register(LoggerToken, ConsoleLoggerPlugin);
  return app;
}
```

To use the logger we registered, we need to introduce the `withDependencies` helper from `fusion-core`. This function allows us to declare the dependencies we need. Lets write a new plugin that depends on a logger.

```js
// fusion-plugin-some-api
import {withDependencies} from 'fusion-core';
import {LoggerToken} from 'fusion-tokens';
export const MyApiSecretToken = '';

const APIPlugin = withDependencies({
  logger: LoggerToken,
  secret: MyApiSecretToken,
})(deps => {
 const {logger} = deps;
  // Note: implementation of APIClient left out for brevity
  return new APIClient(logger);
});
```

The API plugin is declaring that it needs a logger that matches the api documented by the `LoggerToken`. The user then provides an implementation of that logger by registering the `fusion-plugin-console-logger` plugin with the `LoggerToken`.

## Middleware

Plugins can hook into the fusion lifecycle by adding middlewares using the `withMiddleware` helper from `fusion-core`.

```js
// fusion-plugin-some-api
import {withDependencies, withMiddleware} from 'fusion-core';
import {LoggerToken} from 'fusion-tokens';
export const MyApiSecretToken = '';

const APIPlugin = withDependencies({
  logger: LoggerToken,
  secret: MyApiSecretToken,
})(deps => {
 const {logger} = deps;
  // Note: implementation of APIClient left out for brevity
  const client = new APIClient(logger);
  return withMiddleware(async (ctx, next) => {
    // do middleware things...
    await next(); 
    // do middleware things...
  }, client);
});
```