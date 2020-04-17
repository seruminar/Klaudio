import { Wretcher } from 'wretch';

import { CrmEndpoint } from './CrmEndpoint';
import { CrmQuery } from './CrmQuery';
import { ICrmQueryBuilder } from './ICrmQueryBuilder';
import { ICrmEntity } from './models/ICrmEntity';

export class CrmChildQuery<T extends ICrmEntity> extends CrmQuery<T> implements ICrmQueryBuilder<T> {
  private parentId: Guid;

  private childName: string;

  constructor(type: CrmEndpoint, id: Guid, childName: string) {
    super(type);

    this.parentId = id;
    this.childName = childName;
  }

  protected TEMP_getUrl(url: string): string {
    url += `(${this.parentId})/${this.childName}`;

    return super.TEMP_getUrl(url);
  }

  protected getRequest(request: Wretcher): Wretcher {
    request = request.url(`(${this.parentId})/${this.childName}`);

    return super.getRequest(request);
  }
}
