import { Wretcher } from 'wretch';

import { CrmEndpoint } from './CrmEndpoint';
import { CrmQuery } from './CrmQuery';
import { ICrmQueryBuilder } from './ICrmQueryBuilder';
import { ICrmEntity } from './models/ICrmEntity';

export class CrmChildQuery<T extends ICrmEntity> extends CrmQuery<T> implements ICrmQueryBuilder<T> {
  private parentId: Guid;

  private childName: string;

  constructor(type: keyof CrmEndpoint, cacheDuration: number, id: Guid, childName: string) {
    super(type, cacheDuration);

    this.parentId = id;
    this.childName = childName;
  }

  protected getRequest(request: Wretcher): Wretcher {
    request = request.url(`(${this.parentId})/${this.childName}`);

    return super.getRequest(request);
  }

  protected getDependencies() {
    return [this.type, this.childName];
  }
}
