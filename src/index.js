/* @flow */
import serverApp from './server-app';
import clientApp from './client-app';
// $FlowFixMe
export default (__BROWSER__ ? clientApp() : serverApp());

export {compose} from './compose.js';
export {withMiddleware} from './with-middleware';
export {withDependencies} from './with-dependencies';
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

export {RenderToken, ElementToken} from './tokens';
