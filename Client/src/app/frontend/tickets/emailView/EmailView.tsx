import moment from 'moment';
import React, { createContext, FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { BehaviorSubject } from 'rxjs';
import sortArray from 'sort-array';

import {
    Chip,
    createStyles,
    Grid,
    IconButton,
    makeStyles,
    Theme,
    Tooltip,
    Typography
} from '@material-ui/core';
import { AttachFile, FlashOn, PersonAdd, Reply, Send, Update } from '@material-ui/icons';

import { CrmEntity } from '../../../../services/crmService/CrmEntity';
import { ICrmService } from '../../../../services/crmService/CrmService';
import { ICrmAttachment } from '../../../../services/crmService/models/ICrmAttachment';
import { EmailStatus } from '../../../../services/crmService/models/ICrmEmail';
import { ICrmTicket } from '../../../../services/crmService/models/ICrmTicket';
import { ParticipationType } from '../../../../services/crmService/models/ParticipationType';
import { TicketPriority } from '../../../../services/crmService/models/TicketPriority';
import { TicketStatus } from '../../../../services/crmService/models/TicketStatus';
import { useDependency } from '../../../../services/dependencyContainer';
import { systemUser } from '../../../../services/systemUser';
import {
    email as emailTerms,
    entityNames,
    ticket as ticketTerms
} from '../../../../terms.en-us.json';
import { deleteFrom } from '../../../../utilities/arrays';
import { getSizeText } from '../../../../utilities/numbers';
import { useSubscriptionEffect } from '../../../../utilities/observables';
import { wait } from '../../../../utilities/promises';
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
}

export const EmailContext = createContext<IEmailContext>({
  mode: "loading",
  setMode: () => {}
});

interface IEmailViewProps {
  ticket: ICrmTicket;
  emailId: string;
}

export type EmailViewMode = "newReply" | "edit" | "view" | "viewDraft" | "loading";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    emailContent: {
      minHeight: 0,
      flex: 1,
      margin: theme.spacing(2, 0, 0),
      width: "100%",
      display: "flex",
      position: "relative"
    },
    container: {
      flex: 1
    },
    spacer: {
      flex: 1
    },
    recipients: {
      margin: theme.spacing(0, 0, 1)
    },
    attachment: {
      margin: theme.spacing(0.5)
    }
  })
);

