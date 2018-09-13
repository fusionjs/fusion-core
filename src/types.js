/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Context as KoaContext} from 'koa';

export type Token<T> = {
  (): T,
  optional: () => void | T,
};

type ExtendedKoaContext = KoaContext & {memoized: Map<Object, mixed>};

export type SanitizedHTMLWrapper = Object;

export type SSRContext = {
  element: any,
  template: {
    htmlAttrs: Object,
    title: string,
    head: Array<SanitizedHTMLWrapper>,
    body: Array<SanitizedHTMLWrapper>,
    bodyAttrs: {[string]: string},
  },
} & ExtendedKoaContext;

export type Context = SSRContext | ExtendedKoaContext;

export type Middleware = (
  ctx: Context,
  next: () => Promise<void>
) => Promise<*>;

export type MiddlewareWithDeps<Deps> = (
  Deps: $ObjMap<Deps, ExtractReturnType>
) => Middleware;

export type ExtractReturnType = <V>(() => V) => V;

export type FusionPlugin<Deps, Service> = {|
  __plugin__: boolean,
  deps?: Deps,
  provides?: (Deps: $ObjMap<Deps & {}, ExtractReturnType>) => Service,
  middleware?: (
    Deps: $ObjMap<Deps & {}, ExtractReturnType>,
    Service: Service
  ) => Middleware,
  cleanup?: (service: Service) => Promise<void>,
|};

export type SSRDecider = Context => boolean;

export type aliaser<TToken> = {
  alias: (sourceToken: TToken, destToken: TToken) => aliaser<TToken>,
};

export type cleanupFn = (thing: any) => Promise<void>;

export type SSRBodyTemplate = Context => $PropertyType<Context, 'body'>;
