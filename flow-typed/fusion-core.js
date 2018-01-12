/* @flow */
import type {Context as KoaContext} from 'koa';

// TODO(#61): Type checking here isn't very good, as it allows you to
// alias tokens that are not of the exact same type.
type aliaser<Token> = {
  alias: (sourceToken: Token, destToken: Token) => aliaser<*>,
};

declare module 'fusion-core' {
  declare var __NODE__: Boolean;
  declare var __BROWSER__: Boolean;
  declare export type SSRContext = {
    element: any,
    template: {
      htmlAttrs: Object,
      title: string,
      head: Array<string>,
      body: Array<string>,
    },
  } & KoaContext;
  declare export type Context = SSRContext | KoaContext;
  declare export type FusionPlugin<Deps, Service> = {
    deps?: Deps,
    provides?: Deps => Service,
    middleware?: (Deps, Service) => Middleware,
  };
  declare export type Middleware = (
    ctx: Context,
    next: () => Promise<void>
  ) => Promise<*>;
  declare type MemoizeFn<A> = (ctx: Context) => A;
  declare export function memoize<A>(fn: MemoizeFn<A>): MemoizeFn<A>;
  declare class FusionApp {
    constructor<Element>(element: Element, render: (Element) => any): FusionApp;
    registered: Map<any, any>;
    plugins: Array<any>;
    renderer: any;
    register<A, B>(Plugin: FusionPlugin<A, B>): aliaser<*>;
    register<A, B>(token: B, Plugin: FusionPlugin<A, B>): aliaser<*>;
    register<A: string>(token: A, val: string): aliaser<*>;
    register<A: number>(token: A, val: number): aliaser<*>;
    register<A: Object>(token: A, val: $Exact<A>): aliaser<*>;
    middleware<Deps>(deps: Deps, middleware: (Deps) => Middleware): void;
    middleware(middleware: Middleware): void;
    callback(): () => Promise<void>;
    resolve(): void;
  }
  declare export default typeof FusionApp
  declare export function createPlugin<Deps, Service>(
    options: FusionPlugin<Deps, Service>
  ): FusionPlugin<Deps, Service>;
  declare export function html(
    strings: Array<string>,
    ...expressions: Array<string>
  ): Object;
  declare export function consumeSanitizedHTML(str: string): string;
  declare export function dangerouslySetHTML(html: string): Object;
  declare export function escape(str: string): string;
  declare export function unescape(str: string): string;
  declare export var RenderToken: (Element: any) => string;
  declare export var ElementToken: any;
}
