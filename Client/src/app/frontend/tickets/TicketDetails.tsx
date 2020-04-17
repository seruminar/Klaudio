import Linkify from 'linkifyjs/react';
import React, { FC, useCallback, useEffect, useState } from 'react';

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
    Alarm,
    Attachment,
    CallMade,
    CallReceived,
    HourglassEmpty,
    Visibility
} from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import { Link, useMatch } from '@reach/router';

import { ICrmService } from '../../../services/CrmService';
import { useDependency } from '../../../services/dependencyContainer';
import {
    ICrmAccountService,
    ServiceStatus,
    ServiceType
} from '../../../services/models/ICrmAccountService';
import { ICrmCsProject, ProductFamily } from '../../../services/models/ICrmCsProject';
import { ICrmEmail } from '../../../services/models/ICrmEmail';
import { ICrmNote } from '../../../services/models/ICrmNote';
import { ICrmTag } from '../../../services/models/ICrmTag';
import { ICrmTicket } from '../../../services/models/ICrmTicket';
import { TicketStatus } from '../../../services/models/TicketStatus';
import { systemUser } from '../../../services/systemUser';
import { account, entityNames } from '../../../terms.en-us.json';
import { routes } from '../../routes';
import { DateFromNow } from '../../shared/DateFromNow';
import { ExpandableList } from '../../shared/ExpandableList';
import { Loading } from '../../shared/Loading';
import { TicketIcon } from './TicketIcon';

