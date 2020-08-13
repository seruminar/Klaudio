import DOMPurify from 'dompurify';
import Linkify from 'linkifyjs/react';
import React, {
    Dispatch,
    FC,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react';
import sortArray from 'sort-array';

import {
    Avatar,
    Chip,
    createStyles,
    Divider,
    Grid,
    IconButton,
    Link,
    makeStyles,
    TextField,
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
    LastPage,
    NoteAdd,
    Visibility
} from '@material-ui/icons';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import { Link as RouteLink } from '@reach/router';

import { experience } from '../../../appSettings.json';
import { useDependency } from '../../../dependencyContainer';
import { CrmEntity } from '../../../services/crmService/CrmEntity';
import { ICrmService } from '../../../services/crmService/CrmService';
import { ICrmServiceCache } from '../../../services/crmService/CrmServiceCache';
import { ICrmAccountService } from '../../../services/crmService/models/ICrmAccountService';
import { ICrmConnection } from '../../../services/crmService/models/ICrmConnection';
import { ICrmEmail } from '../../../services/crmService/models/ICrmEmail';
import { ICrmNote } from '../../../services/crmService/models/ICrmNote';
import { ICrmTag } from '../../../services/crmService/models/ICrmTag';
import { ICrmTicket } from '../../../services/crmService/models/ICrmTicket';
import { ProductFamily } from '../../../services/crmService/models/ProductFamily';
import { ServiceStatus } from '../../../services/crmService/models/ServiceStatus';
import { ServiceType } from '../../../services/crmService/models/ServiceType';
import { TagGroup } from '../../../services/crmService/models/TagGroup';
import { TagStatus } from '../../../services/crmService/models/TagStatus';
import { systemUser } from '../../../services/systemUser';
import { account, email, entityNames, ticket as ticketTerms } from '../../../terms.en-us.json';
import { useSubscription, useSubscriptionEffect } from '../../../utilities/observables';
import { wait } from '../../../utilities/promises';
import { format } from '../../../utilities/strings';
import { routes } from '../../routes';
import { DateFromNow } from '../../shared/DateFromNow';
import { ExpandablePanel } from '../../shared/ExpandablePanel';
import { ExpandablePanelItemMode } from '../../shared/ExpandablePanelItem';
import { Loading } from '../../shared/Loading';
import { MultilineInput } from '../../shared/MultilineInput';
import { LogCreditsDialog } from '../dialogs/LogCreditsDialog';
import { TicketIcon } from './TicketIcon';

interface ITicketDetailsProps {
  ticket: ICrmTicket;
  emailId: string | undefined;
}

interface ITagConnection {
  tag: ICrmTag;
  connection?: ICrmConnection;
}

const useStyles = makeStyles((theme) =>
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
    statusCredits: { alignItems: "center" },
    status: { height: theme.spacing(3) },
    spacer: {
      flex: 1,
    },
    remainingCredits: { backgroundColor: "initial", color: theme.palette.type === "light" ? green[500] : green[200] },
    totalCredits: { backgroundColor: "initial", color: theme.palette.type === "light" ? blue[500] : blue[200] },
    expiredCredits: { backgroundColor: "initial", color: theme.palette.type === "light" ? red[500] : red[200] },
    logCreditTask: { padding: theme.spacing(0.25) },
    latestEmailWrapper: { display: "flex", alignItems: "center" },
    latestEmailLink: { textDecoration: "none", margin: theme.spacing(0, 1, 0, 0) },
    latestEmailButton: {
      backgroundColor: theme.palette.primary.main,
      margin: theme.spacing(0.5),
      padding: theme.spacing(0.25, 0.75),
      borderRadius: theme.spacing(0.5),
      display: "flex",
      color: theme.palette.common.white,
      "& > span": {
        fontSize: theme.spacing(1.5),
        lineHeight: `${theme.spacing(3.125)}px`,
      },
    },
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
    noTags: {
      padding: "initial",
    },
  })
);

