import serverApp from './server-app';
import clientApp from './client-app';

export {compose} from './compose.js';

// sanitization API
export {
  html,
  dangerouslySetHTML,
  consumeSanitizedHTML,
  escape,
  unescape,
} from './sanitization';

export default (__BROWSER__ ? clientApp() : serverApp());

// Virtual modules
export {
  assetUrl,
  chunkId,
  syncChunkIds,
  syncChunkPaths,
} from './virtual/index.js';
