import { BehaviorSubject, SubscriptionLike } from 'rxjs';
import wretch, { Wretcher } from 'wretch';

import { context } from '../appSettings.json';
import { wait } from '../utilities/promises';
import { CrmApiResponse } from './CrmApiResponse';
import { CrmEndpoint } from './CrmEndpoint';
import { ICrmQueryBase } from './ICrmQueryBase';

const observables: { [url: string]: SubscriptionLike } = {};

export abstract class CrmQueryBase<T> implements ICrmQueryBase<T> {
  protected type: CrmEndpoint;

  constructor(type: CrmEndpoint) {
    this.type = type;
  }

  protected abstract getRequest(request: Wretcher): Wretcher;

  getObservable(previousValue: CrmApiResponse<T> | undefined): BehaviorSubject<CrmApiResponse<T> | undefined> {
    const request = this.getRequest(wretch(`${context.crmEndpoint}/${this.type}`));

    const fullUrl = request._url;

    let observable = observables[fullUrl];

    if (observable) {
      return observable as BehaviorSubject<CrmApiResponse<T> | undefined>;
    }

    const newObservable = new BehaviorSubject<CrmApiResponse<T> | undefined>(previousValue);

    observables[fullUrl] = newObservable;

    this.getResponse(request).then(data => newObservable.next(data));

    return newObservable;
  }

  private async getResponse(request: Wretcher) {
    // TEMPORARY
    if (process.env.NODE_ENV === "development") {
      console.log(request._url);

      await wait(Math.random() * 150 + 20);

      const TEMP_responses = await import("./TEMP_responses.json");

      for (const response in TEMP_responses) {
        if ((TEMP_responses as any)[response].url === request._url) {
          if (this.type === undefined) {
            return ((TEMP_responses as any)[response].value as unknown) as CrmApiResponse<T>;
          }

          return ((TEMP_responses as any)[response] as unknown) as CrmApiResponse<T>;
        }
      }

      throw new Error(`DEV: undefined response for "${request._url}".`);
    }

    return await this.sendRequest(request);
  }

  protected async sendRequest(request: Wretcher) {
    return await request.get().json<CrmApiResponse<T>>();
  }
}
