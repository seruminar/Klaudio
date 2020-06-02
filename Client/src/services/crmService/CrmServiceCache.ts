import { ICacheItem } from '../ICacheItem';

export const ICrmServiceCache = "ICrmServiceCache";

export class CrmServiceCache {
  private container: { [key: string]: ICacheItem } = {};
  add(key: string, item: ICacheItem) {
    this.container[key] = item;
  }
  get(key: string) {
    return this.container[key];
  }

  remove(key: string) {
    delete this.container[key];
  }

  refresh(dependency: string) {
    for (const key in this.container) {
      if (this.container.hasOwnProperty(key)) {
        const item = this.container[key];

        if (item.dependencies.includes(dependency)) {
          item.refresh();
        }
      }
    }
  }
}
