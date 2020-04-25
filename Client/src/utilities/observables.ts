import { useEffect, useMemo, useState } from 'react';
import { BehaviorSubject } from 'rxjs';
import { useSubscription as useS } from 'use-subscription';

export const useSubscription = <T>(behaviorSubject: BehaviorSubject<T>) =>
  useS<T>(
    useMemo(
      () => ({
        getCurrentValue: () => behaviorSubject.getValue(),
        subscribe: callback => {
          const subscription = behaviorSubject.subscribe({ next: callback });
          return () => subscription.unsubscribe();
        }
      }),

      [behaviorSubject]
    )
  );

export const useSubscriptionEffect = <T>(getObservable: () => BehaviorSubject<T | undefined> | undefined) => {
  const [observable, setObservable] = useState(new BehaviorSubject<T | undefined>(undefined));

  useEffect(() => {
    const observable = getObservable();
    if (observable) {
      setObservable(observable);
    }
  }, [getObservable]);

  return useSubscription(observable);
};
