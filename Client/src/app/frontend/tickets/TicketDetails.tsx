import Linkify from 'linkifyjs/react';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
    Avatar,
    Chip,
    createStyles,
    Divider,
    IconButton,
    makeStyles,
    TextField,
    Theme,
    Tooltip,
    Typography
} from '@material-ui/core';
import { blue, green, red } from '@material-ui/core/colors';
import {
    AddCircle,
    Attachment,
    Cake,
    CallMade,
    CallReceived,
    HourglassEmpty,
    Visibility
} from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import { Link, useMatch } from '@reach/router';

import { experience } from '../../../appSettings.json';
import { ICrmService } from '../../../services/CrmService';
import { useDependency } from '../../../services/dependencyContainer';
import { ServiceStatus, ServiceType } from '../../../services/models/ICrmAccountService';
import { ProductFamily } from '../../../services/models/ICrmCsProject';
import { ICrmEmail } from '../../../services/models/ICrmEmail';
import { ICrmTag } from '../../../services/models/ICrmTag';
import { ICrmTicket } from '../../../services/models/ICrmTicket';
import { TicketStatus } from '../../../services/models/TicketStatus';
import { systemUser } from '../../../services/systemUser';
import { account, entityNames } from '../../../terms.en-us.json';
import { useSubscription, useSubscriptionEffect } from '../../../utilities/observables';
import { routes } from '../../routes';
import { DateFromNow } from '../../shared/DateFromNow';
import { ExpandablePanel } from '../../shared/ExpandablePanel';
import { Loading } from '../../shared/Loading';
import { TicketIcon } from './TicketIcon';

interface ITicketDetailsProps {
  ticket: ICrmTicket;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    divider: {
      margin: theme.spacing(1, 0)
    },
    emailItemAvatar: {
      minWidth: theme.spacing(3),
      "& > div": {
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        "& > svg": {
          fontSize: ".75rem"
        }
      }
    },
    emailItemButton: {
      padding: theme.spacing(0.75)
    },
    ticketEmail: {
      display: "flex"
    },
    remainingCredits: { color: theme.palette.type === "light" ? green[500] : green[200] },
    totalCredits: { color: theme.palette.type === "light" ? blue[500] : blue[200] },
    expiredCredits: { color: theme.palette.type === "light" ? red[500] : red[200] },
    ticketEmailSubject: {
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      overflow: "hidden",
      flex: 1,
      placeSelf: "center",
      margin: theme.spacing(0.25)
    },
    noteText: {
      whiteSpace: "pre-line",
      overflowWrap: "break-word"
    },
    link: {
      color: theme.palette.type === "light" ? blue[500] : blue[200]
    },
    addTag: {
      padding: theme.spacing(0.5)
    },
    attachment: {
      float: "left",
      marginRight: theme.spacing(0.5)
    },
    tagList: {
      background: theme.palette.action.selected,
      maxHeight: theme.spacing(20)
    },
    tagOption: {
      fontSize: ".8rem",
      padding: theme.spacing(0.5, 2)
    }
  })
);

