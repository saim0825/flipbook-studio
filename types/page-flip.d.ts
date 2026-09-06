declare module "page-flip" {
  export class PageFlip {
    constructor(element: HTMLElement, settings: Record<string, unknown>);
    loadFromHTML(elements: HTMLElement[]): void;
    on(event: "flip", callback: (event: { data: number }) => void): void;
  }
}
