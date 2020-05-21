import { BehaviorSubject } from 'rxjs';
import wretch, { Wretcher } from 'wretch';
import { retry } from 'wretch-middlewares';

import { context } from '../../appSettings.json';
import { wait } from '../../utilities/promises';
import { CacheItem, ICacheItem } from '../CacheItem';
import { cacheDurations } from './cacheDurations';
import { CrmEndpoint } from './CrmEndpoint';
import { ICrmQueryBase } from './ICrmQueryBase';

const observablesCache: { [url: string]: ICacheItem } = {};

export abstract class CrmQueryBase<T> implements ICrmQueryBase<T> {
  protected type: keyof CrmEndpoint;
  protected cacheDuration: number;

  protected cacheCondition: (item: T) => boolean;
  constructor(type: keyof CrmEndpoint, cacheDuration?: number) {
    this.type = type;
    this.cacheCondition = () => true;

    if (cacheDuration) {
      this.cacheDuration = cacheDuration;
    } else if (type !== undefined) {
      this.cacheDuration = cacheDurations[type];
    } else {
      this.cacheDuration = 0;
    }
  }

  protected abstract getRequest(request: Wretcher): Wretcher;
  shouldCache(cacheCondition: (item: T) => boolean) {
    this.cacheCondition = cacheCondition;

    return this;
  }

  getObservable(previousValue: T | undefined): BehaviorSubject<T | undefined> {
    const request = this.getRequest(wretch(`${context.crmEndpoint}/${this.type}`).middlewares([retry()]));

    const fullUrl = request._url;

    let cacheItem = observablesCache[fullUrl];

    if (cacheItem) {
      return cacheItem.observable as BehaviorSubject<T | undefined>;
    }

    const newObservable = new BehaviorSubject<T | undefined>(previousValue);

    const getResponse = (observable: BehaviorSubject<T | undefined>) =>
      this.getResponse(request).then((data) => {
        observable.next(data);
        return data;
      });

    observablesCache[fullUrl] = new CacheItem(
      newObservable,
      this.cacheDuration,
      getResponse,
      () => delete observablesCache[fullUrl],
      (item) => (item ? this.cacheCondition(item) : true)
    );

    getResponse(newObservable);

    return newObservable;
  }

  private async getResponse(request: Wretcher) {
    // TEMPORARY
    if (process.env.NODE_ENV === "development") {
      console.log(request._url);

      await wait(Math.random() * 150 + 20);

      const TEMP_responses = await import("../TEMP_responses.json");

      const item = TEMP_responses.default.find((item) => item.url === request._url);

      if (item) {
        if (item.value) {
          return (item.value as unknown) as T;
        }

        return (item as unknown) as T;
      }

      throw new Error(`DEV: call to get new response: getData("${request._url}")`);
    }

    return await this.sendRequest(request);
  }

  protected abstract async sendRequest(request: Wretcher): Promise<T>;
}