export const TicketDetails: FC<ITicketDetailsProps> = ({ ticket }) => {
  const styles = useStyles();

  const [ticketTags, setTicketTags] = useState<ICrmTag[]>();

  const context = useMatch(`${routes.base}${routes.tickets}/:ticketNumber/:emailId`);

  const crmService = useDependency(ICrmService);

  const csProjects = useSubscriptionEffect(() => {
    if (ticket.customerid_account) {
      return crmService
        .csProjects()
        .select("ken_productfamily", "ken_name", "ken_csprojectdetails", "ken_customersuccessprojectid", "createdon")
        .filter(`_ken_customerid_value eq ${ticket.customerid_account.accountid} and ken_csprojectstatus ne 281600009`)
        .orderBy("createdon desc")
        .getObservable();
    }
  }, [ticket.customerid_account])?.value;

  const accountServices = useSubscriptionEffect(() => {
    if (ticket.customerid_account) {
      return crmService
        .services()
        .select("ken_name", "ken_remainingcredits", "ken_credits", "statuscode", "ken_expireson", "ken_servicetype")
        .filter(`_ken_accountid_value eq ${ticket.customerid_account.accountid} and ken_servicetype ne ${ServiceType.CustomerSuccess}`)
        .orderBy("ken_expireson desc")
        .getObservable();
    }
  }, [ticket.customerid_account])?.value;

  const recentTicketsDate = useMemo(() => {
    if (process.env.NODE_ENV === "development") {
      return new Date("2020-04-13").toISOString();
    }

    const date = new Date();
    date.setHours(date.getHours() - experience.recentCasesDays * 24);

    return date.toISOString();
  }, []);

  const recentTickets = useSubscriptionEffect(() => {
    if (ticket.customerid_account) {
      return crmService
        .tickets()
        .select("title", "modifiedon", "ticketnumber", "dyn_issla", "dyn_is2level", "prioritycode")
        .filter(
          `incidentid ne ${ticket.incidentid} and _customerid_value eq ${ticket.customerid_account.accountid} and (createdon gt ${recentTicketsDate} or statuscode eq ${TicketStatus.Queue})`
        )
        .orderBy("modifiedon desc")
        .expand("customerid_account", ["ken_supportlevel"])
        .getObservable();
    }
  }, [ticket.customerid_account, recentTicketsDate])?.value;

  const ticketEmails = useSubscription(
    crmService
      .tickets()
      .id(ticket.incidentid)
      .children("Incident_Emails")
      .select(
        "modifiedon",
        "subject",
        "activityid",
        "statuscode",
        "directioncode",
        "sender",
        "attachmentcount",
        "trackingtoken",
        "_ownerid_value"
      )
      .filter(`sender ne '${systemUser.internalemailaddress}' and isworkflowcreated ne true`)
      .orderBy("createdon desc")
      .getObservable()
  )?.value;

  const ticketNotes = useSubscription(
    crmService
      .tickets()
      .id(ticket.incidentid)
      .children("Incident_Annotation")
      .select("subject", "notetext", "modifiedon")
      .expand("modifiedby", ["fullname"])
      .orderBy("modifiedon desc")
      .getObservable()
  )?.value;

  const rawTicketTags = useSubscription(
    crmService
      .tickets()
      .id(ticket.incidentid)
      .children("incident_connections1")
      .select("name")
      .orderBy("name desc")
      .getObservable()
  )?.value;

  useEffect(() => {
    if (rawTicketTags) {
      setTicketTags(rawTicketTags.map(connection => ({ dyn_tagid: connection.connectionid, dyn_name: connection.name })));
    }
  }, [rawTicketTags]);

  const allTags = useSubscription(
    crmService
      .tags()
      .select("dyn_name")
      .filter(`statuscode eq 1 and ken_taggroup eq 281600002`)
      .orderBy("dyn_name")
      .getObservable()
  )?.value;

  const ticketEmailIsSelected = useCallback(
    (ticketEmail: ICrmEmail) => {
      return context?.emailId === ticketEmail.activityid;
    },
    [context]
  );
  const recentTicketIsSelected = useCallback(
    (recentTicket: ICrmTicket) => {
      return context?.ticketNumber === recentTicket.ticketnumber;
    },
    [context]
  );

  const notCreditsAccountServices = useMemo(
    () => accountServices?.filter(accountService => accountService.ken_servicetype !== ServiceType.Credits),
    [accountServices]
  );

  const remainingCredits = useMemo(() => {
    if (accountServices) {
      let credits = 0;

      for (const accountService of accountServices) {
        switch (accountService.ken_servicetype) {
          case ServiceType.Credits:
            switch (accountService.statuscode) {
              case ServiceStatus.Purchased:
              case ServiceStatus.InProgress:
                credits += accountService.ken_remainingcredits;
                break;
            }
            break;
        }
      }

      return credits;
    }
  }, [accountServices]);

  const totalCredits = useMemo(() => {
    if (accountServices) {
      let credits = 0;

      for (const accountService of accountServices) {
        switch (accountService.ken_servicetype) {
          case ServiceType.Credits:
            switch (accountService.statuscode) {
              case ServiceStatus.Purchased:
              case ServiceStatus.InProgress:
                credits += accountService.ken_credits;
                break;
            }
            break;
        }
      }

      return credits;
    }
  }, [accountServices]);

  const expiredCredits = useMemo(() => {
    if (accountServices) {
      let credits = 0;

      for (const accountService of accountServices) {
        switch (accountService.ken_servicetype) {
          case ServiceType.Credits:
            switch (accountService.statuscode) {
              case ServiceStatus.Expired:
                credits += accountService.ken_remainingcredits;
                break;
            }
            break;
        }
      }

      return credits;
    }
  }, [accountServices]);

  return (
    <>
      {ticket.customerid_account?.ken_customernote && (
        <Typography component="span">{ticket.customerid_account.ken_customernote}</Typography>
      )}
      {ticket.customerid_account && !(accountServices && csProjects && recentTickets) && <Loading />}
      {ticket.customerid_account && accountServices && csProjects && recentTickets && (
        <>
          <Typography variant="subtitle1" align="center">
            {account.credits.label}
            <Tooltip title={account.credits.remaining} aria-label={account.credits.remaining}>
              <Chip label={remainingCredits} className={styles.remainingCredits} />
            </Tooltip>
            /
            <Tooltip title={account.credits.total} aria-label={account.credits.total}>
              <Chip label={totalCredits} className={styles.totalCredits} />
            </Tooltip>
            /
            <Tooltip title={account.credits.expired} aria-label={account.credits.expired}>
              <Chip label={expiredCredits} className={styles.expiredCredits} />
            </Tooltip>
            <Tooltip title={account.credits.logCreditTask} aria-label={account.credits.logCreditTask}>
              <IconButton aria-label={account.credits.logCreditTask}>
                <AddCircle color="primary" />
              </IconButton>
            </Tooltip>
          </Typography>
          {csProjects.length > 0 && (
            <ExpandablePanel
              label={
                <>
                  <Typography variant="subtitle2">{account.csProjects}</Typography>
                  <Typography variant="subtitle2">{csProjects.length}</Typography>
                </>
              }
              items={csProjects}
              direction="vertical"
              getAvatar={csProject => ProductFamily[csProject.ken_productfamily][0]}
              getLeft={csProject => (
                <>
                  <Typography variant="subtitle2">{csProject.ken_name}</Typography>
                  <DateFromNow icon={<Cake />} date={csProject.createdon} />
                </>
              )}
              getRight={csProject => (
                <Typography variant="caption" component="span">
                  {csProject.ken_csprojectdetails}
                </Typography>
              )}
            />
          )}
          {accountServices.length > 0 && (
            <ExpandablePanel
              label={
                <>
                  <Typography variant="subtitle2">{account.accountServices}</Typography>
                  <Typography variant="subtitle2">{notCreditsAccountServices?.length}</Typography>
                </>
              }
              items={notCreditsAccountServices}
              getAvatar={accountService => (
                <Tooltip
                  title={entityNames.accountService[accountService.statuscode]}
                  aria-label={entityNames.accountService[accountService.statuscode]}
                >
                  <Avatar>{entityNames.accountService[accountService.statuscode][0]}</Avatar>
                </Tooltip>
              )}
              getLeft={accountService => (
                <Typography variant="caption" color="textSecondary" className={styles.ticketEmailSubject}>
                  {accountService.ken_name}
                </Typography>
              )}
              getRight={accountService =>
                accountService.ken_expireson && <DateFromNow icon={<HourglassEmpty />} date={accountService.ken_expireson} />
              }
              getAction={accountService => (
                <IconButton edge="end" aria-label="delete" className={styles.emailItemButton}>
                  <Visibility />
                </IconButton>
              )}
              classes={{
                avatar: styles.emailItemAvatar
              }}
            />
          )}
          {recentTickets.length > 0 && (
            <ExpandablePanel
              label={
                <>
                  <Typography variant="subtitle2">{account.recentTickets}</Typography>
                  <Typography variant="subtitle2">{recentTickets.length}</Typography>
                </>
              }
              items={recentTickets}
              selected={recentTicketIsSelected}
              getAvatar={recentTicket => <TicketIcon ticket={recentTicket} />}
              getLeft={recentTicket =>
                recentTicket.title && (
                  <Typography variant="caption" color="textSecondary" className={styles.ticketEmailSubject}>
                    {recentTicket.title}
                  </Typography>
                )
              }
              getRight={recentTicket => recentTicket.modifiedon && <DateFromNow date={recentTicket.modifiedon} />}
              getAction={recentTicket => (
                <Link to={`${routes.base}${routes.tickets}/${recentTicket.ticketnumber}`}>
                  <IconButton edge="end" aria-label="delete" className={styles.emailItemButton}>
                    <Visibility />
                  </IconButton>
                </Link>
              )}
              classes={{
                avatar: styles.emailItemAvatar
              }}
            />
          )}
        </>
      )}
      {!(ticketEmails && ticketNotes && ticketTags) && <Loading />}
      {ticketEmails && ticketNotes && ticketTags && (
        <>
          {ticketEmails.length > 0 && (
            <ExpandablePanel
              label={
                <>
                  <Typography variant="subtitle2">{account.ticketEmails}</Typography>
                  <Typography variant="subtitle2">{ticketEmails.length}</Typography>
                </>
              }
              items={ticketEmails}
              selected={ticketEmailIsSelected}
              getAvatar={ticketEmail => (ticketEmail.directioncode && ticketEmail.directioncode ? <CallMade /> : <CallReceived />)}
              getLeft={ticketEmail =>
                ticketEmail.subject && (
                  <Typography variant="caption" color="textSecondary" className={styles.ticketEmailSubject}>
                    {ticketEmail.subject}
                  </Typography>
                )
              }
              getRight={ticketEmail => (
                <>
                  {ticketEmail.attachmentcount !== undefined && ticketEmail.attachmentcount > 0 && (
                    <Attachment className={styles.attachment} />
                  )}
                  {ticketEmail.modifiedon && <DateFromNow date={ticketEmail.modifiedon} />}
                </>
              )}
              getAction={ticketEmail => (
                <Link to={`${routes.base}${routes.tickets}/${ticket.ticketnumber}/${ticketEmail.activityid}`}>
                  <IconButton edge="end" aria-label="delete" className={styles.emailItemButton}>
                    <Visibility />
                  </IconButton>
                </Link>
              )}
              classes={{
                avatar: styles.emailItemAvatar
              }}
            />
          )}
          {ticketNotes.length > 0 && (
            <ExpandablePanel
              label={
                <>
                  <Typography variant="subtitle2">{account.ticketNotes}</Typography>
                  <Typography variant="subtitle2">{ticketNotes.length}</Typography>
                </>
              }
              items={ticketNotes}
              direction="vertical"
              expanded
              getLeft={ticketNote => (
                <>
                  <Typography variant="caption">{ticketNote.modifiedby?.fullname}</Typography>
                  {ticketNote.modifiedon && <DateFromNow date={ticketNote.modifiedon} />}
                </>
              )}
              getRight={ticketNote => (
                <>
                  {ticketNote.subject && <Typography variant="subtitle2">{ticketNote.subject}</Typography>}
                  {ticketNote.notetext && (
                    <Typography variant="caption" color="textPrimary" className={styles.noteText}>
                      <Linkify options={{ className: styles.link }}>{ticketNote.notetext}</Linkify>
                    </Typography>
                  )}
                </>
              )}
            />
          )}
          {ticketTags.length > 0 && <Divider className={styles.divider} />}
          {!allTags && <Loading />}
          {allTags && (
            <Autocomplete
              multiple
              size="small"
              options={allTags}
              filterSelectedOptions
              getOptionLabel={option => option.dyn_name}
              getOptionSelected={(option, value) => option.dyn_tagid === value.dyn_tagid}
              value={ticketTags}
              onChange={(_event: any, newValue: any) => {
                setTicketTags(ticketTags => (newValue ? newValue : ticketTags));
              }}
              classes={{ listbox: styles.tagList, option: styles.tagOption }}
              renderInput={params => <TextField {...params} variant="outlined" label={account.caseTags} />}
            />
          )}
        </>
      )}
    </>
  );
};
