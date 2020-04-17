import { Wretcher } from 'wretch';

import { CrmEndpoint } from './CrmEndpoint';
import { CrmIdQuery } from './CrmIdQuery';
import { CrmQueryBase } from './CrmQueryBase';
import { ICrmQueryBuilder } from './ICrmQueryBuilder';
import { ICrmApiResponse } from './models/ICrmApiResponse';
import { ICrmEntity } from './models/ICrmEntity';

export class CrmQuery<T extends ICrmEntity> extends CrmQueryBase<ICrmApiResponse & { value: T[] }> implements ICrmQueryBuilder<T> {
  private topQuery: number;

  private selectFields: (keyof T)[];

  private filterQuery: string;

  private orderByQuery: string;

  private expandQuery: { [P in keyof T]?: string[] };

  constructor(type: CrmEndpoint) {
    super(type);

    this.topQuery = -1;
    this.selectFields = new Array<keyof T>();
    this.filterQuery = "";
    this.orderByQuery = "";
    this.expandQuery = {};
  }

  id(id: Guid) {
    return new CrmIdQuery<T>(this.type, id);
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

  protected TEMP_getUrl(url: string): string {
    const parameters = [];

    if (this.topQuery > -1) {
      parameters.push(`$top=${this.topQuery}`);
    }

    if (this.selectFields.length > 0) {
      parameters.push(`$select=${this.selectFields.join(",")}`);
    }

    if (this.filterQuery !== "") {
      parameters.push(`$filter=${encodeURIComponent(this.filterQuery)}`);
    }

    if (this.orderByQuery !== "") {
      parameters.push(`$orderby=${encodeURIComponent(this.orderByQuery)}`);
    }

    if (Object.keys(this.expandQuery).length > 0) {
      const expansions = [];

      for (const query in this.expandQuery) {
        const expanded = this.expandQuery[query];

        expanded && expansions.push(`${query}($select=${expanded.join(",")})`);
      }

      parameters.push(`$expand=${expansions.join(",")}`);
    }

    if (parameters.length > 0) {
      url += `?${parameters.join("&")}`;
    }

    return url;
  }
  protected getRequest(request: Wretcher): Wretcher {
    if (this.topQuery > -1) {
      request = request.query(`$top=${this.topQuery}`);
    }

    if (this.selectFields.length > 0) {
      request = request.query(`$select=${this.selectFields.join(",")}`);
    }

    if (this.filterQuery !== "") {
      request = request.query(`$filter=${encodeURIComponent(this.filterQuery)}`);
    }

    if (this.orderByQuery !== "") {
      request = request.query(`$orderby=${encodeURIComponent(this.orderByQuery)}`);
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
