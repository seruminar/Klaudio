declare module "squire-rte/build/squire.js" {
  type EventType = "select" | "cursor" | "input" | "keyup" | "pathChange";

  type ElementDescriptor = { tag: string; attributes?: {} };

  type LeafNodeNames = {
    BR: 1;
    HR: 1;
    IFRAME: 1;
    IMG: 1;
    INPUT: 1;
  };

  type SquireConfig = {
    blockTag: "DIV";
    blockAttributes: {} | null;
    tagAttributes: {
      blockquote: null;
      ul: null;
      ol: null;
      li: null;
      a: null;
    };
    classNames: {
      colour: "colour";
      fontFamily: "font";
      fontSize: "size";
      highlight: "highlight";
    };
    leafNodeNames: LeafNodeNames;
    undo: {
      documentSizeThreshold: -1; // -1 means no threshold
      undoLimit: -1; // -1 means no limit
    };
    isInsertedHTMLSanitized: boolean;
    isSetHTMLSanitized: boolean;
    sanitizeToDOMFragment: (html: string, isPaste: boolean, self: Squire) => DocumentFragment;
    willCutCopy: null;
    addLinks: boolean;
  };

  declare class Squire {
    constructor(root: HTMLElement, config?: Partial<SquireConfig>): Squire;
    _config: SquireConfig;
    getRoot(): HTMLElement;
    getDocument(): Document;
    addEventListener(type: EventType, handler: () => void): Squire;
    setKeyHandler(key: string, fn: (this: Squire, event: KeyboardEvent, range: Range) => void): Squire;
    focus(): Squire;
    getPath(): string;
    getSelection(): Range;
    setSelection(range: Range): Squire;
    createRange(range: Range | number, startOffset?: number, endContainer?: Node, endOffset?: number): Range;
    hasFormat(tag: string, attributes?: {}, range?: Range): boolean;
    setHTML(html: string): Squire;
    insertHTML(html: string, isPaste?: boolean): Squire;
    changeFormat(add: ElementDescriptor | null, remove: ElementDescriptor | null, range?: Range, partial?: boolean);
    removeAllFormatting(): Squire;
    moveCursorToStart(): Squire;
    undo(): Squire;
    redo(): Squire;
    bold(): Squire;
    removeBold(): Squire;
    italic(): Squire;
    removeItalic(): Squire;
    underline(): Squire;
    removeUnderline(): Squire;
    makeLink(url: string, attributes?: {}): Squire;
    removeLink(): Squire;
    strikethrough(): Squire;
    removeStrikethrough(): Squire;
    subscript(): Squire;
    removeSubscript(): Squire;
    superscript(): Squire;
    removeSuperscript(): Squire;
    makeOrderedList(): Squire;
    makeUnorderedList(): Squire;
    removeList(): Squire;
    increaseListLevel(): Squire;
    decreaseListLevel(): Squire;
    increaseQuoteLevel(): Squire;
    decreaseQuoteLevel(): Squire;
    code(): Squire;
    removeCode(): Squire;
    setTextColour(colour: string): Squire;
    setHighlightColour(colour: string): Squire;
  }

  export = Squire;
}
