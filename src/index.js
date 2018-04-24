/* @flow */
import type {Context, FusionPlugin, Middleware, Token} from './types.js';

import BaseApp from './base-app';
import serverApp from './server-app';
import clientApp from './client-app';
import getEnv from './get-env.js';

export default (__BROWSER__ ? clientApp() : serverApp());

export {compose} from './compose.js';
export {memoize} from './memoize';

// sanitization API
export {
  html,
  dangerouslySetHTML,
  consumeSanitizedHTML,
  escape,
  unescape,
} from './sanitization';

// Virtual modules
export {
  assetUrl,
  chunkId,
  syncChunkIds,
  syncChunkPaths,
} from './virtual/index.js';

export {RenderToken, ElementToken, SSRDeciderToken} from './tokens';
export {createPlugin} from './create-plugin';
export {createToken} from './create-token';
export {getEnv};

type FusionApp = typeof BaseApp;
declare export default typeof BaseApp;
export type {Context, FusionApp, FusionPlugin, Middleware, Token};
