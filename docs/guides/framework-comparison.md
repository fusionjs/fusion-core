# Framework comparison

FusionJS is a web framework developed by Uber. It's comprised of a CLI, a webpack/babel transpilation pipeline, a Koa server and a plugin-based isomorphic runtime architecture.

In addition to these core areas, the FusionJS team provides several plugins for various things: from React and Redux to translations and CSRF protection. This makes FusionJS a one-stop shop for full stack development, while at the same time making it easy to keep bundle size small by allowing developers to only include what they need.

Here is how FusionJS compares to some popular frameworks and libraries:

### React

React is a popular and mature library for implementing component-based UIs. FusionJS can be used seamlessly with React: JSX, ES2017, hot module reloading, server-side rendering, etc all work out of the box. In addition, the FusionJS core is view-layer agnostic and we are planning on adding plugins for Preact in the future.

Through plugins, FusionJS provides various extra features on top of vanilla React: it provides an easy way to do code splitting, it supports async server-side rendering, it allows plugins to automatically installs providers when needed, etc.

### Express

Express is the most popular HTTP server framework for Node.js. While it is agnostic of rendering libraries (being compatible with libraries such as pug or handlebars), it's generally not as trivial to integrate to modern React tooling (e.g. HMR) unless you adopt a more opinionated framework on top of Express.

Both Express and FusionJS can be used as a Node.js server and both can be composed via middlewares. The major difference is that FusionJS uses Koa.js middlewares. Koa uses a more modern async/await based middleware architecture, which gives a better stack trace/debugging experience.