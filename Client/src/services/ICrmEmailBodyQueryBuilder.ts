import { ICrmQueryBase } from './ICrmQueryBase';

export interface ICrmEmailBodyQueryBuilder extends ICrmQueryBase<string | undefined> {
  id: (id: Guid) => ICrmEmailBodyQueryBuilder;
}
