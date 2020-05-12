import React from 'react';
import useAsyncEffect from 'use-async-effect';

import { Grid } from '@material-ui/core';
import { navigate } from '@reach/router';

import { ICrmService } from '../../../services/crmService/CrmService';
import { useDependency } from '../../../services/dependencyContainer';
import { useSubscription } from '../../../utilities/observables';
import { RoutedFC } from '../../../utilities/routing';
import { routes } from '../../routes';
import { Loading } from '../../shared/Loading';

interface IByIdProps {
  ticketId: string;
}

export const ById: RoutedFC<IByIdProps> = ({ ticketId }) => {
  const crmService = useDependency(ICrmService);

  const ticket = useSubscription(
    crmService
      .tickets()
      .id(ticketId!)
      .select("ticketnumber")
      .getObservable()
  );

  useAsyncEffect(async () => {
    if (ticket) {
      await navigate(`${routes.base}${routes.tickets}/${ticket.ticketnumber}`);
    }
  }, [ticket, ticketId]);

  return (
    <Grid container wrap="nowrap">
      <Loading />
    </Grid>
  );
};
