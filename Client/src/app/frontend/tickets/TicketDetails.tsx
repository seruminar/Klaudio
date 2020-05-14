import Linkify from 'linkifyjs/react';
import React, {
    Dispatch,
    FC,
    memo,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    Avatar,
    Chip,
    createStyles,
    Divider,
    IconButton,
    Link,
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
    Cancel,
    Edit,
    HourglassEmpty,
    NoteAdd,
    Visibility
} from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import { Link as RouteLink } from '@reach/router';

import { experience } from '../../../appSettings.json';
import { CrmEntity } from '../../../services/crmService/CrmEntity';
import { ICrmService } from '../../../services/crmService/CrmService';
import { ServiceStatus, ServiceType } from '../../../services/crmService/models/ICrmAccountService';
import { ProductFamily } from '../../../services/crmService/models/ICrmCsProject';
import { ICrmEmail } from '../../../services/crmService/models/ICrmEmail';
import { ICrmNote } from '../../../services/crmService/models/ICrmNote';
import { ICrmTag } from '../../../services/crmService/models/ICrmTag';
import { ICrmTicket } from '../../../services/crmService/models/ICrmTicket';
import { useDependency } from '../../../services/dependencyContainer';
import { systemUser } from '../../../services/systemUser';
import { account, entityNames, ticket as ticketTerms } from '../../../terms.en-us.json';
import { useSubscription, useSubscriptionEffect } from '../../../utilities/observables';
import { wait } from '../../../utilities/promises';
import { routes } from '../../routes';
import { DateFromNow } from '../../shared/DateFromNow';
import { ExpandablePanel } from '../../shared/ExpandablePanel';
import { ExpandablePanelItemMode } from '../../shared/ExpandablePanelItem';
import { Loading } from '../../shared/Loading';
import { MultilineInput } from '../../shared/MultilineInput';
import { TicketIcon } from './TicketIcon';

interface ITicketDetailsProps {
  ticket: ICrmTicket;
  emailId: string | undefined;
}

type NoteMode = "loading" | "ready";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    divider: {
      margin: theme.spacing(1, 0),
    },
    panelItemButton: {
      margin: theme.spacing(0, 0.75),
      padding: 0,
    },
    ticketEmail: {
      display: "flex",
    },
    remainingCredits: { color: theme.palette.type === "light" ? green[500] : green[200] },
    totalCredits: { color: theme.palette.type === "light" ? blue[500] : blue[200] },
    expiredCredits: { color: theme.palette.type === "light" ? red[500] : red[200] },
    addNoteWrapper: {
      position: "relative",
    },
    addNote: {
      width: "100%",
    },
    noteText: {
      whiteSpace: "pre-line",
    },
    link: {
      color: theme.palette.type === "light" ? blue[500] : blue[200],
    },
    addTag: {
      padding: theme.spacing(0.5),
    },
    attachment: {
      float: "left",
      marginRight: theme.spacing(0.5),
    },
    tagList: {
      background: theme.palette.action.selected,
      maxHeight: theme.spacing(20),
    },
    tagOption: {
      fontSize: ".8rem",
      padding: theme.spacing(0.5, 2),
    },
  })
);

