/* @flow */
import serverApp from './server-app';
import clientApp from './client-app';

export {compose} from './compose.js';
export {withMiddleware} from './with-middleware';
export {withDependencies} from './with-dependencies';

// sanitization API
export {
  html,
  dangerouslySetHTML,
  consumeSanitizedHTML,
  escape,
  unescape,
} from './sanitization';

// $FlowIgnore
export default (__BROWSER__ ? clientApp() : serverApp());

// Virtual modules
export {
  assetUrl,
  chunkId,
  syncChunkIds,
  syncChunkPaths,
} from './virtual/index.js';
