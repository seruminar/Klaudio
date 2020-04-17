declare module 'megadraft' {
import {
    CompositeDecorator,
    DraftInlineStyleType,
    EditorProps,
    EditorState,
    RawDraftContentState
} from 'draft-js';
import defaultDecorator from 'megadraft/decorators/defaultDecorator';
import * as plugins from 'megadraft/plugins';
import { Component, ComponentType } from 'react';

    export const plugins: IPlugin[];

  export const actions: IAction[];

  //   export DraftJS: _draftJs["default"],
  // export insertDataBlock: _insertDataBlock["default"],
  // export Media: _Media["default"],
  export interface IMegadraftEditorProps extends EditorProps {
    plugins?: IPlugin[];
    onAction?: () => void;
    sidebarRendererFn?: FC<ISidebarProps>;
    Toolbar?: FC<IToolbarProps>;
    actions?: IAction[];
    keyBindings?: { name: string; isKeyBound: (event: any) => boolean; action: () => void }[];
    handleBlockNotFound?: (block: any) => { blockComponent: ComponentType };
    softNewLines?: boolean;
    resetStyleNewLine?: boolean;
    blocksWithoutStyleReset?: string[];
    maxSidebarButtons?: number;
    modalOptions?: { width: number; height: number };
    shouldDisplayToolbarFn?: (props: IToolbarProps) => boolean;
    language?: string;
    i18n?: { [key: string]: string };

    hideSidebarOnBlur?: boolean;
    movableBlocks?: boolean;
  }

  export interface IToolbarProps {
    i18n: { [key: string]: string };
    editor: Element;
    draft: Element;
    editorState: EditorState;
    editorHasFocus: boolean;
    readOnly: boolean;
    onChange: (editorState: EditorState) => void;
    actions?: { type: string; label: string; style: string; icon: ComponentType }[];
    entityInputs: ComponentType[];
    shouldDisplayToolbarFn?: (props: IToolbarProps) => boolean;
  }

  export interface ISidebarProps {
    i18n: { [key: string]: string };
    editorState: EditorState;
    onChange: (editorState: EditorState) => void;
    plugins: IPlugin[];
    maxSidebarButtons: number;
    editorHasFocus: any;
    hideSidebarOnBlur: boolean;
    modalOptions: any;
  }

  export interface IPlugin {
    title: string;
    type: string;
    buttonComponent: ComponentType;
    blockComponent: ComponentType;
  }

  export interface IAction {
    type: 'entity' | 'block' | 'inline' | 'separator';
    label?: string;
    style?: DraftInlineStyleType | string;
    entity?: string;
    icon?: ComponentType;
  }

  export class MegadraftEditor extends Component<IMegadraftEditorProps> {}

  export const MegadraftIcons: {
    BoldIcon: ComponentType;
    ItalicIcon: ComponentType;
    ULIcon: ComponentType;
    OLIcon: ComponentType;
    H2Icon: ComponentType;
    BlockQuoteIcon: ComponentType;
    LinkIcon: ComponentType;
    CrossIcon: ComponentType;
    ImageIcon: ComponentType;
    VideoIcon: ComponentType;
    EditIcon: ComponentType;
    DeleteIcon: ComponentType;
    CropIcon: ComponentType;
    MediaBigIcon: ComponentType;
    MediaMediumIcon: ComponentType;
    MediaSmallIcon: ComponentType;
    DropdownArrow: ComponentType;
    ErrorIcon: ComponentType;
    UnlinkIcon: ComponentType;
    CloseIcon: ComponentType;
    MoreIcon: ComponentType;
  };
  // export MegadraftMediaMessage: _MediaMessage["default"],
  // export MegadraftPlugin: MegadraftPlugin,
  // export Sidebar: _Sidebar["default"],
  // export Toolbar: _Toolbar["default"],

  export function editorStateFromRaw(
    rawContent: RawDraftContentState | null,
    decorator: CompositeDecorator = defaultDecorator
  ): EditorState;

  // export editorStateToJSON: utils.editorStateToJSON,
  // export createTypeStrategy: utils.createTypeStrategy
}
