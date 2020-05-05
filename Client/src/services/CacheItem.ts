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
      this.refresh = setInterval(() => {
        if (this.observable.observers.length > 0) {
          refresh(this.observable);
          return;
        }

        if (this.refresh) {
          clearInterval(this.refresh);
          remove();
        }
      }, duration * 1000);
    }
  }
}
