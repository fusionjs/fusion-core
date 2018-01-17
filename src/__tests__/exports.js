import test from 'tape-cup';
import App, {
  html,
  dangerouslySetHTML,
  consumeSanitizedHTML,
  escape,
  unescape,
  compose,
  memoize,
  assetUrl,
  chunkId,
  syncChunkIds,
  syncChunkPaths,
  RenderToken,
  ElementToken,
  createPlugin,
} from '../index.js';

test('fusion-core api', t => {
  t.ok(App, 'exports App as default');
  if (__NODE__) {
    t.ok(html, 'exports html');
    t.ok(dangerouslySetHTML, 'exports dangerouslySetHTML');
    t.ok(consumeSanitizedHTML, 'exports consumeSanitizedHTML');
    t.ok(escape, 'exports escape');
  } else {
    t.notok(html, 'does not export html in the browser');
    t.notok(
      dangerouslySetHTML,
      'does not export dangerouslySetHTML in browser'
    );
    t.notok(
      consumeSanitizedHTML,
      'does not export consumeSanitizedHTML in browser'
    );
    t.notok(escape, 'does not export escape in browser');
  }
  t.ok(unescape, 'exports unescape');
  t.ok(compose, 'exports compose');
  t.ok(memoize, 'exports memoize');
  t.ok(assetUrl, 'exports assetUrl');
  t.ok(chunkId, 'exports chunkId');
  t.ok(syncChunkIds, 'exports syncChunkIds');
  t.ok(syncChunkPaths, 'exports syncChunkPaths');
  t.ok(RenderToken, 'exports RenderToken');
  t.ok(ElementToken, 'exports ElementToken');
  t.ok(createPlugin, 'exports createPlugin');
  t.end();
});
