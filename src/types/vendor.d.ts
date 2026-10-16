declare module "canvas" {
  export class Canvas {}
  const nodeCanvas: { createCanvas: (...args: unknown[]) => Canvas };
  export default nodeCanvas;
}

declare module "jsdom" {
  export class DOMWindow {}
  export class JSDOM {
    window: DOMWindow;
    constructor(html?: string, options?: unknown);
  }
}
