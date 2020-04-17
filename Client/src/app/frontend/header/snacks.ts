import { ReactNode } from 'react';
import { Observable } from 'rxjs';

export type SnackType = 'success' | 'info' | 'warning' | 'error' | 'update';

export interface ISnack {
  content: ReactNode;
  type: SnackType;
  update?: UpdateStream;
  key?: number;
}

export interface IUpdateMessage {
  current: number;
  total: number;
}

export type UpdateStream = Observable<IUpdateMessage>;

export const showSnack = async <T>(
  content: ReactNode,
  type: SnackType,
  addSnack: (snack: ISnack) => void,
  isComplete: Promise<T>,
  hideSnack: (snack: ISnack) => void,
  updateStream?: Observable<IUpdateMessage>
) => {
  const newSnack: ISnack = {
    content,
    type,
    update: updateStream,
    key: Math.random()
  };

  addSnack(newSnack);

  await isComplete;

  hideSnack(newSnack);
};
