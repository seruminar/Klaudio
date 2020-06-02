import wretch, { Wretcher } from 'wretch';
import { retry } from 'wretch-middlewares';

import { context } from '../../appSettings.json';
import { CrmApiResponse } from './CrmApiResponse';
import { CrmEndpoint } from './CrmEndpoint';
import { CrmIdQuery } from './CrmIdQuery';
import { CrmQueryBase } from './CrmQueryBase';
import { ICrmQueryBuilder } from './ICrmQueryBuilder';
import { ICrmEntity } from './models/ICrmEntity';

export class CrmQuery<T extends ICrmEntity> extends CrmQueryBase<T[]> implements ICrmQueryBuilder<T> {
  private topQuery: number;

  private selectFields: (keyof T)[];

  private filterQuery: string;

  private orderByQuery: string;

  private expandQuery: { [P in keyof T]?: string[] };

  constructor(type: keyof CrmEndpoint, cacheDuration?: number) {
    super(type, cacheDuration);

    this.topQuery = -1;
    this.selectFields = new Array<keyof T>();
    this.filterQuery = "";
    this.orderByQuery = "";
    this.expandQuery = {};
  }

  id(id: Guid) {
    return new CrmIdQuery<T>(this.type, id, this.cacheDuration);
  }

  top(topQuery: number) {
    this.topQuery = topQuery;

    return this;
  }

  select(...fields: (keyof T)[]) {
    this.selectFields = [...this.selectFields, ...fields];

    return this;
  }

  filter(filterQuery: string) {
    this.filterQuery = this.filterQuery += filterQuery;

    return this;
  }

  orderBy(orderByQuery: string) {
    this.orderByQuery = this.orderByQuery += orderByQuery;

    return this;
  }

  expand<K extends keyof T>(property: K, select: (keyof NonNullable<T[K] extends any[] ? T[K][number] : T[K]>)[]) {
    this.expandQuery[property] = select;

    return this;
  }

  insert(data: Partial<T>) {
    const request = this.getRequest(wretch(`${context.crmEndpoint}/${this.type}`).middlewares([retry()]));

    return request.post(data);
  }

  protected getRequest(request: Wretcher): Wretcher {
    if (this.topQuery > -1) {
      request = request.query(`$top=${this.topQuery}`);
    }

    if (this.selectFields.length) {
      request = request.query(`$select=${this.selectFields.join(",")}`);
    }

    if (this.filterQuery !== "") {
      request = request.query(`$filter=${encodeURIComponent(this.filterQuery)}`);
    }

    if (this.orderByQuery !== "") {
      request = request.query(`$orderby=${encodeURIComponent(this.orderByQuery)}`);
    }

    if (Object.keys(this.expandQuery).length) {
      const expansions = [];

      for (const query in this.expandQuery) {
        const expanded = this.expandQuery[query];

        expanded && expansions.push(`${query}($select=${expanded.join(",")})`);
      }

      request = request.query(`$expand=${expansions.join(",")}`);
    }

    return request;
  }

  protected getDependencies(): (string | keyof CrmEndpoint)[] {
    return [this.type];
  }

  async sendRequest(request: Wretcher) {
    return (await request.get().json<CrmApiResponse<T[]>>()).value;
  }
}
