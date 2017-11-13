# Configuring plugins

Plugins can be configured using the same mechanism that is used for dependency injection:

```js
// src/main.js
import App from 'fusion-react';
import UniversalEvents from 'fusion-plugin-universal-events-react';
import UniversalLogger from 'fusion-plugin-universal-logger';
import fetch from 'unfetch';

export default () => {
  const app = new App();
  const EventEmitter = app.plugin(UniversalEvents, {fetch});
  const Logger = app.plugin(UniversalLogger, {UniversalEmitter: EventEmitter});
}
```

In the example above, `UniversalEvents` is configured to use `unfetch` as its `fetch` ponyfill implementation.

The second argument to the `app.plugin()` call becomes the dependencies passed into the plugin factory function:

```js
// fusion-plugin-universal-events-react
export default ({fetch}) => {
  /* ... */
}

// fusion-plugin-universal-logger
export default ({UniversalEmitter}) => {
  /* ... */
}
```

### Organizing configuration

Sometimes plugins might require non-trivial amount of configuration, which, if done inline in `src/main.js`, would clutter the file.

Instead, we recommended keeping the plugin registration calls in `src/main.js` flat, and then put configuration into files and import them into your app:

```js
// src/main.js
import App from 'fusion-react';
import JWTSession from 'fusion-plugin-jwt';
import sessionConfig from './config/session';

export default () => {
  const app = new App();
  const Session = app.plugin(JWTSession, sessionConfig);
}

// src/config/session.js
export default {secret: __NODE__ ? 'secret goes here'};
```