import { ICrmIdQueryBuilder } from './ICrmIdQueryBuilder';
import { ICrmApiResponse } from './models/ICrmApiResponse';
import { ICrmEntity } from './models/ICrmEntity';

export interface ICrmQueryBuilder<T extends ICrmEntity> extends PromiseLike<ICrmApiResponse & { value: T[] }> {
  id: (id: Guid) => ICrmIdQueryBuilder<T>;
  top: (topQuery: number) => ICrmQueryBuilder<T>;
  select: (...fields: (keyof T)[]) => ICrmQueryBuilder<T>;
  filter: (filterQuery: string) => ICrmQueryBuilder<T>;
  orderBy: (orderByQuery: string) => ICrmQueryBuilder<T>;
  expand: <K extends keyof T>(property: K, select: (keyof NonNullable<T[K] extends any[] ? T[K][number] : T[K]>)[]) => ICrmQueryBuilder<T>;
}
