import React, { useEffect } from 'react';

import { Grid } from '@material-ui/core';
import { navigate } from '@reach/router';

import { ICrmService } from '../../../services/CrmService';
import { useDependency } from '../../../services/dependencyContainer';
import { useSubscription } from '../../../utilities/observables';
import { RoutedFC } from '../../../utilities/routing';
import { routes } from '../../routes';
import { Loading } from '../../shared/Loading';

interface IByEmailProps {
  emailId: string;
}

export const ByEmail: RoutedFC<IByEmailProps> = ({ emailId }) => {
  const crmService = useDependency(ICrmService);

  const ticket = useSubscription(
    crmService
      .tickets()
      .select("ticketnumber")
      .filter(`Incident_Emails/any(e:e/activityid eq ${emailId})`)
      .top(1)
      .getObservable()
  )?.value[0];

  useEffect(() => {
    if (ticket) {
      navigate(`${routes.base}${routes.tickets}/${ticket.ticketnumber}/${emailId}`);
    }
  }, [ticket, emailId]);

  return (
    <Grid container wrap="nowrap">
      <Loading />
    </Grid>
  );
};
