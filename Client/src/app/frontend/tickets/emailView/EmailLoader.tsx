import React from 'react';
import useAsyncEffect from 'use-async-effect';

import { Box, createStyles, makeStyles } from '@material-ui/core';
import { navigate, Router } from '@reach/router';

import { ICrmService } from '../../../../services/crmService/CrmService';
import { useDependency } from '../../../../services/dependencyContainer';
import { systemUser } from '../../../../services/systemUser';
import { useSubscription, useSubscriptionEffect } from '../../../../utilities/observables';
import { RoutedFC } from '../../../../utilities/routing';
import { routes } from '../../../routes';
import { Loading } from '../../../shared/Loading';
import { EmailView } from './EmailView';

interface IEmailLoaderProps {
  ticketNumber: string;
}

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      display: "flex",
      flex: 1,
      minWidth: 0,
      height: "100%"
    },
    router: {
      display: "flex",
      flex: 1,
      minHeight: 0,
      width: "100%"
    }
  })
);

export const EmailLoader: RoutedFC<IEmailLoaderProps> = ({ ticketNumber }) => {
  const styles = useStyles();

  const crmService = useDependency(ICrmService);

  const ticket = useSubscription(
    crmService
      .tickets()
      .select(
        "title",
        "ken_sladuedate",
        "modifiedon",
        "_ownerid_value",
        "dyn_issla",
        "dyn_is2level",
        "prioritycode",
        "statuscode",
        "ticketnumber",
        "_ken_latestcontact_value"
      )
      .filter(`ticketnumber eq '${ticketNumber}'`)
      .top(1)
      .expand("customerid_account", [
        "name",
        "ken_customernote",
        "ken_supportlevel",
        "_dyn_accountexecutiveid_value",
        "_dyn_accountmanagerid_value",
        "_owninguser_value"
      ])
      .expand("primarycontactid", ["contactid", "fullname", "ken_position", "ken_supportlevel", "ken_comment"])
      .getObservable()
  )?.[0];

  const emailFilter = `sender ne '${systemUser.internalemailaddress}' and isworkflowcreated ne true`;

  const latestEmailId = useSubscriptionEffect(() => {
    if (ticket?.incidentid) {
      return crmService
        .tickets()
        .id(ticket.incidentid)
        .children("Incident_Emails")
        .select("_regardingobjectid_value")
        .filter(emailFilter)
        .top(1)
        .orderBy("createdon desc")
        .getObservable();
    }
  }, [ticket])?.[0];

  useAsyncEffect(async () => {
    if (ticket?.ticketnumber && latestEmailId?.activityid && ticket.incidentid === latestEmailId._regardingobjectid_value) {
      await navigate(`${routes.base}${routes.tickets}/${ticket.ticketnumber}/${latestEmailId.activityid}`, { replace: true });
    }
  }, [ticket, latestEmailId]);

  return (
    <Box className={styles.root}>
      {!ticket && <Loading />}
      {ticket && (
        <Router className={styles.router}>
          <EmailView path=":emailId" ticket={ticket} />
        </Router>
      )}
    </Box>
  );
};
