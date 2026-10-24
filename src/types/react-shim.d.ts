/**
 * Minimal React type declarations.
 * The official @types/react package could not be installed in the build
 * environment (npm registry blocked), so the parts of the React 19 API this app
 * uses are declared here. Engine, game and store modules are fully type-checked;
 * JSX element props are intentionally loose.
 */
declare module 'react' {
  export type ReactNode = ReactElement | string | number | boolean | null | undefined | ReactNode[];
  export interface ReactElement { type: unknown; props: unknown; key: string | null }
  export type FC<P = {}> = (props: P & { children?: ReactNode }) => ReactNode;
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prev: S) => S);
  export interface RefObject<T> { current: T }
  export interface MutableRefObject<T> { current: T }
  export type ChangeEvent<T = any> = { target: T & { value: string; checked: boolean }; currentTarget: T };
  export type KeyboardEvent<T = any> = { key: string; target: T; preventDefault(): void; shiftKey: boolean; currentTarget: T };
  export type FormEvent<T = any> = { preventDefault(): void; currentTarget: T };
  export type MouseEvent<T = any> = { preventDefault(): void; stopPropagation(): void; currentTarget: T };
  export type CSSProperties = Record<string, string | number | undefined>;

  export function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useLayoutEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useCallback<T extends (...args: any[]) => any>(cb: T, deps: readonly unknown[]): T;
  export function useRef<T>(initial: T): MutableRefObject<T>;
  export function useRef<T>(initial: T | null): RefObject<T | null>;
  export function useId(): string;
  export function useContext<T>(ctx: Context<T>): T;
  export function useSyncExternalStore<T>(subscribe: (cb: () => void) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T): T;
  export function useReducer<S, A>(reducer: (s: S, a: A) => S, init: S): [S, Dispatch<A>];
  export function lazy<T extends (props: any) => ReactNode>(load: () => Promise<{ default: T }>): T;
  export interface Context<T> { Provider: FC<{ value: T }>; _t?: T }
  export function createContext<T>(value: T): Context<T>;
  export const Fragment: FC;
  export const StrictMode: FC;
  export const Suspense: FC<{ fallback?: ReactNode }>;
  export class Component<P = {}, S = {}> {
    constructor(props: P);
    props: P & { children?: ReactNode };
    state: S;
    setState(s: Partial<S>): void;
    render(): ReactNode;
  }
  const React: { createElement: (...a: unknown[]) => ReactElement };
  export default React;
}

declare module 'react/jsx-runtime' {
  export const jsx: (...a: unknown[]) => unknown;
  export const jsxs: (...a: unknown[]) => unknown;
  export const Fragment: unknown;
}

declare module 'react-dom/client' {
  export function createRoot(el: Element): { render(node: unknown): void; unmount(): void };
}

interface LooseHTMLProps {
  [prop: string]: any;
  onClick?: (e: any) => void;
  onChange?: (e: any) => void;
  onKeyDown?: (e: any) => void;
  onToggle?: (e: any) => void;
  onClose?: (e: any) => void;
  onCancel?: (e: any) => void;
  onSubmit?: (e: any) => void;
  onInput?: (e: any) => void;
  onBlur?: (e: any) => void;
  onFocus?: (e: any) => void;
}

declare namespace JSX {
  type Element = import('react').ReactElement;
  type ElementType = string | ((props: any) => import('react').ReactNode) | (new (props: any) => any);
  interface ElementClass { render(): import('react').ReactNode }
  interface ElementChildrenAttribute { children: {} }
  interface IntrinsicAttributes { key?: string | number | null }
  interface IntrinsicElements { [elem: string]: LooseHTMLProps }
}
declare module '*.css';
