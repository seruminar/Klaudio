import { BehaviorSubject } from 'rxjs';

import { CrmApiResponse } from './CrmApiResponse';

export interface ICrmQueryBase<T> {
  getObservable: (previousValue?: CrmApiResponse<T> | undefined) => BehaviorSubject<CrmApiResponse<T> | undefined>;
}
