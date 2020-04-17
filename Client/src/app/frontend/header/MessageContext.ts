import { createContext, ReactNode } from 'react';

import { SnackType, UpdateStream } from './snacks';

export type ShowInfoHandler = (content: ReactNode, timeout?: number, type?: SnackType) => void;

export type ShowInfoUntilHandler = <T>(content: ReactNode, isComplete: Promise<T>, update?: UpdateStream) => void;

export type ShowErrorHandler = (error: any, timeout?: number) => void;

export interface IMessageContext {
  showSuccess: ShowInfoHandler;
  showInfo: ShowInfoHandler;
  showInfoUntil: ShowInfoUntilHandler;
  showWarning: ShowErrorHandler;
  showError: ShowErrorHandler;
}

const defaultShowInfoHandler: ShowInfoHandler = (content, _timeout?, _type?) => console.log(content);
const defaultShowInfoUntilHandler: ShowInfoUntilHandler = (content, _isComplete, _update) => console.log(content);

export const MessageContext = createContext<IMessageContext>({
  showSuccess: defaultShowInfoHandler,
  showInfo: defaultShowInfoHandler,
  showInfoUntil: defaultShowInfoUntilHandler,
  showWarning: defaultShowInfoHandler,
  showError: defaultShowInfoHandler
});
