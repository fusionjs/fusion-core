/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import App from '../index';
import {compose} from '../compose.js';

test('context composition', async t => {
  const element = 'hello';
  const render = el => `<h1>${el}</h1>`;
  const wrap = (ctx, next) => {
    ctx.element = ctx.element.toUpperCase();
    return next();
  };

  const context = {
    headers: {accept: 'text/html'},
    path: '/',
    element: null,
    rendered: null,
    render: null,
    type: null,
    body: null,
  };

  const app = new App(element, render);
  app.middleware(wrap);
  try {
    app.resolve();
    const middleware = compose(app.plugins);
    // $FlowFixMe
    await middleware(context, () => Promise.resolve());
    // $FlowFixMe
    t.equals(typeof context.rendered, 'string', 'renders');
    // $FlowFixMe
    t.ok(context.rendered.includes('<h1>HELLO</h1>'), 'has expected html');
  } catch (e) {
    t.ifError(e, 'something went wrong');
  }
  t.end();
});