export const EmailView: FC<IEmailViewProps> = ({ ticket, emailId }) => {
  const styles = useStyles();

  const [caseAttachments, setCaseAttachments] = useState<ICrmAttachment[]>();
  const [toEmails, setToEmails] = useState<IEmailRecipient[]>([]);
  const [ccEmails, setCcEmails] = useState<IEmailRecipient[]>([]);
  const [bccEmails, setBccEmails] = useState<IEmailRecipient[]>([]);

  const [mode, setMode] = useState<EmailViewMode>("loading");

  const crmService = useDependency(ICrmService);

  const ticketId = ticket?.incidentid;

  const emailFilter = `sender ne '${systemUser.internalemailaddress}' and isworkflowcreated ne true`;

  const email = useSubscriptionEffect(() => {
    if (ticketId && emailId) {
      return crmService
        .tickets()
        .id(ticketId)
        .children("Incident_Emails")
        .select("statuscode", "senton", "createdon", "modifiedon", "subject", "sender", "torecipients")
        .filter(`${emailFilter} and activityid eq ${emailId}`)
        .top(1)
        .orderBy("createdon desc")
        .getObservable();
    }
  }, [ticketId, emailId])?.[0];

  const rawEmailContent = useSubscriptionEffect(() => {
    if (email?.activityid) {
      return crmService
        .emailBody()
        .id(email.activityid)
        .getObservable();
    }
  }, [email]);

  const rawCaseAttachments = useSubscriptionEffect(() => {
    if (ticketId) {
      return crmService
        .tickets()
        .id(ticketId)
        .children("Incident_Emails")
        .select("activityid")
        .filter(emailFilter)
        .orderBy("createdon desc")
        .expand("email_activity_mime_attachment", ["filename", "mimetype", "_objectid_value", "attachmentcontentid"])
        .getObservable();
    }
  }, [ticketId]);

  const emailAttachmentsData = useSubscriptionEffect(() => {
    if (rawEmailContent) {
      const cidsFilter = [...rawEmailContent.matchAll(/src="cid:(.*?)"/g)]
        .map(match => `attachmentcontentid eq '{cid:${match[1]}}'`)
        .join(" or ");

      if (cidsFilter !== "") {
        return crmService
          .attachments()
          .select("attachmentcontentid", "body")
          .filter(cidsFilter)
          .getObservable();
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
      const matches = [...rawEmailContent.matchAll(/AttachmentId=([0-9a-f-]{36}).*?&amp;CRMWRPCToken/g)].map(match => match[1]);

      let caseAttachments = rawCaseAttachments
        .flatMap(email => email.email_activity_mime_attachment)
        .filter(caseAttachment => !matches.find(match => caseAttachment.activitymimeattachmentid === match))
        .filter(
          caseAttachment =>
            !emailAttachmentsData.find(attachment => caseAttachment.activitymimeattachmentid === attachment.activitymimeattachmentid)
        );

      setCaseAttachments(caseAttachments);
    }
  }, [rawEmailContent, rawCaseAttachments, emailAttachmentsData]);

  useEffect(() => {
    if (ticket && email && caseAttachments) {
      switch (email.statuscode) {
        case EmailStatus.Draft:
          setMode("viewDraft");
          break;
        default:
          setMode("view");
          break;
      }
    } else {
      setMode("loading");
    }
  }, [ticket, email, caseAttachments]);

  useEffect(() => {
    if (email?.torecipients) {
      const toEmails = email.torecipients
        .split(";")
        .filter(recipient => !!recipient)
        .map(recipient => ({ email: recipient }));

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
        .filter(party => party.participationtypemask === ParticipationType.CcRecipient)
        .map(party => ({ name: party.partyid_contact?.fullname, email: party.addressused }));

      setCcEmails(ccEmails);

      const bccEmails = parties
        .filter(party => party.participationtypemask === ParticipationType.BccRecipient)
        .map(party => ({ name: party.partyid_contact?.fullname, email: party.addressused }));

      setBccEmails(bccEmails);
    }
  }, [parties]);

  const emailAttachments = useMemo(() => {
    if (caseAttachments && email) {
      const emailAttachments = caseAttachments.filter(attachment => attachment._objectid_value === email.activityid);

      return sortArray(emailAttachments, {
        by: "filesize",
        order: "desc"
      });
    }
  }, [caseAttachments, email]);

  const otherAttachments = useMemo(() => {
    if (caseAttachments && email) {
      const emailAttachments = caseAttachments.filter(attachment => attachment._objectid_value !== email.activityid);

      return sortArray(emailAttachments, {
        by: "filesize",
        order: "desc"
      });
    }
  }, [caseAttachments, email]);

  const editEmail = useCallback(() => {
    setMode("newReply");
  }, []);

  const sendEmail = useCallback(
    (keepStatus: boolean) => async () => {
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
        .subscribe(attachment => {
          if (attachment && attachment.body && attachment.filename) {
            const fakeAnchor = document.createElement("a");

            const bodyBytes = Uint8Array.from([...atob(attachment.body)].map(char => char.charCodeAt(0)));

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

  const emailContext = { mode, setMode };

  return (
    <>
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
              {(mode === "view" || mode === "loading") && (
                <Tooltip title={emailTerms.reply} aria-label={emailTerms.reply}>
                  <IconButton onClick={editEmail}>
                    <Reply />
                  </IconButton>
                </Tooltip>
              )}
              {mode === "edit" && (
                <Tooltip title={emailTerms.send} aria-label={emailTerms.send}>
                  <IconButton onClick={sendEmail(false)}>
                    <Send color="primary" />
                  </IconButton>
                </Tooltip>
              )}
              {mode === "edit" && (
                <Tooltip title={emailTerms.sendKeepStatus} aria-label={emailTerms.send}>
                  <IconButton onClick={sendEmail(true)}>
                    <SendSave />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title={emailTerms.assignToMe} aria-label={emailTerms.assignToMe}>
                <IconButton>
                  <PersonAdd />
                </IconButton>
              </Tooltip>
              <Menu
                tooltip={emailTerms.setStatus}
                icon={<Update />}
                options={[
                  { component: entityNames.ticketStatus[TicketStatus.Queue] },
                  { component: entityNames.ticketStatus[TicketStatus.Waiting] },
                  { component: entityNames.ticketStatus[TicketStatus.Solved] },
                  { component: entityNames.ticketStatus[TicketStatus.Closed] }
                ]}
              />
              <Menu
                tooltip={emailTerms.setPriority}
                icon={<FlashOn />}
                options={[
                  { component: entityNames.ticketPriority[TicketPriority.FireFighting] },
                  { component: entityNames.ticketPriority[TicketPriority.HighPriority] },
                  { component: entityNames.ticketPriority[TicketPriority.Normal] },
                  { component: entityNames.ticketPriority[TicketPriority.WaitingForDevelopers] },
                  { component: entityNames.ticketPriority[TicketPriority.LowPriority] },
                  { component: entityNames.ticketPriority[TicketPriority.Processed] }
                ]}
              />
              <Menu
                tooltip={emailTerms.more}
                options={[
                  { component: emailTerms.assignTo },
                  { component: emailTerms.handOver },
                  { component: emailTerms.submitFeedback },
                  { component: emailTerms.submitBug },
                  {
                    component: emailTerms.openInCrm,
                    target: crmService
                      .crmUrl(CrmEntity.Ticket)
                      .id(ticket.incidentid)
                      .build()
                  }
                ]}
              />
            </Grid>
            {mode === "edit" && (
              <ExpandableList className={styles.recipients} tooltip={[emailTerms.showCcBcc, emailTerms.hideCcBcc]}>
                <EditableEmails value={toEmails} setValue={setToEmails} label={emailTerms.to} />
                <EditableEmails value={ccEmails} setValue={setCcEmails} label={emailTerms.cc} />
                <EditableEmails value={bccEmails} setValue={setBccEmails} label={emailTerms.bcc} />
              </ExpandableList>
            )}
            <Grid>
              {emailAttachments.length + otherAttachments.length > 0 && (
                <ExpandableList showOverlay tooltip={[emailTerms.more, emailTerms.less]}>
                  {mode === "edit" && (
                    <Chip
                      className={styles.attachment}
                      clickable
                      size="small"
                      label={emailTerms.addAttachment}
                      color="primary"
                      icon={<AttachFile />}
                    />
                  )}
                  {emailAttachments.map(attachment => {
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
                  {otherAttachments.map(attachment => {
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
              {(mode === "loading" || mode === "newReply") && <Loading overlay />}
              {emailContent && <EmailEditor value={emailContent} />}
            </Grid>
          </Grid>
        </EmailContext.Provider>
      )}
    </>
  );
};
