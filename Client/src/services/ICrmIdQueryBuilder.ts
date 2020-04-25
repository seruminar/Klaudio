import { BehaviorSubject } from 'rxjs';

import { CrmChildMap } from './CrmChildMap';
import { ICrmQueryBuilder } from './ICrmQueryBuilder';
import { ICrmApiResponse } from './models/ICrmApiResponse';
import { ICrmEntity } from './models/ICrmEntity';

export interface ICrmIdQueryBuilder<T extends ICrmEntity> {
  select: (...fields: (keyof T)[]) => ICrmIdQueryBuilder<T>;
  expand: <K extends keyof T>(
    property: K,
    select: (keyof NonNullable<T[K] extends any[] ? T[K][number] : T[K]>)[]
  ) => ICrmIdQueryBuilder<T>;
  children: <K extends keyof CrmChildMap>(childName: K) => ICrmQueryBuilder<CrmChildMap[K]>;
  getObservable: () => BehaviorSubject<(ICrmApiResponse & T) | undefined>;
}