export const TicketDetails: FC<ITicketDetailsProps> = memo(
  ({ ticket, emailId }) => {
    const styles = useStyles();

    const [ticketTags, setTicketTags] = useState<ICrmTag[]>();
    const [addNoteMode, setAddNoteMode] = useState<NoteMode>("ready");
    const [editNoteMode, setEditNoteMode] = useState<NoteMode>("ready");

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
    }, [ticket.customerid_account]);

    const accountServices = useSubscriptionEffect(() => {
      if (ticket.customerid_account) {
        return crmService
          .services()
          .select("ken_name", "ken_remainingcredits", "ken_credits", "statuscode", "ken_expireson", "ken_servicetype")
          .filter(`_ken_accountid_value eq ${ticket.customerid_account.accountid} and ken_servicetype ne ${ServiceType.CustomerSuccess}`)
          .orderBy("ken_expireson desc")
          .getObservable();
      }
    }, [ticket.customerid_account]);

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
            `incidentid ne ${ticket.incidentid} and _customerid_value eq ${ticket.customerid_account.accountid} and (createdon gt ${recentTicketsDate})`
          )
          .orderBy("modifiedon desc")
          .expand("customerid_account", ["ken_supportlevel"])
          .getObservable();
      }
    }, [ticket.customerid_account, ticket.incidentid, recentTicketsDate]);

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
    );

    const ticketNotes = useSubscription(
      crmService
        .tickets()
        .id(ticket.incidentid)
        .children("Incident_Annotation")
        .select("subject", "notetext", "modifiedon")
        .expand("modifiedby", ["fullname"])
        .orderBy("modifiedon desc")
        .getObservable()
    );

    const currentUser = useSubscriptionEffect(() => {
      return crmService.currentUser().getObservable();
    }, []);

    const rawTicketTags = useSubscription(
      crmService.tickets().id(ticket.incidentid).children("incident_connections1").select("name").orderBy("name desc").getObservable()
    );

    useEffect(() => {
      if (rawTicketTags) {
        setTicketTags(rawTicketTags.map((connection) => ({ dyn_tagid: "", dyn_name: connection.name })));
      }
    }, [rawTicketTags]);

    const allTags = useSubscription(
      crmService.tags().select("dyn_name").filter(`statuscode eq 1 and ken_taggroup eq 281600002`).orderBy("dyn_name").getObservable()
    );

    const ticketEmailIsSelected = useCallback(
      (ticketEmail: ICrmEmail) => {
        return emailId === ticketEmail.activityid;
      },
      [emailId]
    );

    const notCreditsAccountServices = useMemo(
      () => accountServices?.filter((accountService) => accountService.ken_servicetype !== ServiceType.Credits),
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

    const addNote = useCallback(async (value: string) => {
      setAddNoteMode("loading");

      // TEMPORARY
      await wait(1000);

      setAddNoteMode("ready");

      return "";
    }, []);

    const editNote = useCallback(
      (note: ICrmNote, setMode: Dispatch<SetStateAction<ExpandablePanelItemMode>>) => async (value: string) => {
        setEditNoteMode("loading");

        // TEMPORARY
        await wait(1000);

        setEditNoteMode("ready");

        setMode("view");
      },
      []
    );

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
                getAvatar={(csProject) => ProductFamily[csProject.ken_productfamily][0]}
                getHeading={(csProject) => csProject.ken_name}
                getRight={(csProject) => <DateFromNow icon={<Cake />} date={csProject.createdon} />}
                getText={(csProject) => (
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
                getAvatar={(accountService) => (
                  <Tooltip
                    title={entityNames.accountService[accountService.statuscode]}
                    aria-label={entityNames.accountService[accountService.statuscode]}
                  >
                    <Avatar>{entityNames.accountService[accountService.statuscode][0]}</Avatar>
                  </Tooltip>
                )}
                getHeading={(accountService) => accountService.ken_name}
                getRight={(accountService) =>
                  accountService.ken_expireson && <DateFromNow icon={<HourglassEmpty />} date={accountService.ken_expireson} />
                }
                getAction={(accountService) => (
                  <Link
                    href={crmService.crmUrl(CrmEntity.AccountService).id(accountService.ken_serviceid).build()}
                    underline="none"
                    color="textPrimary"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <IconButton aria-label="delete" className={styles.panelItemButton}>
                      <Visibility />
                    </IconButton>
                  </Link>
                )}
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
                getAvatar={(recentTicket) => <TicketIcon ticket={recentTicket} />}
                getHeading={(recentTicket) => recentTicket.title}
                getRight={(recentTicket) => recentTicket.modifiedon && <DateFromNow date={recentTicket.modifiedon} />}
                getAction={(recentTicket) => (
                  <RouteLink to={`${routes.base}${routes.tickets}/${recentTicket.ticketnumber}`}>
                    <IconButton aria-label="delete" className={styles.panelItemButton}>
                      <Visibility />
                    </IconButton>
                  </RouteLink>
                )}
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
                expanded={emailId ? ticketEmails[0].activityid !== emailId : false}
                getAvatar={(ticketEmail) => (ticketEmail.directioncode && ticketEmail.directioncode ? <CallMade /> : <CallReceived />)}
                getHeading={(ticketEmail) => ticketEmail.subject}
                getRight={(ticketEmail) => (
                  <>
                    {ticketEmail.attachmentcount !== undefined && ticketEmail.attachmentcount > 0 && (
                      <Attachment className={styles.attachment} />
                    )}
                    {ticketEmail.modifiedon && <DateFromNow date={ticketEmail.modifiedon} />}
                  </>
                )}
                getAction={(ticketEmail) => (
                  <RouteLink to={`${routes.base}${routes.tickets}/${ticket.ticketnumber}/${ticketEmail.activityid}`}>
                    <IconButton aria-label="delete" className={styles.panelItemButton}>
                      <Visibility />
                    </IconButton>
                  </RouteLink>
                )}
              />
            )}
            <div className={styles.addNoteWrapper}>
              {editNoteMode === "loading" && <Loading overlay small />}
              {ticketNotes.length > 0 && (
                <ExpandablePanel
                  label={
                    <>
                      <Typography variant="subtitle2">{account.ticketNotes}</Typography>
                      <Typography variant="subtitle2">{ticketNotes.length}</Typography>
                    </>
                  }
                  items={ticketNotes}
                  expanded
                  getHeading={(ticketNote) => ticketNote.modifiedby?.fullname}
                  getRight={(ticketNote) => <>{ticketNote.modifiedon && <DateFromNow date={ticketNote.modifiedon} />}</>}
                  getAction={(ticketNote, mode, setMode) => {
                    if (ticketNote.modifiedby?.systemuserid === currentUser?.UserId) {
                      switch (mode) {
                        case "edit":
                          return (
                            <Tooltip title={ticketTerms.cancel} aria-label={ticketTerms.cancel}>
                              <IconButton aria-label="delete" className={styles.panelItemButton} onClick={() => setMode("view")}>
                                <Cancel />
                              </IconButton>
                            </Tooltip>
                          );
                        default:
                          return (
                            <Tooltip title={ticketTerms.editNote} aria-label={ticketTerms.editNote}>
                              <IconButton aria-label="delete" className={styles.panelItemButton} onClick={() => setMode("edit")}>
                                <Edit />
                              </IconButton>
                            </Tooltip>
                          );
                      }
                    }
                  }}
                  getText={(ticketNote, mode, setMode) => {
                    switch (mode) {
                      case "edit":
                        return (
                          <MultilineInput
                            className={styles.addNote}
                            value={ticketNote.notetext}
                            actionLabel={ticketTerms.editNote}
                            action={editNote(ticketNote, setMode)}
                          />
                        );

                      default:
                        return (
                          <>
                            {ticketNote.subject && <Typography variant="subtitle2">{ticketNote.subject}</Typography>}
                            <Typography variant="caption" color="textPrimary" className={styles.noteText}>
                              <Linkify options={{ className: styles.link }}>{ticketNote.notetext}</Linkify>
                            </Typography>
                          </>
                        );
                    }
                  }}
                />
              )}
            </div>
            <div className={styles.addNoteWrapper}>
              {addNoteMode === "loading" && <Loading overlay small />}
              <MultilineInput
                className={styles.addNote}
                placeholder={ticketTerms.addNote}
                actionLabel={ticketTerms.addNote}
                action={addNote}
                actionButton={<NoteAdd />}
              />
            </div>
            <Divider className={styles.divider} />
            {!allTags && <Loading />}
            {allTags && (
              <Autocomplete
                multiple
                size="small"
                options={allTags}
                filterSelectedOptions
                getOptionLabel={(option) => option.dyn_name}
                getOptionSelected={(option, value) => option.dyn_name === value.dyn_name}
                value={ticketTags}
                onChange={(_event: any, newValue: any) => {
                  setTicketTags((ticketTags) => (newValue ? newValue : ticketTags));
                }}
                classes={{ listbox: styles.tagList, option: styles.tagOption }}
                renderInput={(params) => <TextField {...params} variant="outlined" label={account.caseTags} />}
              />
            )}
          </>
        )}
      </>
    );
  },
  (previous, next) => previous.ticket.modifiedon === next.ticket.modifiedon && previous.emailId === next.emailId
);