interface ITicketDetailsProps {
  ticket: ICrmTicket;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    csProjectsList: {
      overflowY: "scroll",
      width: "100%",
      maxHeight: theme.spacing(20)
    },
    ticketEmailsList: {
      overflowY: "scroll",
      width: "100%",
      maxHeight: theme.spacing(30)
    },
    ticketNotesList: {
      overflowY: "scroll",
      width: "100%",
      maxHeight: theme.spacing(30)
    },
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
    ticketNoteOwner: {
      float: "right"
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

  const [csProjects, setCsProjects] = useState<ICrmCsProject[]>();
  const [accountServices, setAccountServices] = useState<ICrmAccountService[]>();
  const [recentTickets, setRecentTickets] = useState<ICrmTicket[]>();
  const [ticketEmails, setTicketEmails] = useState<ICrmEmail[]>();
  const [ticketNotes, setTicketNotes] = useState<ICrmNote[]>();
  const [ticketTags, setTicketTags] = useState<ICrmTag[]>();
  const [allTags, setAllTags] = useState<ICrmTag[]>();

  const context = useMatch(`${routes.base}${routes.tickets}/:ticketNumber/:emailId`);

  const crmService = useDependency(ICrmService);

  useEffect(() => {
    (async () => {
      if (ticket.customerid_account) {
        const csProjects = crmService
          .csProjects()
          .select("ken_productfamily", "ken_name", "ken_csprojectdetails", "ken_customersuccessprojectid", "createdon")
          .filter(`_ken_customerid_value eq ${ticket.customerid_account.accountid} and ken_csprojectstatus ne 281600009`)
          .orderBy("createdon desc");

        const accountServices = crmService
          .services()
          .select("ken_name", "ken_remainingcredits", "ken_credits", "statuscode", "ken_expireson", "ken_servicetype")
          .filter(`_ken_accountid_value eq ${ticket.customerid_account.accountid} and ken_servicetype ne ${ServiceType.CustomerSuccess}`)
          .orderBy("ken_expireson desc");

        const date = new Date();
        date.setHours(date.getHours() - 7 * 24);

        const recentTickets = crmService
          .tickets()
          .select(
            "title",
            "ken_sladuedate",
            "modifiedon",
            "ticketnumber",
            "dyn_issla",
            "dyn_is2level",
            "prioritycode",
            "dyn_ticket_group",
            "statuscode"
          )
          .filter(
            `_customerid_value eq ${ticket.customerid_account.accountid} and (createdon gt ${
              process.env.NODE_ENV === "development" ? "2020-04-13T04%3A41%3A45.381Z" : date.toISOString()
            } or statuscode eq ${TicketStatus.Queue})`
          )
          .orderBy("modifiedon desc");

        const [csProjectsResponse, accountServicesResponse, recentTicketsResponse] = await Promise.all([
          csProjects,
          accountServices,
          recentTickets
        ]);

        setCsProjects(csProjectsResponse.value);
        setAccountServices(accountServicesResponse.value);
        setRecentTickets(recentTicketsResponse.value);
      } else {
        setCsProjects([]);
        setAccountServices([]);
        setRecentTickets([]);
      }

      const ticketEmails = crmService
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
        .filter(`sender ne '${systemUser.internalemailaddress}'`)
        .orderBy("createdon desc");

      const ticketNotes = crmService
        .tickets()
        .id(ticket.incidentid)
        .children("Incident_Annotation")
        .select("subject", "notetext", "modifiedon")
        .expand("modifiedby", ["fullname"])
        .orderBy("modifiedon desc");

      const ticketTags = crmService
        .tickets()
        .id(ticket.incidentid)
        .children("incident_connections1")
        .select("name")
        .orderBy("name desc");

      const [ticketEmailsResponse, ticketNotesResponse, ticketTagsResponse] = await Promise.all([ticketEmails, ticketNotes, ticketTags]);

      setTicketEmails(ticketEmailsResponse.value);
      setTicketNotes(ticketNotesResponse.value);
      setTicketTags(ticketTagsResponse.value.map(connection => ({ dyn_tagid: connection.connectionid, dyn_name: connection.name })));
    })();
  }, [ticket, crmService]);

  useEffect(() => {
    (async () => {
      const allTags = (
        await crmService
          .tags()
          .select("dyn_name")
          .filter(`statuscode eq 1 and ken_taggroup eq 281600002`)
          .orderBy("dyn_name")
      ).value;

      setAllTags(allTags);
    })();
  }, [ticket, crmService]);

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

  const getNotCreditsAccountServices = useCallback((accountServices: ICrmAccountService[]) => {
    return accountServices.filter(accountService => accountService.ken_servicetype !== ServiceType.Credits);
  }, []);

  const getRemainingCredits = useCallback((accountServices: ICrmAccountService[]) => {
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
  }, []);

  const getTotalCredits = useCallback((accountServices: ICrmAccountService[]) => {
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
  }, []);

  const getExpiredCredits = useCallback((accountServices: ICrmAccountService[]) => {
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
  }, []);

  return (
    <>
      {ticket.customerid_account?.ken_customernote && (
        <Typography component="span">{ticket.customerid_account.ken_customernote}</Typography>
      )}
      {!(accountServices && csProjects && recentTickets) && <Loading />}
      {accountServices && csProjects && recentTickets && (
        <>
          <Typography variant="subtitle1" align="center">
            {account.credits.label}
            <Tooltip title={account.credits.remaining} aria-label={account.credits.remaining}>
              <Chip label={getRemainingCredits(accountServices)} className={styles.remainingCredits} />
            </Tooltip>
            /
            <Tooltip title={account.credits.total} aria-label={account.credits.total}>
              <Chip label={getTotalCredits(accountServices)} className={styles.totalCredits} />
            </Tooltip>
            /
            <Tooltip title={account.credits.expired} aria-label={account.credits.expired}>
              <Chip label={getExpiredCredits(accountServices)} className={styles.expiredCredits} />
            </Tooltip>
            <Tooltip title={account.credits.logCreditTask} aria-label={account.credits.logCreditTask}>
              <IconButton aria-label={account.credits.logCreditTask}>
                <AddCircle color="primary" />
              </IconButton>
            </Tooltip>
          </Typography>
          {csProjects.length > 0 && (
            <ExpandableList
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
                  <DateFromNow icon={<HourglassEmpty />} date={csProject.createdon} />
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
            <ExpandableList
              label={
                <>
                  <Typography variant="subtitle2">{account.accountServices}</Typography>
                  <Typography variant="subtitle2">{getNotCreditsAccountServices(accountServices).length}</Typography>
                </>
              }
              items={getNotCreditsAccountServices(accountServices)}
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
                accountService.ken_expireson && <DateFromNow icon={<Alarm />} date={accountService.ken_expireson} />
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
            <ExpandableList
              label={
                <>
                  <Typography variant="subtitle2">{account.recentTickets}</Typography>
                  <Typography variant="subtitle2">{recentTickets.length}</Typography>
                </>
              }
              items={recentTickets}
              selected={recentTicketIsSelected}
              expanded
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
            <ExpandableList
              label={
                <>
                  <Typography variant="subtitle2">{account.ticketEmails}</Typography>
                  <Typography variant="subtitle2">{ticketEmails.length}</Typography>
                </>
              }
              items={ticketEmails}
              selected={ticketEmailIsSelected}
              expanded
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
            <ExpandableList
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
