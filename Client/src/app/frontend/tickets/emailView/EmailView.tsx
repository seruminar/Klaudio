import moment from 'moment';
import React, { createContext, FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { BehaviorSubject } from 'rxjs';
import sortArray from 'sort-array';

import {
    Avatar,
    Chip,
    createStyles,
    Dialog,
    DialogTitle,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    makeStyles,
    Tooltip,
    Typography
} from '@material-ui/core';
import {
    AccountBalance,
    AttachFile,
    BugReport,
    Cached,
    Edit,
    Feedback,
    FlashOn,
    People,
    PersonAdd,
    Reply,
    Send,
    Update
} from '@material-ui/icons';
import { navigate } from '@reach/router';

import { useDependency } from '../../../../dependencyContainer';
import { CrmEntity } from '../../../../services/crmService/CrmEntity';
import { ICrmService } from '../../../../services/crmService/CrmService';
import { ICrmServiceCache } from '../../../../services/crmService/CrmServiceCache';
import { EmailStatus } from '../../../../services/crmService/models/EmailStatus';
import { ICrmAttachment } from '../../../../services/crmService/models/ICrmAttachment';
import { ICrmEmail } from '../../../../services/crmService/models/ICrmEmail';
import { ICrmParty } from '../../../../services/crmService/models/ICrmParty';
import { ICrmTicket } from '../../../../services/crmService/models/ICrmTicket';
import { ICrmUser } from '../../../../services/crmService/models/ICrmUser';
import { ParticipationType } from '../../../../services/crmService/models/ParticipationType';
import { TicketGroup } from '../../../../services/crmService/models/TicketGroup';
import { ticketGroupIds } from '../../../../services/crmService/models/ticketGroupIds';
import { TicketPriority } from '../../../../services/crmService/models/TicketPriority';
import { TicketStatus } from '../../../../services/crmService/models/TicketStatus';
import { systemUser } from '../../../../services/systemUser';
import {
    email as emailTerms,
    entityNames,
    ticket as ticketTerms
} from '../../../../terms.en-us.json';
import { deleteFrom } from '../../../../utilities/arrays';
import { getSizeText } from '../../../../utilities/numbers';
import { useSubscription, useSubscriptionEffect } from '../../../../utilities/observables';
import { wait } from '../../../../utilities/promises';
import { format } from '../../../../utilities/strings';
import { routes } from '../../../routes';
import { ExpandableList } from '../../../shared/ExpandableList';
import { Loading } from '../../../shared/Loading';
import { Menu } from '../../../shared/Menu';
import { SendSave } from '../../../shared/SendSave';
import { TicketIcon } from '../TicketIcon';
import { getFileIcon } from '../ticketUtilities';
import { EditableEmails } from './EditableEmails';
import { EmailEditor } from './EmailEditor';
import { EmailMetadata } from './EmailMetadata';
import { IEmailRecipient } from './IEmailRecipient';

interface IEmailContext {
  mode: EmailViewMode;
  setMode: (mode: EmailViewMode) => void;

  ticket?: ICrmTicket;
  email?: ICrmEmail;
}

export const EmailContext = createContext<IEmailContext>({
  mode: "loading",
  setMode: () => {},
});

interface IEmailViewProps {
  ticket: ICrmTicket;
  emailId: string;
  users: ICrmUser[] | undefined;
}

export type EmailViewMode = "newReply" | "edit" | "view" | "viewDraft" | "loading" | "editLoading";

const useStyles = makeStyles((theme) =>
  createStyles({
    emailContent: {
      minHeight: 0,
      flex: 1,
      width: "100%",
      display: "flex",
      position: "relative",
    },
    container: {
      flex: 1,
    },
    spacer: {
      flex: 1,
    },
    recipients: {
      margin: theme.spacing(0, 0, 1),
    },
    attachment: {
      margin: theme.spacing(0.5),
    },
    assignToList: {
      maxHeight: theme.spacing(40),
      overflowY: "scroll",
    },
  })
);

export const EmailView: FC<IEmailViewProps> = ({ ticket, emailId, users }) => {
  const styles = useStyles();

  const [caseAttachments, setCaseAttachments] = useState<ICrmAttachment[]>();
  const [toEmails, setToEmails] = useState<IEmailRecipient[]>([]);
  const [ccEmails, setCcEmails] = useState<IEmailRecipient[]>([]);
  const [bccEmails, setBccEmails] = useState<IEmailRecipient[]>([]);
  const [assignToOpen, setAssignToOpen] = useState(false);

  const [mode, setMode] = useState<EmailViewMode>("loading");

  const crmService = useDependency(ICrmService);
  const crmServiceCache = useDependency(ICrmServiceCache);

  const currentUser = useSubscription(crmService.currentUser().getObservable());

  const emailFilter = `sender ne '${systemUser.internalemailaddress}' and isworkflowcreated ne true`;

  const email = useSubscription(
    crmService
      .tickets()
      .id(ticket.incidentid)
      .children("Incident_Emails")
      .select("statuscode", "senton", "createdon", "modifiedon", "subject", "sender", "trackingtoken", "torecipients")
      .filter(`${emailFilter} and activityid eq ${emailId}`)
      .top(1)
      .orderBy("createdon desc")
      .getObservable()
  )?.[0];

  const rawEmailContent = useSubscriptionEffect(() => {
    if (email?.activityid) {
      return crmService
        .emailBody()
        .id(email.activityid)
        .shouldCache(() => email.statuscode === EmailStatus.Draft)
        .getObservable();
    }
  }, [email]);

  const rawCaseAttachments = useSubscription(
    crmService
      .tickets()
      .id(ticket.incidentid)
      .children("Incident_Emails")
      .select("activityid")
      .filter(emailFilter)
      .orderBy("createdon desc")
      .expand("email_activity_mime_attachment", ["filename", "mimetype", "_objectid_value", "attachmentcontentid"])
      .getObservable()
  );

  const emailAttachmentsData = useSubscriptionEffect(() => {
    if (rawEmailContent) {
      const cidsFilter = [...rawEmailContent.matchAll(/src="cid:(.*?)"/g)]
        .map((match) => `attachmentcontentid eq '{cid:${match[1]}}'`)
        .join(" or ");

      if (cidsFilter !== "") {
        return crmService.attachments().select("attachmentcontentid", "body").filter(cidsFilter).getObservable();
      }

      return new BehaviorSubject<ICrmAttachment[] | undefined>([]);
    }
  }, [rawEmailContent, crmService]);

  const emailContent = useMemo(() => {
    if (rawEmailContent && emailAttachmentsData) {
      let result = rawEmailContent;

      for (const attachment of emailAttachmentsData) {
        result = result.replace(`src="${attachment.attachmentcontentid?.slice(1, -1)}"`, `src="data:image/png;base64,${attachment.body}"`);
      }

      return result.replace(/<style[^</]*<\/style>/gi, "");
    }
  }, [rawEmailContent, emailAttachmentsData]);

  useEffect(() => {
    if (rawEmailContent && rawCaseAttachments && emailAttachmentsData) {
      const matches = [...rawEmailContent.matchAll(/AttachmentId=([0-9a-f-]{36}).*?&amp;CRMWRPCToken/g)].map((match) => match[1]);

      let caseAttachments = rawCaseAttachments
        .flatMap((email) => email.email_activity_mime_attachment)
        .filter((caseAttachment) => !matches.find((match) => caseAttachment.activitymimeattachmentid === match))
        .filter(
          (caseAttachment) =>
            !emailAttachmentsData.find((attachment) => caseAttachment.activitymimeattachmentid === attachment.activitymimeattachmentid)
        );

      setCaseAttachments(caseAttachments);
    }
  }, [rawEmailContent, rawCaseAttachments, emailAttachmentsData]);

  useEffect(() => {
    if (ticket && email && caseAttachments && mode === "loading") {
      switch (email.statuscode) {
        case EmailStatus.Draft:
          setMode("viewDraft");
          break;
        default:
          setMode("view");
          break;
      }
    }
  }, [ticket, email, caseAttachments, mode]);

  useEffect(() => {
    if (email?.torecipients) {
      const toEmails = email.torecipients
        .split(";")
        .filter((recipient) => !!recipient)
        .map((recipient) => ({ email: recipient }));

      setToEmails(toEmails);
    }
  }, [email]);

  const parties = useSubscriptionEffect(() => {
    if (email?.activityid) {
      return crmService
        .emails()
        .id(email.activityid)
        .children("email_activity_parties")
        .select("addressused", "participationtypemask")
        .expand("partyid_contact", ["fullname"])
        .getObservable();
    }
  }, [email]);

  useEffect(() => {
    if (parties) {
      const ccEmails = parties
        .filter((party) => party.participationtypemask === ParticipationType.CcRecipient)
        .map((party) => ({ name: party.partyid_contact?.fullname, email: party.addressused }));

      setCcEmails(ccEmails);

      const bccEmails = parties
        .filter((party) => party.participationtypemask === ParticipationType.BccRecipient)
        .map((party) => ({ name: party.partyid_contact?.fullname, email: party.addressused }));

      setBccEmails(bccEmails);
    }
  }, [parties]);

  const emailAttachments = useMemo(() => {
    if (caseAttachments && email) {
      const emailAttachments = caseAttachments.filter((attachment) => attachment._objectid_value === email.activityid);

      return sortArray(emailAttachments, {
        by: "filesize",
        order: "desc",
      });
    }
  }, [caseAttachments, email]);

  const otherAttachments = useMemo(() => {
    if (caseAttachments && email) {
      const emailAttachments = caseAttachments.filter((attachment) => attachment._objectid_value !== email.activityid);

      return sortArray(emailAttachments, {
        by: "filesize",
        order: "desc",
      });
    }
  }, [caseAttachments, email]);

  const setStatus = useCallback(
    async (status: TicketStatus) => {
      setMode("loading");

      await crmService.tickets().upsert(ticket.incidentid, { statuscode: status });
      await wait(1000);
      crmServiceCache.refresh("incidents");

      setMode("view");
    },
    [crmService, ticket.incidentid, crmServiceCache]
  );

  const setPriority = useCallback(
    async (priority: TicketPriority) => {
      setMode("loading");

      await crmService.tickets().upsert(ticket.incidentid, { prioritycode: priority });

      await wait(1000);

      crmServiceCache.refresh("incidents");

      setMode("view");
    },
    [crmService, ticket.incidentid, crmServiceCache]
  );

  const assignUser = useCallback(
    async (user: ICrmUser | undefined) => {
      setAssignToOpen(false);
      setMode("loading");

      if (user) {
        let ticketGroup = TicketGroup.Support;

        if (user.address1_telephone3) {
          switch (user.address1_telephone3) {
            case "supportconsultingplugin":
            case "consultingplugin":
              ticketGroup = TicketGroup.Consulting;
              break;
            case "salesplugin":
              ticketGroup = TicketGroup.SalesEngineering;
              break;
            case "trainingplugin":
              ticketGroup = TicketGroup.Training;
              break;
          }
        }

        await crmService
          .tickets()
          .upsert(ticket.incidentid, { "ownerid@odata.bind": `/systemusers(${user.systemuserid})`, dyn_ticket_group: ticketGroup });

        await wait(1000);

        crmServiceCache.refresh("incidents");

        setMode("view");
      }
    },
    [crmService, ticket.incidentid, crmServiceCache]
  );

  const newEmail = useCallback(
    (email: ICrmEmail) => async () => {
      setMode("loading");

      if (ticket.dyn_ticket_group && parties && email.subject && email.trackingtoken) {
        const queueId = ticketGroupIds[ticket.dyn_ticket_group];

        const newParties = parties;

        const queueParty: Partial<ICrmParty> = {
          "partyid_queue@odata.bind": `/queues(${queueId})`,
          participationtypemask: ParticipationType.Sender,
        };

        newParties.push(queueParty as ICrmParty);

        const response = await crmService.emails().insert({
          subject: format(emailTerms.newReply, email.subject, email.trackingtoken),
          description: email.description,
          trackingtoken: email.trackingtoken,
          email_activity_parties: newParties,
          "regardingobjectid_incident@odata.bind": `/incidents(${ticket.incidentid})`,
          "parentactivityid@odata.bind": `/emails(${email.activityid})`,
        });

        await wait(1000);

        crmServiceCache.refresh("incidents");
        crmServiceCache.refresh("Incident_Emails");

        const newEmailId = response.headers.get("Odata-EntityId")?.match(/\((.*)\)/)?.[1];

        if (newEmailId) {
          await navigate(`${routes.base}${routes.tickets}/${ticket.ticketnumber}/${newEmailId}`);
        }

        setMode("newReply");
      }
    },
    [ticket.dyn_ticket_group, ticket.incidentid, ticket.ticketnumber, parties, crmService, crmServiceCache]
  );

  const editEmail = useCallback(
    (email: ICrmEmail) => async () => {
      // TEMPORARY
      setMode("edit");
    },
    []
  );

  const sendEmail = useCallback(
    (email: ICrmEmail, keepStatus: boolean) => async () => {
      setMode("loading");

      // TEMPORARY
      await wait(1000);

      setMode("view");
    },
    []
  );

  const downloadAttachment = useCallback(
    async (id: string) => {
      crmService
        .attachments()
        .id(id)
        .select("body", "filename")
        .getObservable()
        .subscribe((attachment) => {
          if (attachment && attachment.body && attachment.filename) {
            const fakeAnchor = document.createElement("a");

            const bodyBytes = Uint8Array.from([...atob(attachment.body)].map((char) => char.charCodeAt(0)));

            const url = URL.createObjectURL(new Blob([bodyBytes]));

            fakeAnchor.href = url;
            fakeAnchor.download = attachment.filename;

            document.body.appendChild(fakeAnchor);

            fakeAnchor.click();

            URL.revokeObjectURL(url);
          }
        });
    },
    [crmService]
  );

  const removeAttachment = useCallback(
    (attachment: ICrmAttachment) => {
      if (caseAttachments) {
        setCaseAttachments(deleteFrom(attachment, caseAttachments));
      }
    },
    [caseAttachments]
  );

  const emailContext = { mode, setMode, ticket, email };

  return (
    <>
      {users && (
        <Dialog open={assignToOpen} onClose={() => setAssignToOpen(false)}>
          <DialogTitle>{ticketTerms.assignTo}</DialogTitle>
          <List dense className={styles.assignToList}>
            {users
              .filter((user) => user.systemuserid !== ticket._ownerid_value)
              .map((user) => (
                <ListItem button key={user.systemuserid} onClick={async () => await assignUser(user)}>
                  <ListItemAvatar>
                    <Avatar>{user.address1_telephone3 ? entityNames.userType[user.address1_telephone3] : ""}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={user.fullname} />
                </ListItem>
              ))}
          </List>
        </Dialog>
      )}
      {!(ticket && email && emailAttachments && otherAttachments) && <Loading />}
      {ticket && email && emailAttachments && otherAttachments && (
        <EmailContext.Provider value={emailContext}>
          <Helmet>
            <title>
              {ticketTerms.case}
              {ticket.title}
            </title>
          </Helmet>
          <Grid container className={styles.container} direction="column" justify="flex-start">
            <Grid container justify="space-between">
              <Grid item className={styles.container}>
                <Typography variant="h6">{email.subject}</Typography>
              </Grid>
              <Grid item>
                <Chip
                  color="secondary"
                  label={`${email.statuscode && entityNames.emailStatus[email.statuscode]}
                    ${moment(email.modifiedon).format("LLL")}`}
                />
              </Grid>
            </Grid>
            <Grid container direction="row">
              <TicketIcon ticket={ticket} />
              <EmailMetadata ticket={ticket} email={email} toEmails={toEmails} ccEmails={ccEmails} bccEmails={bccEmails} />
              <div className={styles.spacer} />
              {(mode === "view" || mode === "loading") && email.statuscode !== EmailStatus.Draft && (
                <Tooltip title={emailTerms.reply} aria-label={emailTerms.reply}>
                  <IconButton onClick={newEmail(email)}>
                    <Reply />
                  </IconButton>
                </Tooltip>
              )}
              {(mode === "view" || mode === "loading") && email.statuscode === EmailStatus.Draft && (
                <Tooltip title={emailTerms.reply} aria-label={emailTerms.reply}>
                  <IconButton onClick={editEmail(email)}>
                    <Edit />
                  </IconButton>
                </Tooltip>
              )}
              {(mode === "edit" || mode === "editLoading") && (
                <Tooltip title={emailTerms.send} aria-label={emailTerms.send}>
                  <IconButton onClick={sendEmail(email, false)}>
                    <Send color="primary" />
                  </IconButton>
                </Tooltip>
              )}
              {(mode === "edit" || mode === "editLoading") && (
                <Tooltip title={emailTerms.sendKeepStatus} aria-label={emailTerms.send}>
                  <IconButton onClick={sendEmail(email, true)}>
                    <SendSave />
                  </IconButton>
                </Tooltip>
              )}
              {!currentUser && <Loading small />}
              {currentUser && users && (
                <Tooltip title={emailTerms.assignToMe} aria-label={emailTerms.assignToMe}>
                  <IconButton onClick={async () => await assignUser(users.find((user) => user.systemuserid === currentUser.UserId))}>
                    <PersonAdd />
                  </IconButton>
                </Tooltip>
              )}
              <Menu
                tooltip={emailTerms.setStatus}
                icon={<Update />}
                options={[
                  ticket.statuscode !== TicketStatus.Queue && {
                    label: entityNames.ticketStatus[TicketStatus.Queue],
                    onClick: () => setStatus(TicketStatus.Queue),
                  },
                  ticket.statuscode !== TicketStatus.Waiting && {
                    label: entityNames.ticketStatus[TicketStatus.Waiting],
                    onClick: () => setStatus(TicketStatus.Waiting),
                  },
                  ticket.statuscode !== TicketStatus.Solved && {
                    label: entityNames.ticketStatus[TicketStatus.Solved],
                    onClick: () => setStatus(TicketStatus.Solved),
                  },
                  ticket.statuscode !== TicketStatus.Closed && {
                    label: entityNames.ticketStatus[TicketStatus.Closed],
                    onClick: () => setStatus(TicketStatus.Closed),
                  },
                ]}
              />
              <Menu
                tooltip={emailTerms.setPriority}
                icon={<FlashOn />}
                options={[
                  ticket.prioritycode !== TicketPriority.Normal && {
                    label: entityNames.ticketPriority[TicketPriority.Normal],
                    onClick: () => setPriority(TicketPriority.Normal),
                  },
                  ticket.prioritycode !== TicketPriority.WaitingForDevelopers && {
                    label: entityNames.ticketPriority[TicketPriority.WaitingForDevelopers],
                    onClick: () => setPriority(TicketPriority.WaitingForDevelopers),
                  },
                  ticket.prioritycode !== TicketPriority.Processed && {
                    label: entityNames.ticketPriority[TicketPriority.Processed],
                    onClick: () => setPriority(TicketPriority.Processed),
                  },
                  ticket.prioritycode !== TicketPriority.LowPriority && {
                    label: entityNames.ticketPriority[TicketPriority.LowPriority],
                    onClick: () => setPriority(TicketPriority.LowPriority),
                  },
                  ticket.prioritycode !== TicketPriority.HighPriority && {
                    label: entityNames.ticketPriority[TicketPriority.HighPriority],
                    onClick: () => setPriority(TicketPriority.HighPriority),
                  },
                  ticket.prioritycode !== TicketPriority.FireFighting && {
                    label: entityNames.ticketPriority[TicketPriority.FireFighting],
                    onClick: () => setPriority(TicketPriority.FireFighting),
                  },
                ]}
              />
              <Menu
                tooltip={emailTerms.more}
                options={[
                  { icon: <People />, label: emailTerms.assignTo, onClick: () => setAssignToOpen(true) },
                  { icon: <Cached />, label: emailTerms.handOver },
                  { icon: <Feedback />, label: emailTerms.submitFeedback },
                  {
                    icon: <BugReport />,
                    label: emailTerms.submitBug,
                    target: crmService.crmUrl(CrmEntity.Jira).id(ticket.incidentid).build(),
                  },
                  {
                    icon: <AccountBalance />,
                    label: emailTerms.openInCrm,
                    target: crmService.crmUrl(CrmEntity.Ticket).id(ticket.incidentid).build(),
                  },
                ]}
              />
            </Grid>
            {(mode === "edit" || mode === "editLoading") && (
              <ExpandableList className={styles.recipients} tooltip={[emailTerms.showCcBcc, emailTerms.hideCcBcc]} collapsedHeight={6}>
                <EditableEmails value={toEmails} setValue={setToEmails} label={emailTerms.to} />
                <EditableEmails value={ccEmails} setValue={setCcEmails} label={emailTerms.cc} />
                <EditableEmails value={bccEmails} setValue={setBccEmails} label={emailTerms.bcc} />
              </ExpandableList>
            )}
            <Grid className={styles.recipients}>
              {emailAttachments.length + otherAttachments.length > 0 && (
                <ExpandableList showOverlay tooltip={[emailTerms.more, emailTerms.less]}>
                  {(mode === "edit" || mode === "editLoading") && (
                    <Chip
                      className={styles.attachment}
                      clickable
                      size="small"
                      label={emailTerms.addAttachment}
                      color="primary"
                      icon={<AttachFile />}
                    />
                  )}
                  {emailAttachments.map((attachment) => {
                    const [size, unit] = getSizeText(attachment.filesize);

                    return (
                      <Chip
                        key={attachment.activitymimeattachmentid}
                        className={styles.attachment}
                        clickable
                        onClick={() => downloadAttachment(attachment.activitymimeattachmentid)}
                        onDelete={mode === "edit" ? () => removeAttachment(attachment) : undefined}
                        size="small"
                        variant="default"
                        icon={getFileIcon(attachment.mimetype ?? "")}
                        label={`${attachment.filename} ${size} ${unit}`}
                      />
                    );
                  })}
                  {otherAttachments.map((attachment) => {
                    const [size, unit] = getSizeText(attachment.filesize);

                    return (
                      <Chip
                        key={attachment.activitymimeattachmentid}
                        className={styles.attachment}
                        clickable
                        onClick={() => downloadAttachment(attachment.activitymimeattachmentid)}
                        size="small"
                        variant="outlined"
                        icon={getFileIcon(attachment.mimetype ?? "")}
                        label={`${attachment.filename} ${size} ${unit}`}
                      />
                    );
                  })}
                </ExpandableList>
              )}
            </Grid>
            <Grid className={styles.emailContent}>
              {(mode === "loading" || mode === "newReply" || mode === "editLoading") && <Loading overlay />}
              {emailContent && <EmailEditor value={emailContent} />}
            </Grid>
          </Grid>
        </EmailContext.Provider>
      )}
    </>
  );
};
