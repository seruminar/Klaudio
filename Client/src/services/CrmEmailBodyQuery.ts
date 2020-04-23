import wretch from 'wretch';

import { wait } from '../utilities/promises';
import { ICrmEmailBodyQueryBuilder } from './ICrmEmailBodyQueryBuilder';

export class CrmEmailBodyQuery implements ICrmEmailBodyQueryBuilder {
  private emailId: Guid;

  constructor() {
    this.emailId = "";
  }

  id(id: Guid) {
    this.emailId = id;
    return this;
  }

  async then<TResult1 = string, TResult2 = never>(
    resolve?: ((value: string) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    reject?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): Promise<TResult1 | TResult2> {
    try {
      if (resolve) {
        return resolve(await this.getResponse());
      }
    } catch (error) {
      if (reject) {
        return reject(error);
      }
    }

    return new Promise<TResult1>(() => this.getResponse());
  }

  private async getResponse() {
    const endpoint = `/_controls/emailbody/msgBody.aspx?id={${this.emailId}}&entityType=email`;

    // TEMPORARY
    if (process.env.NODE_ENV === "development") {
      console.log(endpoint);

      await wait(Math.random() * 150 + 20);

      const TEMP_responses = await import("./TEMP_responses.json");

      for (const response in TEMP_responses) {
        if ((TEMP_responses as any)[response].url === endpoint) {
          return ((TEMP_responses as any)[response].value as unknown) as string;
        }
      }

      return "";
    }

    let request = wretch(endpoint);

    return await (await request.get().blob()).text();
  }
}
