import { BehaviorSubject, SubscriptionLike } from 'rxjs';

export interface ICacheItem {
  observable: SubscriptionLike;
  refresh: NodeJS.Timeout | undefined;
}

export class CacheItem<T> {
  observable: BehaviorSubject<T>;

  refresh: NodeJS.Timeout | undefined;

  constructor(
    observable: BehaviorSubject<T>,
    duration: number,
    refresh: (observable: BehaviorSubject<T>) => Promise<T>,
    remove: () => void,
    shouldCache: (next: T) => boolean
  ) {
    this.observable = observable;

    if (duration > 0) {
      const timeout = () => {
        if (this.observable.observers.length) {
          refresh(this.observable).then((next) => {
            if (shouldCache(next)) {
              this.refresh = setTimeout(timeout, duration * 1000);
            }
          });
          return;
        }

        if (this.refresh) {
          clearTimeout(this.refresh);
          remove();
        }
      };

      this.refresh = setTimeout(timeout, duration * 1000);
    }
  }
}
