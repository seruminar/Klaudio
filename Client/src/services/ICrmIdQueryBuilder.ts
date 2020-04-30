import { CrmChildMap } from './CrmChildMap';
import { ICrmQueryBase } from './ICrmQueryBase';
import { ICrmQueryBuilder } from './ICrmQueryBuilder';
import { ICrmEntity } from './models/ICrmEntity';

export interface ICrmIdQueryBuilder<T extends ICrmEntity> extends ICrmQueryBase<T | undefined> {
  select: (...fields: (keyof T)[]) => ICrmIdQueryBuilder<T>;
  expand: <K extends keyof T>(
    property: K,
    select: (keyof NonNullable<T[K] extends any[] ? T[K][number] : T[K]>)[]
  ) => ICrmIdQueryBuilder<T>;
  children: <K extends keyof CrmChildMap>(childName: K) => ICrmQueryBuilder<CrmChildMap[K]>;
}
