import { CrmEntity } from './CrmEntity';
import { ICrmUrlBuilder } from './ICrmUrlBuilder';

export class CrmUrl implements ICrmUrlBuilder {
  private type: CrmEntity;

  private entityId: Guid;

  constructor(type: CrmEntity) {
    this.type = type;
    this.entityId = "";
  }

  id(id: Guid) {
    this.entityId = id;

    return this;
  }

  build() {
    let url = "/main.aspx?appid=1c2260f1-ec3a-46a1-a5c2-c53aff7b4c17";
    url += `&etn=${this.type}`;

    switch (this.type) {
      case CrmEntity.Ticket:
        url += `&id=${this.entityId}`;

        break;
      case CrmEntity.Jira:
        url += `&extraqs=%3fdyn_incident={${this.entityId}}`;
        break;
    }
    // url += `&newWindow=${this.openNewWindow}`;
    url += "&pagetype=entityrecord";

    return url;
  }
  open() {
    window.open(this.build());
  }
}
