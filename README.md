# fusion-core

[![Build status](https://badge.buildkite.com/f21b82191811f668ef6fe24f6151058a84fa2c645cfa8810d0.svg?branch=master)](https://buildkite.com/uberopensource/fusion-core)

### Guides

- [What is FusionJS](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/what-is-fusion.md)
- [Getting started](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/getting-started.md)
- [Framework comparison](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/framework-comparison.md)

### Core concepts

- [Universal code](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/universal-code.md)
- [Creating a plugin](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/creating-a-plugin.md)
  - [Dependencies](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/dependencies.md)
  - [Configuring plugins](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/configuring-plugins.md)
  - [Creating endpoints](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/creating-endpoints.md)
  - [Creating providers](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/creating-providers.md)
  - [Modifying the HTML template](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/modifying-html-template.md)
  - [Working with secrets](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/working-with-secrets.md)

---

## fusion-core

The `fusion-core` package provides a generic entry point class for FusionJS applications that is used by the FusionJS runtime.

If you're using React, you should use the [`fusion-react`](https://github.com/fusionjs/fusion-react) package instead.

This package also exposes utilities for developing plugins.

---

### Example

```js
// main.js
import React from 'react';
import ReactDOM from 'react-dom';
import {renderToString} from 'react-dom/server';
import App, {ElementToken, RenderToken} from 'fusion-core';

const Hello = () => <div>Hello</div>;

const render = el => __NODE__ ? renderToString(el) : ReactDOM.render(el, document.getElementById('root'));

export default function() {
  const app = new App();
  app.configure(ElementToken, <Hello />);
  app.configure(RenderToken, render);
  return app;
}
```

---

### API

##### app

```js
import App from 'fusion-core';

const app = new App();
```

Creates an application that can be registered into the Fusion server.

The application is responsible for rendering (both virtual dom and server-side rendering)

An application can receive any number of plugins, which can augment the behavior of the application.

Typically a plugin works the same way as a Koa middleware.


#### App Instance members

##### app.register

```js
app.register([Token,] Plugin);
```

- `Token: Object` - Optional. A token to register the plugin under. 
- `Plugin: (dependencies: Object) => any` - Required. The function that is exported by a plugin package

Call this method to register a plugin into a FusionJS application. An optional token can be passed as the first
argument to allow integrating the plugin into the FusionJS dependency injection system. 

##### app.middleware

```js
app.middleware(Dependencies, (deps) => Middleware);
app.middleware(Middleware);
```

This method is a useful shortcut for registering middleware plugins. 

##### app.configure

```js
app.configure(Token, Value);
```

This method is a useful shortcut for registering configuration with the fusion-app. Since plugins are always
functions that return a value, if you want to register primitives in the DI system you would need to register
a function that returns the primitive. The `app.configure` allows you to register primitives without needing to
wrap them in a function. For example, the following are equivalent:

```js
app.configure(SomeToken, 'SomeValue');
app.register(SomeToken, () => 'SomeValue');
```

##### ElementToken

```js
import SomeComponent from './components/some-component';
import App, {ElementToken} from 'fusion-core';
const app = new App();
app.configure(ElementToken, <SomeComponent />);
```

The element token is used to configure the root element with the fusion app. This is typically a react/preact element.

##### RenderToken

```js
import ReactDOM from 'react-dom';
import {renderToString} from 'react-dom/server';
const render = el => __NODE__ ? renderToString(el) : ReactDOM.render(el, document.getElementById('root'));
import App, {RenderToken} from 'fusion-core';
const app = new App();
app.configure(RenderToken, render);
```

The render token is used to configure the render function with the fusion app. This is a function that knows how to
render your application on the server/browser, and allows `fusion-core` to remain agnostic of the virtualdom library.

## Plugins

Often we want to encapsulate some functionality into a single coherent package that exposes a programmatic API that can be consumed by others.
In FusionJS, this is done via a Plugin. A plugin is simply a function that returns a value. For example, the following is a valid plugin.

```js
// fusion-plugin-console-logger
const ConsoleLoggerPlugin = () => {
  return console;
}
```

In order to use plugins, you need to register them with your FusionJS application. You do this by calling
`app.register` with the plugin and a token for that plugin. The token is simply a value used to keep track of
what plugins are registered, and to allow plugins to depend on one another. Tokens also work nicely with `flow`.
You can think of Tokens like interfaces. We keep a list of standard tokens in the `fusion-tokens` repository. 
Lets finish up this logger example:

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

A middleware function is essentially a [Koa](http://koajs.com/) middleware, a function that takes two argument: a `ctx` object that has some FusionJS-specific properties, and a `next` callback function. 
However, it has some additional properties on `ctx` and can run both on the `server` and the `browser`.

```js
const middleware = (ctx, next) => {
  return next();
}
```

In FusionJS, the `next()` call represents the time when virtual dom rendering happens. Typically, you'll want to run all your logic before that, and simply have a `return next()` statement at the end of the function. Even in cases where virtual DOM rendering is not applicable, this pattern is still the simplest way to write a middleware.

In a few more advanced cases, however, you might want to do things _after_ virtual dom rendering. In that case, you can call `await next()` instead:

```js
const middleware = () => async (ctx, next) => {
  // this happens before virtual dom rendering
  const start = new Date();

  await next();

  // this happens after virtual rendeing, but before the response is sent to the browser
  console.log('timing: ', new Date() - start);
}
```

Plugins can add middlewares using the `withMiddleware` helper from `fusion-core`.
Lets try adding a middleware to our logger plugin.

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

---

### Examples

#### Implementing HTTP endpoints

A plugin can be used to implement a RESTful HTTP endpoint. To achieve this, simply run code conditionally based on the url of the request

```js

app.middleware(async (ctx, next) => {
  if (ctx.method === 'GET' && ctx.path === '/api/v1/users') {
    ctx.body = await getUsers();
  }
  return next();
});
```

#### Serialization and hydration

A plugin can be atomically responsible for serialization/deserialization of data from the server to the client.

The example below shows a plugin that grabs the project version from package.json and logs it in the browser:

```js
// plugins/version-plugin.js
import util from 'util';
import fs from 'fs';
import {html, withMiddleware} from 'fusion-core'; // html sanitization
const read = __NODE__ && util.promisify(fs.readFile);

export default withMiddleware(async (ctx, next) => {
  if (__NODE__) {
    const data = read('package.json');
    const {version} = JSON.parse(data);
    ctx.template.head.push(html`<meta id="app-version" content="${version}">`);
    return next();
  } else {
    const version = document.getElementById('app-version').content;
    console.log(`Version: ${version}`);
    return next();
  }
});
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
  app.register(VersionPlugin);
  return app;
}
```

---

### API

#### Context

Middlewares receive a `ctx` object as their first argument. This object has a property called `element` in both server and client.

- `ctx: Object`
  - `element: Object`

In the server, `ctx` also exposes the same properties as a [Koa context](http://koajs.com/#context)

- `ctx: Object`
  - `header: Object` - alias of `ctx.headers`
  - `headers: Object` - map of parsed HTTP headers
  - `method: string` - HTTP method
  - `url: string` - request URL
  - `originalUrl: string` - same as `url`, except that `url` may be modified (e.g. for url rewriting)
  - `path: string` - request pathname
  - `query: Object` - parsed querystring as an object
  - `querystring: string` - querystring without `?`
  - `host: string` - host and port
  - `hostname: string`
  - `origin: string` - request origin, including protocol and host
  - `href: string` - full URL including protocol, host and url
  - `fresh: boolean` - check for cache negotiation
  - `stale: boolean` - inverse of `fresh`
  - `socket: Socket` - request socket
  - `protocol: string`
  - `secure: boolean`
  - `ip: string` - remote IP address
  - `ips: Array<string>` - proxy IPs
  - `subdomains: Array<string>`
  - `is: (...types: ...string) => boolean` - response type check
  - `accepts: (...types: ...string) => boolean` - request MIME type check
  - `acceptsEncoding: (...encodings: ...string) => boolean`
  - `acceptsCharset: (...charsets: ...string) => boolean`
  - `acceptsLanguage: (...languages: ...string) => boolean`
  - `get: (name: String) => string` - returns a header
  - `req: http.IncomingMessage` - [Node's `request` object](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
  - `res: Response` - [Node's `response` object](https://nodejs.org/api/http.html#http_class_http_serverresponse)
  - `request: Request` - [Koa's `request` object](https://github.com/koajs/koa/blob/master/docs/api/request.md)
  - `response: Response` - [Koa's `response` object](https://github.com/koajs/koa/blob/master/docs/api/response.md)
  - `state: Object` - A state bag for Koa middlewares
  - `app: Object` - a reference to the Koa instance
  - `cookies: {get, set}`
    - `get: (name: string, options: ?Object) => string` - get a cookie
      - `name: string`
      - `options: {signed: boolean}`
    - `set: (name: string, value: string, options: ?Object)`
      - `name: string`
      - `value: string`
      - `options: Object` - Optional
        - `maxAge: number` - a number representing the milliseconds from Date.now() for expiry
        - `signed: boolean` - sign the cookie value
        - `expires: Date` - a Date for cookie expiration
        - `path: string` - cookie path, /' by default
        - `domain: string` - cookie domain
        - `secure: boolean` - secure cookie
        - `httpOnly: boolean` - server-accessible cookie, true by default
        - `overwrite: boolean` - a boolean indicating whether to overwrite previously set cookies of the same name (false by default). If this is true, all cookies set during the same request with the same name (regardless of path or domain) are filtered out of the Set-Cookie header when setting this cookie.
  - `throw: (status: number, message: ?string, properties: ?Object) => void` - throws an error
    - `status: number` - HTTP status code
    - `message: string` - error message
    - `properties: Object` - is merged to the error object
  - `assert: (value: any, status: ?number, message: ?string, properties)` - throws if value is falsy
    - `value: any`
    - `status: number` - HTTP status code
    - `message: string` - error message
    - `properties: Object` - is merged to the error object
  - `respond: boolean` - set to true to bypass Koa's built-in response handling. You should not use this flag.

Additionally, when server-side rendering a page, FusionJS sets `ctx.template` to an object with the following properties:

- `ctx: Object`
  - `template: Object`
    - `htmlAttrs: Object` - attributes for the `<html>` tag. For example `{lang: 'en-US'}` turns into `<html lang="en-US">`. Default: empty object
    - `title: string` - The content for the `<title>` tag. Default: empty string
    - `head: Array` - A list of [sanitized HTML strings](#html-sanitization). Default: empty array
    - `body: Array` - A list of [sanitized HTML strings](#html-sanitization). Default: empty array

When a request does not require a server-side render, `ctx.body` follows regular Koa semantics.

#### HTML sanitization

Default-on HTML sanitization is important for preventing security threats such as XSS attacks.

Fusion automatically sanitizes `htmlAttrs` and `title`. When pushing HTML strings to `head` or `body`, you must use the `html` template tag to mark your HTML as sanitized:

```js
import {html} from 'fusion-core';

const middleware = (ctx, next) => {
  if (ctx.element) {
    const userData = await getUserData();
    // userData can't be trusted, and is automatically escaped
    ctx.template.body.push(html`<div>${userData}</div>`)
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
ctx.template.body.push(html`<h1>Safe</h1>` + 'not safe') // will throw an error when rendered
```

Also note that only template strings can have template tags (i.e. <code>html&#x60;&lt;div&gt;&lt;/div&gt;&#x60;</code>). The following are NOT valid Javascript: `html"<div></div>"` and `html'<div></div>'`.

If you get an <code>Unsanitized html. You must use html&#x60;[your html here]&#x60;</code> error, remember to prepend the `html` template tag to your template string.

If you have already taken steps to sanitize your input against XSS and don't wish to re-sanitize it, you can use `dangerouslySetHTML(string)` to let Fusion render the unescaped dynamic string.

##### Serialization and deserialization

Here's how to serialize JSON data in the server:

```js
ctx.template.body.push(html`<script id="__MY_DATA__" type="text/plain">${JSON.stringify(data)}</script>`);
```

Here's how to deserialize it in the browser:

```js
import {unescape} from 'fusion-core';

const data = JSON.parse(unescape(document.getElementById('__MY_DATA__').innerHTML));
```