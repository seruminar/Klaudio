import { useMemo } from 'react';
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
