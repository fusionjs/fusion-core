/* @flow */
import type {Context as KoaContext} from 'koa';
declare var __NODE__: Boolean;
declare var __BROWSER__: Boolean;

declare type SSRContext = {
  element: any,
  template: {
    htmlAttrs: Object,
    title: string,
    head: Array<string>,
    body: Array<string>,
  },
} & KoaContext;
declare type ContextType = SSRContext | KoaContext;
declare type FusionPlugin<Dependencies, Service> = (Dependencies) => Service;
declare type MiddlewareType = (
  ctx: ContextType,
  next: () => Promise<void>
) => Promise<*>;

declare type MiddlewarePlugin = {
  __middleware__: MiddlewareType,
};

declare class FusionApp {
  // TODO: More specific types
  constructor<Element>(element: Element, render: (Element) => any): FusionApp;
  registered: Map<any, any>;
  plugins: Array<any>;
  renderer: any;
  // register(middleware: MiddlewarePlugin): void;
  register<A, B>(Plugin: FusionPlugin<A, B>): void;
  register<A, B>(token: B, Plugin: FusionPlugin<A, B>): void;
  configure<A: string>(token: A, val: string): void;
  configure<A: number>(token: A, val: number): void;
  configure<A: Object>(token: A, val: $Exact<A>): void;
  middleware<Deps>(deps: Deps, middleware: (Deps) => MiddlewareType): void;
  middleware(middleware: MiddlewareType): void;
  callback(): () => Promise<void>;
  resolve(): void;
}

declare type PluginLoader<Dependencies, Service> = (
  init: FusionPlugin<Dependencies, Service>
) => FusionPlugin<Dependencies, Service>;

declare function withMiddleware(middleware: MiddlewareType): MiddlewarePlugin;

// eslint-disable-next-line no-redeclare
declare function withMiddleware<Service>(
  middleware: MiddlewareType,
  service: Service
): Service;

declare export function withDependencies<Dependencies, Service>(
  deps: Dependencies
): PluginLoader<Dependencies, Service>;
