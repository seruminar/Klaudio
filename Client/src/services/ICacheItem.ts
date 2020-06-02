import { SubscriptionLike } from 'rxjs';

export interface ICacheItem {
  observable: SubscriptionLike;
  dependencies: string[];
  refresh: (callBack?: () => void) => void;
}
