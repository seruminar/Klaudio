import React, { createContext, FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import { ICrmCurrentUser } from '../../../../services/models/ICrmCurrentUser';
import { EmailStatus, ICrmEmail } from '../../../../services/models/ICrmEmail';
import { ICrmTicket } from '../../../../services/models/ICrmTicket';
import { ICrmUser } from '../../../../services/models/ICrmUser';
import { ParticipationType } from '../../../../services/models/ParticipationType';
import { TicketPriority } from '../../../../services/models/TicketPriority';
import { TicketStatus } from '../../../../services/models/TicketStatus';
import { systemUser } from '../../../../services/systemUser';
import { email as emailTerms, entityNames } from '../../../../terms.en-us.json';
import { deleteFrom } from '../../../../utilities/arrays';
import { getSizeText } from '../../../../utilities/numbers';
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
  emailId: string;
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

  const [ticket, setTicket] = useState<ICrmTicket>();
  const [email, setEmail] = useState<ICrmEmail>();
  const [aeUser, setAeUser] = useState<ICrmUser>();
  const [amUser, setAmUser] = useState<ICrmUser>();
  const [tsmUser, setTsmUser] = useState<ICrmUser>();
  const [toEmails, setToEmails] = useState<IEmailRecipient[]>([]);
  const [ccEmails, setCcEmails] = useState<IEmailRecipient[]>([]);
  const [bccEmails, setBccEmails] = useState<IEmailRecipient[]>([]);

  const [emailContent, setEmailContent] = useState<string>();
  const [caseAttachments, setCaseAttachments] = useState<ICrmAttachment[]>();
  const [currentUser, setCurrentUser] = useState<ICrmCurrentUser>();
  const [mode, setMode] = useState<EmailViewMode>("loading");

  const addHtmlRef = useRef<(position: number, html: string) => void>(null);

  const crmService = useDependency(ICrmService);

  useEffect(() => {
    setMode("loading");

    (async () => {
      const ticket = (
        await crmService
          .tickets()
          .select("title", "ken_sladuedate", "modifiedon", "_ownerid_value", "dyn_issla", "dyn_is2level", "prioritycode", "statuscode")
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
      ).value[0];

      setTicket(ticket);

      let emailFilter = `sender ne '${systemUser.internalemailaddress}' and isworkflowcreated ne true`;

      const caseAttachments = (
        await crmService
          .tickets()
          .id(ticket.incidentid)
          .children("Incident_Emails")
          .select("activityid")
          .filter(emailFilter)
          .orderBy("createdon desc")
          .expand("email_activity_mime_attachment", ["filename", "mimetype", "_objectid_value"])
      ).value.flatMap(email => email.email_activity_mime_attachment);

      setCaseAttachments(caseAttachments);

      if (emailId) {
        emailFilter += ` and activityid eq ${emailId}`;
      }

      const latestEmail = (
        await crmService
          .tickets()
          .id(ticket.incidentid)
          .children("Incident_Emails")
          .select("statuscode", "senton", "createdon", "modifiedon", "subject", "sender", "torecipients")
          .filter(emailFilter)
          .top(1)
          .orderBy("createdon desc")
      ).value[0];

      if (!emailId) {
        await navigate(`${routes.base}${routes.tickets}/${ticketNumber}/${latestEmail.activityid}`);
      }

      setEmail(latestEmail);

      setEmailContent(await crmService.emailBody().id(latestEmail.activityid));

      if (ticket.customerid_account) {
        const accountUserIds = [
          ticket.customerid_account._dyn_accountexecutiveid_value,
          ticket.customerid_account._dyn_accountmanagerid_value,
          ticket.customerid_account._owninguser_value
        ];

        const getAccountUser = (userId: string) =>
          crmService
            .users()
            .id(userId)
            .select("fullname", "domainname");

        const [aeUser, amUser, tsmUser] = await Promise.all(
          accountUserIds.filter(userId => !!userId).map(userId => getAccountUser(userId))
        );

        setAeUser(aeUser);
        setAmUser(amUser);
        setTsmUser(tsmUser);
      }

      if (latestEmail.torecipients) {
        const toEmails = latestEmail.torecipients
          .split(";")
          .filter(recipient => !!recipient)
          .map(recipient => ({ email: recipient }));

        setToEmails(toEmails);
      }

      const parties = (
        await crmService
          .emails()
          .id(latestEmail.activityid)
          .children("email_activity_parties")
          .select("addressused", "participationtypemask")
          .expand("partyid_contact", ["fullname"])
      ).value;

      const ccEmails = parties
        .filter(party => party.participationtypemask === ParticipationType.CcRecipient)
        .map(party => ({ name: party.partyid_contact?.fullname, email: party.addressused }));

      setCcEmails(ccEmails);

      const bccEmails = parties
        .filter(party => party.participationtypemask === ParticipationType.BccRecipient)
        .map(party => ({ name: party.partyid_contact?.fullname, email: party.addressused }));

      setBccEmails(bccEmails);

      if (latestEmail.statuscode) {
        switch (latestEmail.statuscode) {
          case EmailStatus.Draft:
            setMode("viewDraft");
            break;
        }
      }

      setMode("view");
    })();
  }, [crmService, ticketNumber, emailId]);

  useEffect(() => {
    if (!currentUser) {
      (async () => setCurrentUser(await crmService.currentUser()))();
    }
  }, [crmService, currentUser]);

  const editEmail = useCallback(async () => {
    const currentMode = mode;

    if (currentUser) {
      setMode("loading");

      const userId = currentUser.UserId;

      const signature = (
        await crmService
          .users()
          .id(userId)
          .select("dyn_signature")
      ).dyn_signature;

      if (currentMode === "view" && signature && addHtmlRef.current) {
        addHtmlRef.current(0, `${signature.replace("\n", "")}${emailTerms.signatureDivider}`);
      }

      setMode("edit");
    }
  }, [mode, crmService, currentUser]);

  const sendEmail = useCallback(
    (keepStatus: boolean) => async () => {
      setMode("loading");

      // TEMPORARY
      await wait(1000);

      setMode("view");
    },
    []
  );

  const orderedAttachments = useMemo(
    () =>
      caseAttachments?.sort((a: ICrmAttachment, b: ICrmAttachment) => {
        if (b._objectid_value && b._objectid_value === email?.activityid) {
          if (a._objectid_value && a._objectid_value === email?.activityid) {
            return a.filesize < b.filesize ? 1 : -1;
          }

          return 1;
        }

        return a.filesize < b.filesize ? 1 : -1;
      }),
    [caseAttachments, email]
  );

  const getAttachmentIcon = useCallback(getFileIcon, [getFileIcon]);

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
      {!(ticket && caseAttachments && email) && <Loading />}
      {ticket && caseAttachments && email && (
        <EmailContext.Provider value={emailContext}>
          <Grid container className={styles.container} direction="column" justify="flex-start">
            <Typography variant="h6">{ticket.title}</Typography>
            <Grid container direction="row">
              <TicketIcon ticket={ticket} />
              <EmailMetadata
                ticket={ticket}
                email={email}
                toEmails={toEmails}
                ccEmails={ccEmails}
                bccEmails={bccEmails}
                aeUser={aeUser}
                amUser={amUser}
                tsmUser={tsmUser}
              />
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
                {orderedAttachments?.map(attachment => {
                  const [size, unit] = getSizeText(attachment.filesize);

                  const belongsToThisEmail = attachment._objectid_value && attachment._objectid_value === email.activityid;

                  return (
                    <Chip
                      key={attachment.activitymimeattachmentid}
                      className={styles.attachment}
                      clickable
                      onDelete={mode === "edit" && belongsToThisEmail ? () => removeAttachment(attachment) : undefined}
                      size="small"
                      variant={belongsToThisEmail ? "default" : "outlined"}
                      icon={getAttachmentIcon(attachment.mimetype ?? "")}
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
