import React, { FC } from 'react';
import useAsyncEffect from 'use-async-effect';

import { Box, createStyles, makeStyles } from '@material-ui/core';
import { navigate } from '@reach/router';

import { ICrmService } from '../../../../services/crmService/CrmService';
import { ICrmUser } from '../../../../services/crmService/models/ICrmUser';
import { useDependency } from '../../../../services/dependencyContainer';
import { systemUser } from '../../../../services/systemUser';
import { useSubscription, useSubscriptionEffect } from '../../../../utilities/observables';
import { routes } from '../../../routes';
import { Loading } from '../../../shared/Loading';
import { EmailView } from './EmailView';

interface IEmailLoaderProps {
  ticketNumber: string;
  emailId: string | undefined;
  users: ICrmUser[] | undefined;
}

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      display: "flex",
      flex: 1,
      minWidth: 0,
      height: "100%",
    },
    router: {
      display: "flex",
      flex: 1,
      minHeight: 0,
      width: "100%",
    },
  })
);

export const EmailLoader: FC<IEmailLoaderProps> = ({ ticketNumber, emailId, users }) => {
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
        "_owninguser_value",
      ])
      .expand("primarycontactid", ["contactid", "fullname", "ken_position", "ken_supportlevel", "ken_comment"])
      .getObservable()
  )?.[0];

  const emailFilter = `sender ne '${systemUser.internalemailaddress}' and isworkflowcreated ne true`;

  const latestEmailId = useSubscriptionEffect(() => {
    if (ticket?.incidentid && !emailId) {
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
  }, [ticket, emailId])?.[0];

  useAsyncEffect(async () => {
    if (ticket?.ticketnumber && latestEmailId?.activityid && !emailId && ticket.incidentid === latestEmailId._regardingobjectid_value) {
      await navigate(`${routes.base}${routes.tickets}/${ticket.ticketnumber}/${latestEmailId.activityid}`, { replace: true });
    }
  }, [ticket, latestEmailId, emailId]);

  return (
    <Box className={styles.root}>
      {!ticket && <Loading />}
      {ticket && emailId && <EmailView ticket={ticket} emailId={emailId} users={users} />}
    </Box>
  );
};
