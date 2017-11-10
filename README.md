# fusion-core

[![Build status](https://badge.buildkite.com/f21b82191811f668ef6fe24f6151058a84fa2c645cfa8810d0.svg?branch=master)](https://buildkite.com/uberopensource/fusion-core)

A generic entry point class for FusionJS applications that is used by the FusionJS runtime.

If you're using React, you should use the [`fusion-react`](https://github.com/fusionjs/fusion-react) package instead.

This package also exposes utilities for developing plugins.

---

### Example

```js
// main.js
import React from 'react';
import {render} from 'react-dom';
import {renderToString} from 'react-dom/server';
import App from 'fusion-core';

const Hello = () => <div>Hello</div>;

const render = el => __NODE__ ? renderToString(el) : render(el, document.getElementById('root'));

export default function() {
  return new App(<Hello />, render);
}
```

---

### API

```js
import App from 'fusion-core';

const app = new App(element, render);
```

- `element: T` - Required. The root element of the application. Typically this should be a React/Preact element
- `render: T => string|undefined` - A function that can render `element`

Creates an application that can be registered into the Fusion server.

The application is responsible for rendering (both virtual dom and server-side rendering)

An application can receive any number of plugins, which can augment the behavior of the application.

Typically a plugin works the same way as a Koa middleware.

#### Instance members

##### app.plugin

```js
const plugin = app.plugin(factory, dependencies);
```

- `factory: (dependencies: Object) => Plugin` - Required. The function that is exported by a plugin package
- `dependencies: Object` - Optional. A map of dependencies and configuration for the plugin
- `plugin` - a plugin

Call this method to register a plugin into a FusionJS application. Returns a plugin, which can be passed as a dependency to other plugins.

---

# Plugin

There are two types of plugins: middleware plugins and service plugins.

When writing a plugin you should always export a function that returns either a middleware or a instance of the `Plugin` class.

#### Middleware plugins

A middleware plugin is a [Koa](http://koajs.com/) middleware, a function that takes two argument: a `ctx` object that has some FusionJS-specific properties, and a `next` callback function.

```js
const middleware = (ctx, next) => {
  return next();
}
```

In FusionJS, the `next()` call represents the time when virtual dom rendering happens. Typically, you'll want to run all your logic before that, and simply have a `return next()` statement at the end of the function. Even in cases where virtual DOM rendering is not applicable, this pattern is still the simplest way to write a middleware.

In a few more advanced cases, however, you might want to do things _after_ virtual dom rendering. In that case, you can call `await next()` instead:

```js
export default () => __NODE__ && async (ctx, next) => {
  // this happens before virtual dom rendering
  const start = new Date();

  await next();

  // this happens after virtual rendeing, but before the response is sent to the browser
  console.log('timing: ', new Date() - start);
}
```

## Services

Often we want to encapsulate some functionality into a single coherent package that exposes a programmatic API that can be consumed by others.

In FusionJS, any class can be a service.

```js
import {Plugin} from 'fusion-core';

export default () => {
  return new Plugin({
    Service: class SomeService {
      /* ... */
    },
  });
}
```

#### Singleton services

In some cases, it's desirable to enforce that only a single instance of a service exists in an application. To do this, simply use the `SingletonPlugin` instead of the `Plugin` class:

```js
import {SingletonPlugin} from 'fusion-core';

export default () => {
  return new SingletonPlugin({
    Service: class {
      constructor() {
        console.log('only gets instantiated once');
      }
    },
  })
}
```

The singleton service instance can be acquired using the `.of` method. Calling `.of(ctx)` from a middleware returns the same instance for all requests.

```js
const Thing = app.plugin(MyThing);
const instance = Thing.of();
```

---

### Examples

#### Implementing HTTP endpoints

A plugin can be used to implement a RESTful HTTP endpoint. To achieve this, simply run code conditionally based on the url of the request

```js
export default () => async (ctx, next) => {
  if (ctx.method === 'GET' && ctx.path === '/api/v1/users') {
    ctx.body = await getUsers();
  }
  return next();
}
```

#### Serialization and hydration

A plugin can be atomically responsible for serialization/deserialization of data from the server to the client.

The example below shows a plugin that grabs the project version from package.json and logs it in the browser:

```js
// plugins/version-plugin.js
import util from 'util';
import fs from 'fs';
import {html} from 'fusion-core'; // html sanitization

export default () => {
  if (__NODE__) {
    const read = util.promisify(fs.readFile);

    return async (ctx, next) => {
      const data = read('package.json');
      const {version} = JSON.parse(data);
      ctx.body.head.push(html`<meta id="app-version" content="${version}">`);
      return next();
    }
  }
  else {
    return async (ctx, next) => {
      const version = document.getElementById('app-version').content;
      console.log(`Version: ${version}`);
      return next();
    }
  }
}
```

We can then consume the plugin like this:

```js
// main.js
import React from 'react';
import App from 'fusion-core';
import VersionPlugin from './plugins/version-plugin';

const root = <div>Hello world</div>;

const render = el => __NODE__ ? renderToString(el) : render(el, document.getElementById('root'));

export default function() {
  const app = new App(root, render);
  app.plugin(VersionPlugin);
  return app;
}
```

---

### API

#### Middleware plugins

```js
export default () => (ctx, next) => {
  return next()
}
```

- `ctx: {element: T}` - An object with a property called `element`. Plugins can compose element in order to add providers into a React tree, for example:\
  `ctx.element = <SomeProvider>{ctx.element}</SomeProvider>`

  The `ctx` object also exposes properties that server-specific properties in the server. See [context](#context)
- `next: () => Promise` - Every plugin must call `await next()` (or `next().then(...)`) exactly once.
  Code before this call happens before virtual dom rendering, and code after it runs after. In the server, flushing the response to the client happens after

#### Service plugins

```js
import {Plugin} from 'fusion-core';

export default () => {
  const plugin = new Plugin({Service, middleware});
  return plugin;
}
```

- `Service: class` - Optional. A class that provides a programmatic API
- `middleware: (ctx: Object, next: () => Promise) => Promise` - Optional. A Koa middleware
- `plugin: {Service, middleware, of}`
  - `Service: class`
  - `middleware: (ctx: Object, next: () => Promise) => Promise`
  - `of: (ctx: Object|null|undefined) => Service` - returns an instance of the service, memoized using `ctx` as the memoization key.

#### Context

Middlewares receive a `ctx` object as their first argument. This object has a property called `element` in both server and client.

In the server, `ctx` also exposes the same properties as a [Koa context](http://koajs.com/#context)

Additionally, when server-side rendering a page, FusionJS sets `ctx.body` to an object with the following properties:

- `htmlAttrs: Object` - attributes for the `<html>` tag. For example `{lang: 'en-US'}` turns into `<html lang="en-US">`. Default: empty object
- `title: string` - The content for the `<title>` tag. Default: empty string
- `head: Array` - A list of [sanitized HTML strings](#html-sanitization). Default: empty array
- `body: Array` - A list of [sanitized HTML strings](#html-sanitization). Default: empty array
- `ssr: string` - When the virtual dom `render` is called, this property is populated with the rendered html string

When a request does not require a server-side render, `ctx.body` follows regular Koa semantics.

#### HTML sanitization

Default-on HTML sanitization is important for preventing security threats such as XSS attacks.

Fusion automatically sanitizes `htmlAttrs` and `title`. When pushing HTML strings to `head` or `body`, you must use the `html` template tag to mark your HTML as sanitized:

```js
import {html} from 'fusion-core';

export default () => (ctx, next) => {
  if (ctx.element) {
    const userData = await getUserData();
    // userData can't be trusted, and is automatically escaped
    ctx.body.body.push(html`<div>${userData}</div>`)
  }
  return next();
}
```

If `userData` above was `<script>alert(1)</script>`, the string would be automatically turned into `<div>\u003Cscript\u003Ealert(1)\u003C/script\u003E</div>`. Note that only `userData` is escaped, but the HTML in your code stays intact.

If your HTML is complex and needs to be broken into smaller strings, you can also nest sanitized HTML strings like this:

```js
const notUserData = html`<h1>Hello</h1>`
const body = html`<div>${notUserData}</div>`
```

Note that you cannot mix sanitized HTML with unsanitized strings:

```js
ctx.body.body.push(html`<h1>Safe</h1>` + 'not safe') // will throw an error when rendered
```

Also note that only template strings can have template tags (i.e. <code>html&#x60;&lt;div&gt;&lt;/div&gt;&#x60;</code>). The following are NOT valid Javascript: `html"<div></div>"` and `html'<div></div>'`.

If you get an <code>Unsanitized html. You must use html&#x60;[your html here]&#x60;</code> error, remember to prepend the `html` template tag to your template string.

If you have already taken steps to sanitize your input against XSS and don't wish to re-sanitize it, you can use `dangerouslySetHTML(string)` to let Fusion render the unescaped dynamic string.


