import wretch, { Wretcher } from 'wretch';

import { context } from '../appSettings.json';
import { wait } from '../utilities/promises';
import { CrmEndpoint } from './CrmEndpoint';
import TEMP_responses from './TEMP_responses.json';

export abstract class CrmQueryBase<TResponse> implements PromiseLike<TResponse> {
  protected type: CrmEndpoint;

  constructor(type: CrmEndpoint) {
    this.type = type;
  }

  async then<TResult1 = TResponse, TResult2 = never>(
    resolve?: ((value: TResponse) => TResult1 | PromiseLike<TResult1>) | null | undefined,
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

  protected abstract TEMP_getUrl(url: string): string;

  protected abstract getRequest(request: Wretcher): Wretcher;

  private async getResponse() {
    const endpoint = `${this.type}`;

    let fullUrl = `${context.crmEndpoint}/${endpoint}`;

    // TEMPORARY
    if (process.env.NODE_ENV === "development") {
      fullUrl = this.TEMP_getUrl(fullUrl);

      console.log(fullUrl);

      await wait(Math.random() * 150 + 20);

      for (const response in TEMP_responses) {
        if ((TEMP_responses as any)[response].url === fullUrl) {
          return ((TEMP_responses as any)[response] as unknown) as TResponse;
        }
      }

      return {} as TResponse;
    }

    let request = wretch(fullUrl);

    request = this.getRequest(request);

    return await request.get().json<TResponse>();
  }
}
