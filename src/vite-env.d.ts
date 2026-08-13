/// <reference types="vite/client" />

declare module 'katex/dist/katex.mjs' {
  interface KatexOptions {
    displayMode?: boolean;
    throwOnError?: boolean;
    strict?: boolean | 'ignore' | 'warn' | 'error';
    trust?: boolean;
    output?: 'html' | 'mathml' | 'htmlAndMathml';
  }

  const katex: {
    render(expression: string, element: HTMLElement, options?: KatexOptions): void;
    renderToString(expression: string, options?: KatexOptions): string;
  };

  export default katex;
}
