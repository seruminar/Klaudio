import { BehaviorSubject } from 'rxjs';

export interface ICrmQueryBase<T> {
  getObservable: (previousValue?: T | undefined) => BehaviorSubject<T | undefined>;
}
