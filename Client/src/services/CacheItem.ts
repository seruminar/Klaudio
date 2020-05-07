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
    refresh: (observable: BehaviorSubject<T>) => Promise<void>,
    remove: () => void
  ) {
    this.observable = observable;

    if (duration > 0) {
      const timeout = () => {
        if (this.observable.observers.length > 0) {
          refresh(this.observable);
          this.refresh = setTimeout(timeout, duration * 1000);
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
