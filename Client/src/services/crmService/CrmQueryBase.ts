import { BehaviorSubject } from 'rxjs';
import wretch, { Wretcher } from 'wretch';

import { context } from '../../appSettings.json';
import { wait } from '../../utilities/promises';
import { CacheItem, ICacheItem } from '../CacheItem';
import { cacheDurations } from './cacheDurations';
import { CrmApiResponse } from './CrmApiResponse';
import { CrmEndpoint } from './CrmEndpoint';
import { ICrmQueryBase } from './ICrmQueryBase';

const observablesCache: { [url: string]: ICacheItem } = {};

export abstract class CrmQueryBase<T> implements ICrmQueryBase<T> {
  protected type: CrmEndpoint;
  protected cacheDuration: number;

  constructor(type: CrmEndpoint, cacheDuration?: number) {
    this.type = type;

    if (cacheDuration) {
      this.cacheDuration = cacheDuration;
    } else if (type !== undefined) {
      this.cacheDuration = cacheDurations[type];
    } else {
      this.cacheDuration = 0;
    }
  }

  protected abstract getRequest(request: Wretcher): Wretcher;

  getObservable(previousValue: CrmApiResponse<T> | undefined): BehaviorSubject<CrmApiResponse<T> | undefined> {
    const request = this.getRequest(wretch(`${context.crmEndpoint}/${this.type}`));

    const fullUrl = request._url;

    let cacheItem = observablesCache[fullUrl];

    if (cacheItem) {
      return cacheItem.observable as BehaviorSubject<CrmApiResponse<T> | undefined>;
    }

    const newObservable = new BehaviorSubject<CrmApiResponse<T> | undefined>(previousValue);

    const getResponse = (observable: BehaviorSubject<CrmApiResponse<T> | undefined>) =>
      this.getResponse(request).then(data => observable.next(data));

    observablesCache[fullUrl] = new CacheItem(newObservable, this.cacheDuration, getResponse, () => delete observablesCache[fullUrl]);

    getResponse(newObservable);

    return newObservable;
  }

  private async getResponse(request: Wretcher) {
    // TEMPORARY
    if (process.env.NODE_ENV === "development") {
      console.log(request._url);

      await wait(Math.random() * 150 + 20);

      const TEMP_responses = await import("../TEMP_responses.json");

      const item = TEMP_responses.default.find(item => item.url === request._url);

      if (item) {
        if (this.type === undefined) {
          return (item.value as unknown) as CrmApiResponse<T>;
        }

        return (item as unknown) as CrmApiResponse<T>;
      }

      throw new Error(`DEV: call to get new response: getData("${request._url}")`);
    }

    return await this.sendRequest(request);
  }

  protected async sendRequest(request: Wretcher) {
    return await request.get().json<CrmApiResponse<T>>();
  }
}
