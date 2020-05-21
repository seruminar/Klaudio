import { BehaviorSubject } from 'rxjs';

export interface ICrmQueryBase<T> {
  shouldCache(cacheCondition: (item: T) => boolean): ICrmQueryBase<T>;
  getObservable: (previousValue?: T | undefined) => BehaviorSubject<T | undefined>;
}
