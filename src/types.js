// @flow

import type {Context as KoaContext} from 'koa';
import {TokenImpl} from './create-token.js';

export type Token<T> = TokenImpl<T>;

type ExtendedKoaContext = KoaContext & {memoized: Map<Object, mixed>};

export type SSRContext = {
  element: any,
  template: {
    htmlAttrs: Object,
    title: string,
    head: Array<string>,
    body: Array<string>,
  },
} & ExtendedKoaContext;

export type Context = SSRContext | ExtendedKoaContext;

export type Middleware = (
  ctx: Context,
  next: () => Promise<void>
) => Promise<*> | void;

export type MiddlewareWithDeps<Deps> = (
  // $FlowFixMe
  Deps: $ObjMap<Deps, ExtractReturnType>
) => Middleware;

type ExtractReturnType = <V>(() => V) => V;

export type FusionPlugin<Deps, Service> = {
  deps?: Deps,
  // $FlowFixMe
  provides?: (Deps: $ObjMap<Deps & {}, ExtractReturnType>) => Service,
  middleware?: (
    // $FlowFixMe
    Deps: $ObjMap<Deps & {}, ExtractReturnType>,
    Service: Service
  ) => Middleware,
  cleanup?: (service: Service) => Promise<any>,
};

type aliaser<Token> = {
  alias: (sourceToken: Token, destToken: Token) => aliaser<*>,
};

export type cleanupFn = (thing: any) => Promise<any>;
