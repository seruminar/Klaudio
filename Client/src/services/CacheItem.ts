import { BehaviorSubject } from 'rxjs';

import { ICacheItem } from './ICacheItem';

export class CacheItem<T> implements ICacheItem {
  observable: BehaviorSubject<T>;
  dependencies: string[];

  refresh: (callBack?: () => void) => void;
  timeout: NodeJS.Timeout | undefined;

  constructor(
    observable: BehaviorSubject<T>,
    duration: number,
    dependencies: string[],
    refresh: (observable: BehaviorSubject<T>) => Promise<T>,
    remove: () => void,
    shouldCache: (next: T) => boolean
  ) {
    this.observable = observable;
    this.dependencies = dependencies;
    this.refresh = (callBack?: () => void) =>
      refresh(this.observable).then((next) => {
        if (shouldCache(next) && callBack) {
          this.timeout = setTimeout(callBack, duration * 1000);
        }
      });

    if (duration > 0) {
      const refreshOrRemove = () => {
        if (this.observable.observers.length) {
          this.refresh(refreshOrRemove);
          return;
        }

        if (this.timeout) {
          clearTimeout(this.timeout);
          remove();
        }
      };

      this.timeout = setTimeout(refreshOrRemove, duration * 1000);
    }
  }
}
