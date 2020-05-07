import { Wretcher } from 'wretch';

import { cacheDurations } from './cacheDurations';
import { CrmChildMap } from './CrmChildMap';
import { CrmChildQuery } from './CrmChildQuery';
import { CrmEndpoint } from './CrmEndpoint';
import { CrmQueryBase } from './CrmQueryBase';
import { ICrmIdQueryBuilder } from './ICrmIdQueryBuilder';
import { ICrmEntity } from './models/ICrmEntity';

export class CrmIdQuery<T extends ICrmEntity> extends CrmQueryBase<T> implements ICrmIdQueryBuilder<T> {
  private id: Guid;

  private selectFields: (keyof T)[];

  private expandQuery: { [P in keyof T]?: string[] };

  constructor(type: CrmEndpoint, id: Guid, cacheDuration?: number) {
    super(type, cacheDuration);

    this.id = id;
    this.selectFields = new Array<keyof T>();
    this.expandQuery = {};
  }

  select(...fields: (keyof T)[]) {
    this.selectFields = [...this.selectFields, ...fields];

    return this;
  }

  expand<K extends keyof T>(property: K, select: (keyof NonNullable<T[K] extends any[] ? T[K][number] : T[K]>)[]) {
    this.expandQuery[property] = select;

    return this;
  }

  children<K extends keyof CrmChildMap>(childName: K) {
    return new CrmChildQuery<CrmChildMap[K]>(this.type, cacheDurations[childName], this.id, childName);
  }

  protected getRequest(request: Wretcher): Wretcher {
    request = request.url(`(${this.id})`);

    if (this.selectFields.length > 0) {
      request = request.query(`$select=${this.selectFields.join(",")}`);
    }

    if (Object.keys(this.expandQuery).length > 0) {
      const expansions = [];

      for (const query in this.expandQuery) {
        const expanded = this.expandQuery[query];

        expanded && expansions.push(`${query}($select=${expanded.join(",")})`);
      }

      request = request.query(`$expand=${expansions.join(",")}`);
    }

    return request;
  }
}
