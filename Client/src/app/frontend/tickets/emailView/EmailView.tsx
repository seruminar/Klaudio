import React, { createContext, FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import sortArray from 'sort-array';

import {
    Box,
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
import { navigate } from '@reach/router';

import { ICrmService } from '../../../../services/CrmService';
import { useDependency } from '../../../../services/dependencyContainer';
import { ICrmAttachment } from '../../../../services/models/ICrmAttachment';
import { EmailStatus } from '../../../../services/models/ICrmEmail';
import { ParticipationType } from '../../../../services/models/ParticipationType';
import { TicketPriority } from '../../../../services/models/TicketPriority';
import { TicketStatus } from '../../../../services/models/TicketStatus';
import { systemUser } from '../../../../services/systemUser';
import { email as emailTerms, entityNames } from '../../../../terms.en-us.json';
import { deleteFrom } from '../../../../utilities/arrays';
import { getSizeText } from '../../../../utilities/numbers';
import { useSubscription, useSubscriptionEffect } from '../../../../utilities/observables';
import { wait } from '../../../../utilities/promises';
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
}

export const EmailContext = createContext<IEmailContext>({
  mode: "loading"
});

interface IEmailViewProps {
  ticketNumber: string;
  emailId: string | undefined;
}

export type EmailViewMode = "edit" | "view" | "viewDraft" | "loading";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flex: 1,
      display: "flex",
      margin: theme.spacing(2),
      minWidth: 0
    },
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

