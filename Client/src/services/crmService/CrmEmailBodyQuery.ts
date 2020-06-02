import wretch, { Wretcher } from 'wretch';

import { CrmQueryBase } from './CrmQueryBase';
import { ICrmEmailBodyQueryBuilder } from './ICrmEmailBodyQueryBuilder';

export class CrmEmailBodyQuery extends CrmQueryBase<string> implements ICrmEmailBodyQueryBuilder {
  private emailId: Guid;

  constructor() {
    super("emailbody");
    this.emailId = "";
  }

  id(id: Guid) {
    this.emailId = id;
    return this;
  }

  protected getRequest(request: Wretcher): Wretcher {
    return wretch(`/_controls/emailbody/msgBody.aspx`).query({ id: `{${this.emailId}}`, entityType: "email" });
  }

  protected getDependencies() {
    return [this.type];
  }

  async sendRequest(request: Wretcher) {
    return await (await request.get().blob()).text();
  }
}
