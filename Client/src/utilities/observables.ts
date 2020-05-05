import { DependencyList, useEffect, useMemo, useState } from 'react';
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

export const useSubscriptionEffect = <T>(
  getObservable: (previous: T | undefined) => BehaviorSubject<T | undefined> | undefined,
  deps?: DependencyList
) => {
  const [observable, setObservable] = useState(new BehaviorSubject<T | undefined>(undefined));

  useEffect(() => {
    const newObservable = getObservable(observable.getValue());

    if (newObservable) {
      setObservable(newObservable);
    }

    // eslint-disable-next-line
  }, [observable, ...(deps || [])]);

  return useSubscription(observable);
};