export const EmailView: FC<IEmailViewProps> = ({ ticketNumber, emailId }) => {
  const styles = useStyles();

  const [caseAttachments, setCaseAttachments] = useState<ICrmAttachment[]>();
  const [toEmails, setToEmails] = useState<IEmailRecipient[]>([]);
  const [ccEmails, setCcEmails] = useState<IEmailRecipient[]>([]);
  const [bccEmails, setBccEmails] = useState<IEmailRecipient[]>([]);

  const [mode, setMode] = useState<EmailViewMode>("loading");

  const addHtmlRef = useRef<(position: number, html: string) => void>(null);

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
  )?.value[0];

  const ticketId = ticket?.incidentid;

  const emailFilter = `sender ne '${systemUser.internalemailaddress}' and isworkflowcreated ne true`;

  const rawCaseAttachments = useSubscriptionEffect(() => {
    if (ticketId) {
      return crmService
        .tickets()
        .id(ticketId)
        .children("Incident_Emails")
        .select("activityid")
        .filter(emailFilter)
        .orderBy("createdon desc")
        .expand("email_activity_mime_attachment", ["filename", "mimetype", "_objectid_value"])
        .getObservable();
    }
  }, [ticketId])?.value;

  useEffect(() => {
    if (rawCaseAttachments) {
      setCaseAttachments(rawCaseAttachments.flatMap(email => email.email_activity_mime_attachment));
    }
  }, [rawCaseAttachments]);

  const email = useSubscriptionEffect(() => {
    let contextEmailFilter = emailId ? `${emailFilter} and activityid eq ${emailId}` : emailFilter;

    if (ticketId) {
      return crmService
        .tickets()
        .id(ticketId)
        .children("Incident_Emails")
        .select("statuscode", "senton", "createdon", "modifiedon", "subject", "sender", "torecipients", "_regardingobjectid_value")
        .filter(contextEmailFilter)
        .top(1)
        .orderBy("createdon desc")
        .getObservable();
    }
  }, [ticketId, emailId])?.value[0];

  useEffect(() => {
    if (email && emailId !== email.activityid && email._regardingobjectid_value === ticketId) {
      navigate(`${routes.base}${routes.tickets}/${ticketNumber}/${email.activityid}`);
    }
  }, [ticketId, ticketNumber, email, emailId]);

  const emailContent = useSubscriptionEffect(() => {
    if (email?.activityid) {
      return crmService
        .emailBody()
        .id(email.activityid)
        .getObservable();
    }
  }, [email]);

  useEffect(() => {
    if (email?.torecipients) {
      const toEmails = email.torecipients
        .split(";")
        .filter(recipient => !!recipient)
        .map(recipient => ({ email: recipient }));

      setToEmails(toEmails);
    }

    if (email?.statuscode) {
      switch (email.statuscode) {
        case EmailStatus.Draft:
          setMode("viewDraft");
          break;
      }
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
  }, [email])?.value;

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

  useEffect(() => {
    if (!(ticket && caseAttachments && email)) {
      setMode("loading");
    } else {
      setMode("view");
    }
  }, [ticket, caseAttachments, email]);

  const currentUser = useSubscription(crmService.currentUser().getObservable());

  const signature = useSubscriptionEffect(() => {
    if (currentUser?.UserId) {
      return crmService
        .users()
        .id(currentUser.UserId)
        .select("dyn_signature")
        .getObservable();
    }
  }, [currentUser])?.dyn_signature;

  const emailAttachments = useMemo(() => {
    if (caseAttachments) {
      const emailAttachments = caseAttachments.filter(attachment => attachment._objectid_value === email?.activityid);

      return sortArray(emailAttachments, {
        by: "filesize",
        order: "desc"
      });
    }
  }, [caseAttachments, email]);

  const otherAttachments = useMemo(() => {
    if (caseAttachments) {
      const emailAttachments = caseAttachments.filter(attachment => attachment._objectid_value !== email?.activityid);

      return sortArray(emailAttachments, {
        by: "filesize",
        order: "desc"
      });
    }
  }, [caseAttachments, email]);

  const editEmail = useCallback(() => {
    if (currentUser && signature) {
      setMode("loading");

      if (mode === "view" && addHtmlRef.current) {
        addHtmlRef.current(0, `${signature.replace("\n", "")}${emailTerms.signatureDivider}`);
      }

      setMode("edit");
    }
  }, [mode, currentUser, signature]);

  const sendEmail = useCallback(
    (keepStatus: boolean) => async () => {
      setMode("loading");

      // TEMPORARY
      await wait(1000);

      setMode("view");
    },
    []
  );

  const removeAttachment = useCallback(
    (attachment: ICrmAttachment) => {
      if (caseAttachments) {
        setCaseAttachments(deleteFrom(attachment, caseAttachments));
      }
    },
    [caseAttachments]
  );

  const emailContext = { mode };

  return (
    <Box className={styles.root}>
      {!(ticket && email && rawCaseAttachments && emailAttachments && otherAttachments) && <Loading />}
      {ticket && email && rawCaseAttachments && emailAttachments && otherAttachments && (
        <EmailContext.Provider value={emailContext}>
          <Grid container className={styles.container} direction="column" justify="flex-start">
            <Typography variant="h6">{ticket.title}</Typography>
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
                  entityNames.ticketStatus[TicketStatus.Queue],
                  entityNames.ticketStatus[TicketStatus.Waiting],
                  entityNames.ticketStatus[TicketStatus.Solved],
                  entityNames.ticketStatus[TicketStatus.Closed]
                ]}
              />
              <Menu
                tooltip={emailTerms.setPriority}
                icon={<FlashOn />}
                options={[
                  entityNames.ticketPriority[TicketPriority.FireFighting],
                  entityNames.ticketPriority[TicketPriority.HighPriority],
                  entityNames.ticketPriority[TicketPriority.Normal],
                  entityNames.ticketPriority[TicketPriority.WaitingForDevelopers],
                  entityNames.ticketPriority[TicketPriority.LowPriority],
                  entityNames.ticketPriority[TicketPriority.Processed]
                ]}
              />
              <Menu
                tooltip={emailTerms.more}
                options={[emailTerms.assignTo, emailTerms.handOver, emailTerms.submitFeedback, emailTerms.submitBug, emailTerms.openInCrm]}
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
                      size="small"
                      variant="outlined"
                      icon={getFileIcon(attachment.mimetype ?? "")}
                      label={`${attachment.filename} ${size} ${unit}`}
                    />
                  );
                })}
              </ExpandableList>
            </Grid>
            <Grid className={styles.emailContent}>
              {mode === "loading" && <Loading overlay />}
              {emailContent && <EmailEditor value={emailContent} addHtmlRef={addHtmlRef} />}
            </Grid>
          </Grid>
        </EmailContext.Provider>
      )}
    </Box>
  );
};