export const TicketDetails: FC<ITicketDetailsProps> = ({ ticket, emailId }) => {
  const styles = useStyles();

  const [ticketTagConnections, setTicketTagConnections] = useState<ITagConnection[]>();
  const [addNoteMode, setAddNoteMode] = useState<"loading" | "ready">("ready");
  const [editNoteMode, setEditNoteMode] = useState<"loading" | "ready">("ready");
  const [updateTagsMode, setUpdateTagsMode] = useState<"loading" | "ready">("ready");
  const [logCreditTaskOpen, setLogCreditTaskOpen] = useState(false);
  const [bestCreditsService, setBestCreditsService] = useState<ICrmAccountService>();

  const crmService = useDependency(ICrmService);
  const crmServiceCache = useDependency(ICrmServiceCache);

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

  const currentUser = useSubscription(crmService.currentUser().getObservable());

  const ticketConnections = useSubscription(
    crmService
      .tickets()
      .id(ticket.incidentid)
      .children("incident_connections1")
      .select("name")
      .orderBy("name desc")
      .expand("record1id_incident", ["incidentid"])
      .expand("record2id_dyn_tag", ["dyn_tagid"])
      .getObservable()
  );

  const allTags = useSubscription(
    crmService
      .tags()
      .select("dyn_name")
      .filter(`statuscode eq ${TagStatus.Active} and ken_taggroup eq ${TagGroup.Support}`)
      .orderBy("dyn_name")
      .getObservable()
  );

  useEffect(() => {
    if (ticketConnections && allTags) {
      const ticketTagConnections = allTags.map((tag) => {
        const connection = ticketConnections.find((connection) => connection.record2id_dyn_tag?.dyn_tagid === tag.dyn_tagid);

        if (connection) {
          return { tag, connection };
        }

        return { tag };
      });

      setTicketTagConnections(ticketTagConnections);
      setUpdateTagsMode("ready");
    }
  }, [ticketConnections, allTags]);

  const tagFilterOptions = useMemo(
    () =>
      createFilterOptions<ITagConnection>({
        limit: 10,
        stringify: (option) => {
          const tagName = option.tag.dyn_name;

          if (tagName) {
            return (
              tagName +
              tagName.replace(" ", "") +
              tagName
                .split(" ")
                .map((part) => part[0])
                .join("")
            );
          }

          return "";
        },
      }),
    []
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

  const ticketEmailIsSelected = useCallback(
    (ticketEmail: ICrmEmail) => {
      return emailId === ticketEmail.activityid;
    },
    [emailId]
  );

  const updateTicketTags = useCallback(
    async (value: ITagConnection[]) => {
      if (ticketTagConnections) {
        setUpdateTagsMode("loading");

        const selected = ticketTagConnections.filter((tagConnection) => tagConnection.connection !== undefined);

        for (const tagConnection of selected) {
          if (
            !value.some((newTagConnection) => newTagConnection.tag.dyn_tagid === tagConnection.tag.dyn_tagid) &&
            tagConnection.connection
          ) {
            await crmService.connections().delete(tagConnection.connection.connectionid);
          }
        }

        for (const tagConnection of value) {
          if (!selected.some((oldTagConnection) => oldTagConnection.tag.dyn_tagid === tagConnection.tag.dyn_tagid)) {
            await crmService.connections().insert({
              "record1id_incident@odata.bind": `/incidents(${ticket.incidentid})`,
              "record2id_dyn_tag@odata.bind": `/dyn_tags(${tagConnection.tag.dyn_tagid})`,
            });
          }
        }

        await wait(100);

        crmServiceCache.refresh("incident_connections1");
      }
    },
    [ticketTagConnections, crmService, ticket.incidentid, crmServiceCache]
  );

  const logCreditTask = useCallback(() => {
    if (accountServices) {
      const validCreditsServices = accountServices
        .filter((accountService) => accountService.ken_servicetype === ServiceType.Credits)
        .filter((accountService) => accountService.statuscode === ServiceStatus.Purchased);

      setBestCreditsService(
        sortArray(validCreditsServices, {
          by: ["ken_expireson", "ken_remainingcredits"],
          order: ["asc", "asc"],
        })[0]
      );
      setLogCreditTaskOpen(true);
    }
  }, [accountServices]);

  const addNote = useCallback(
    async (value: string) => {
      setAddNoteMode("loading");

      await crmService.notes().insert({ notetext: value, "objectid_incident@odata.bind": `/incidents(${ticket.incidentid})` });

      await wait(experience.apiDelay);

      crmServiceCache.refresh("Incident_Annotation");

      setAddNoteMode("ready");

      return "";
    },
    [crmService, ticket.incidentid, crmServiceCache]
  );

  const editNote = useCallback(
    (note: ICrmNote, setMode: Dispatch<SetStateAction<ExpandablePanelItemMode>>) => async (value: string) => {
      setEditNoteMode("loading");

      await crmService.notes().upsert(note.annotationid, { notetext: value });

      await wait(experience.apiDelay);

      crmServiceCache.refresh("Incident_Annotation");

      setEditNoteMode("ready");

      setMode("view");
    },
    [crmService, crmServiceCache]
  );

  return (
    <>
      {bestCreditsService && (
        <LogCreditsDialog
          open={logCreditTaskOpen}
          setOpen={setLogCreditTaskOpen}
          creditsService={bestCreditsService}
          ticket={ticket}
          onClose={() => setLogCreditTaskOpen(false)}
        />
      )}
      {ticket.customerid_account?.ken_customernote && (
        <Typography component="span">{ticket.customerid_account.ken_customernote}</Typography>
      )}
      {ticket.customerid_account && !(accountServices && csProjects && recentTickets) && <Loading />}
      {ticket.customerid_account && accountServices && csProjects && recentTickets && (
        <>
          <Grid container className={styles.statusCredits}>
            <Grid item>
              {ticket.statuscode && <Chip color="primary" className={styles.status} label={entityNames.ticketStatus[ticket.statuscode]} />}
            </Grid>
            <Grid item className={styles.spacer} />
            <Grid item>
              {account.credits.label}
              <Tooltip title={account.credits.remaining} aria-label={account.credits.remaining}>
                <Chip label={remainingCredits} className={styles.remainingCredits} />
              </Tooltip>
              |
              <Tooltip title={account.credits.total} aria-label={account.credits.total}>
                <Chip label={totalCredits} className={styles.totalCredits} />
              </Tooltip>
              |
              <Tooltip title={account.credits.expired} aria-label={account.credits.expired}>
                <Chip label={expiredCredits} className={styles.expiredCredits} />
              </Tooltip>
              <Tooltip title={account.credits.logCreditTask} aria-label={account.credits.logCreditTask}>
                <IconButton className={styles.logCreditTask} aria-label={account.credits.logCreditTask} onClick={logCreditTask}>
                  <AddCircle color="primary" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
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
                  <IconButton className={styles.panelItemButton}>
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
                  <IconButton className={styles.panelItemButton}>
                    <Visibility />
                  </IconButton>
                </RouteLink>
              )}
            />
          )}
        </>
      )}
      {!(ticketEmails && ticketNotes && ticketTagConnections) && <Loading />}
      {ticketEmails && ticketNotes && ticketTagConnections && (
        <>
          {ticketEmails.length > 0 && (
            <ExpandablePanel
              label={
                <>
                  <Typography variant="subtitle2">{account.ticketEmails}</Typography>
                  <div className={styles.latestEmailWrapper} onClick={(event) => event.stopPropagation()}>
                    {emailId && emailId !== ticketEmails[0].activityid && (
                      <RouteLink
                        to={`${routes.base}${routes.tickets}/${ticket.ticketnumber}/${ticketEmails[0].activityid}`}
                        className={styles.latestEmailLink}
                      >
                        <div className={styles.latestEmailButton}>
                          <Typography variant="button">{ticketTerms.latestEmail}</Typography>
                          <LastPage />
                        </div>
                      </RouteLink>
                    )}
                    <Typography variant="subtitle2">{ticketEmails.length}</Typography>
                  </div>
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
                    <Tooltip
                      title={format(email.attachments, ticketEmail.attachmentcount.toString())}
                      aria-label={format(email.attachments, ticketEmail.attachmentcount.toString())}
                    >
                      <Attachment className={styles.attachment} />
                    </Tooltip>
                  )}
                  {ticketEmail.modifiedon && <DateFromNow date={ticketEmail.modifiedon} />}
                </>
              )}
              getAction={(ticketEmail) => (
                <RouteLink to={`${routes.base}${routes.tickets}/${ticket.ticketnumber}/${ticketEmail.activityid}`}>
                  <IconButton className={styles.panelItemButton}>
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
                            <IconButton aria-label={ticketTerms.cancel} className={styles.panelItemButton} onClick={() => setMode("view")}>
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        );
                      default:
                        return (
                          <Tooltip title={ticketTerms.editNote} aria-label={ticketTerms.editNote}>
                            <IconButton
                              aria-label={ticketTerms.editNote}
                              className={styles.panelItemButton}
                              onClick={() => setMode("edit")}
                            >
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
                          value={DOMPurify.sanitize(ticketNote.notetext, { ALLOWED_TAGS: [] })}
                          actionLabel={ticketTerms.submit}
                          action={editNote(ticketNote, setMode)}
                        />
                      );

                    default:
                      return (
                        <>
                          {ticketNote.subject && <Typography variant="subtitle2">{ticketNote.subject}</Typography>}
                          <Typography variant="caption" color="textPrimary" className={styles.noteText}>
                            <Linkify options={{ className: styles.link }}>
                              {DOMPurify.sanitize(ticketNote.notetext, { ALLOWED_TAGS: [] })}
                            </Linkify>
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
          {updateTagsMode === "loading" && <Loading />}
          {updateTagsMode === "ready" && (
            <Autocomplete
              multiple
              size="small"
              options={ticketTagConnections}
              filterSelectedOptions
              classes={{ listbox: styles.tagList, option: styles.tagOption, noOptions: styles.noTags }}
              noOptionsText=""
              value={ticketTagConnections.filter((tagConnection) => tagConnection.connection !== undefined)}
              onChange={async (_event, value) => await updateTicketTags(value)}
              getOptionLabel={(option) => option.tag.dyn_name ?? ""}
              getOptionSelected={(option, value) => option.tag.dyn_name === value.tag.dyn_name}
              filterOptions={tagFilterOptions}
              renderInput={(params) => <TextField {...params} variant="outlined" label={account.caseTags} />}
            />
          )}
        </>
      )}
    </>
  );
};
