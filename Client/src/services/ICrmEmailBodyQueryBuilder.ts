import { BehaviorSubject } from 'rxjs';

export interface ICrmEmailBodyQueryBuilder {
  id: (id: Guid) => ICrmEmailBodyQueryBuilder;
  getObservable: () => BehaviorSubject<string | undefined>;
}
