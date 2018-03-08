import uuidv4 from 'uuid/v4';
import UAParser from 'ua-parser-js';
import getEnv from '../get-env.js';

const envVars = getEnv();

export default function middleware(ctx, next) {
  // env vars
  ctx.rootDir = envVars.rootDir;
  ctx.env = envVars.env;
  ctx.prefix = envVars.prefix;
  ctx.assetPath = envVars.assetPath;
  ctx.cdnUrl = envVars.cdnUrl;

  // webpack-related things
  ctx.preloadChunks = [];
  ctx.webpackPublicPath =
    ctx.webpackPublicPath || envVars.cdnUrl || envVars.assetPath;

  // these are set by fusion-cli, however since fusion-cli plugins are not added when
  // running simulation tests, it is good to default them here
  ctx.syncChunks = ctx.syncChunks || [];
  ctx.chunkUrlMap = ctx.chunkUrlMap || new Map();

  // fusion-specific things
  ctx.nonce = uuidv4();
  ctx.useragent = new UAParser(ctx.headers['user-agent']).getResult();
  ctx.element = null;
  ctx.rendered = null;

  return next();
}
