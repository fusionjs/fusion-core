/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {escape, consumeSanitizedHTML} from '../sanitization';

export function renderStreaming(ctx){
  const multi_stream = require('multistream');
  const string_stream = require('string-to-stream');
  ctx.body = multi_stream
  ([
    string_stream(header(ctx)),
    typeof ctx.rendered === 'string' ? string_stream(ctx.rendered) : ctx.rendered,
    string_stream(footer(ctx))
  ])
};

export function renderNonStreaming(ctx){  
  ctx.body = [
    header(ctx),
    ctx.rendered,
    footer(ctx)
  ].join('');
};

function header(ctx){
  const {htmlAttrs, bodyAttrs, title, head} = ctx.template;
  const safeAttrs = Object.keys(htmlAttrs)
    .map(attrKey => {
      return ` ${escape(attrKey)}="${escape(htmlAttrs[attrKey])}"`;
    })
    .join('');

  const safeBodyAttrs = Object.keys(bodyAttrs)
    .map(attrKey => {
      return ` ${escape(attrKey)}="${escape(bodyAttrs[attrKey])}"`;
    })
    .join('');

  const safeTitle = escape(title);
  // $FlowFixMe
  const safeHead = head.map(consumeSanitizedHTML).join('');
  // $FlowFixMe

  const preloadHintLinks = getPreloadHintLinks(ctx);
  const coreGlobals = getCoreGlobals(ctx);
  const chunkScripts = getChunkScripts(ctx);
  const bundleSplittingBootstrap = [
    preloadHintLinks,
    coreGlobals,
    chunkScripts,
  ].join('');

  return `
    <!doctype html>
    <html${safeAttrs}>
    <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    ${bundleSplittingBootstrap}${safeHead}
    </head>
    <body${safeBodyAttrs}>
  `;
};
    
function footer(ctx) {
  const {body} = ctx.template;
  const safeBody = body.map(consumeSanitizedHTML).join('');
  return `${safeBody}</body></html>`;
};

function getCoreGlobals(ctx) {
  const {webpackPublicPath, nonce} = ctx;

  return [
    `<script nonce="${nonce}">`,
    `window.performance && window.performance.mark && window.performance.mark('firstRenderStart');`,
    `__ROUTE_PREFIX__ = ${JSON.stringify(ctx.prefix)};`, // consumed by ./client
    `__WEBPACK_PUBLIC_PATH__ = ${JSON.stringify(webpackPublicPath)};`, // consumed by fusion-clientries/client-entry
    `</script>`,
  ].join('');
}

function getUrls({chunkUrlMap, webpackPublicPath}, chunks) {
  return chunks.map(id => {
    let url = chunkUrlMap.get(id).get('es5');
    if (webpackPublicPath.endsWith('/')) {
      url = webpackPublicPath + url;
    } else {
      url = webpackPublicPath + '/' + url;
    }
    return {id, url};
  });
}

function getChunkScripts(ctx) {
  const webpackPublicPath = ctx.webpackPublicPath || '';
  // cross origin is needed to get meaningful errors in window.onerror
  const crossOrigin = webpackPublicPath.startsWith('https://')
    ? ' crossorigin="anonymous"'
    : '';
  const sync = getUrls(ctx, ctx.syncChunks).map(({url}) => {
    return `<script nonce="${
      ctx.nonce
    }" defer${crossOrigin} src="${url}"></script>`;
  });
  const preloaded = getUrls(ctx, ctx.preloadChunks).map(({id, url}) => {
    return `<script nonce="${
      ctx.nonce
    }" defer${crossOrigin} src="${url}"></script>`;
  });
  return [...preloaded, ...sync].join('');
}

function getPreloadHintLinks(ctx) {
  const chunks = [...ctx.preloadChunks, ...ctx.syncChunks];
  const hints = getUrls(ctx, chunks).map(({url}) => {
    return `<link rel="preload" href="${url}" as="script" />`;
  });
  return hints.join('');
}
