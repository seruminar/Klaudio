import moment from 'moment';
import React, { FC, MouseEvent, useContext, useMemo, useState } from 'react';

import {
    Box,
    createStyles,
    IconButton,
    makeStyles,
    Popover,
    Tooltip,
    Typography
} from '@material-ui/core';
import { ExpandLess, ExpandMore } from '@material-ui/icons';

import { ICrmService } from '../../../../services/crmService/CrmService';
import { ContactPosition } from '../../../../services/crmService/models/ContactPosition';
import { ICrmEmail } from '../../../../services/crmService/models/ICrmEmail';
import { ICrmTicket } from '../../../../services/crmService/models/ICrmTicket';
import { useDependency } from '../../../../services/dependencyContainer';
import { email as emailTerms, entityNames } from '../../../../terms.en-us.json';
import { useSubscriptionEffect } from '../../../../utilities/observables';
import { Loading } from '../../../shared/Loading';
import { getRecipientLabel } from '../ticketUtilities';
import { EmailDetailLine } from './EmailDetailLine';
import { EmailContext } from './EmailView';
import { IEmailRecipient } from './IEmailRecipient';

interface IEmailMetadataProps {
  ticket: ICrmTicket;
  email: ICrmEmail;
  toEmails?: IEmailRecipient[];
  ccEmails?: IEmailRecipient[];
  bccEmails?: IEmailRecipient[];
}

const useStyles = makeStyles((theme) =>
  createStyles({
    more: {
      padding: 0,
      marginLeft: theme.spacing(1),
    },
    metadata: {
      margin: theme.spacing(0, 2),
    },
    contact: {
      display: "flex",
    },
  })
);

export const EmailMetadata: FC<IEmailMetadataProps> = ({ ticket, email, toEmails, ccEmails, bccEmails }) => {
  const styles = useStyles();

  const [popoverEl, setPopoverEl] = useState<HTMLButtonElement | null>(null);

  const { mode } = useContext(EmailContext);

  const crmService = useDependency(ICrmService);

  const latestContact = useSubscriptionEffect(() => {
    if (!ticket.primarycontactid && ticket._ken_latestcontact_value) {
      return crmService
        .contacts()
        .id(ticket._ken_latestcontact_value)
        .select("contactid", "fullname", "ken_position", "ken_supportlevel", "ken_comment")
        .getObservable();
    }
  }, [ticket.primarycontactid, ticket._ken_latestcontact_value]);

  const aeUser = useSubscriptionEffect(() => {
    if (ticket.customerid_account?._dyn_accountexecutiveid_value) {
      return crmService
        .users()
        .id(ticket.customerid_account._dyn_accountexecutiveid_value)
        .select("fullname", "domainname")
        .getObservable();
    }
  }, [ticket.customerid_account]);

  const amUser = useSubscriptionEffect(() => {
    if (ticket.customerid_account?._dyn_accountmanagerid_value) {
      return crmService.users().id(ticket.customerid_account._dyn_accountmanagerid_value).select("fullname", "domainname").getObservable();
    }
  }, [ticket.customerid_account]);

  const tsmUser = useSubscriptionEffect(() => {
    if (ticket.customerid_account?._owninguser_value) {
      return crmService.users().id(ticket.customerid_account._owninguser_value).select("fullname", "domainname").getObservable();
    }
  }, [ticket.customerid_account]);

  const displayContact = ticket.primarycontactid ?? latestContact;

  const displayContactTooltip = useMemo(() => {
    if (displayContact) {
      let tooltipParts = [];

      if (displayContact.ken_supportlevel) {
        tooltipParts.push(entityNames.supportLevel[displayContact.ken_supportlevel]);
      }

      if (displayContact.ken_position && displayContact.ken_position !== ContactPosition.Unknown) {
        tooltipParts.push(entityNames.contactPosition[displayContact.ken_position]);
      }

      return tooltipParts.join(" ");
    }
  }, [displayContact]);

  const popoverIsOpen = useMemo(() => Boolean(popoverEl), [popoverEl]);

  return (
    <div className={styles.metadata}>
      {ticket.customerid_account && <Typography variant="subtitle2">{ticket.customerid_account.name}</Typography>}
      <Box className={styles.contact}>
        {displayContact &&
          (displayContactTooltip ? (
            <Tooltip title={displayContactTooltip} aria-label={displayContactTooltip}>
              <Typography variant="subtitle1">{displayContact.fullname}</Typography>
            </Tooltip>
          ) : (
            <Typography variant="subtitle1">{displayContact.fullname}</Typography>
          ))}
        <Tooltip className={styles.more} title={emailTerms.showDetails} aria-label={emailTerms.showDetails}>
          <IconButton onClick={(event: MouseEvent<HTMLButtonElement>) => setPopoverEl(event.currentTarget)}>
            {popoverIsOpen ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Tooltip>
        <Popover
          keepMounted
          anchorEl={popoverEl}
          open={popoverIsOpen}
          onClose={() => setPopoverEl(null)}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          {!(toEmails && ccEmails && bccEmails) && <Loading />}
          {toEmails && ccEmails && bccEmails && (
            <>
              {email.sender && <EmailDetailLine label={emailTerms.from} value={email.sender} />}
              {mode !== "edit" && (
                <>
                  <EmailDetailLine label={emailTerms.to} value={toEmails.map(getRecipientLabel).join("; ")} />
                  {ccEmails.length > 0 && <EmailDetailLine label={emailTerms.cc} value={ccEmails.map(getRecipientLabel).join("; ")} />}
                  {bccEmails.length > 0 && <EmailDetailLine label={emailTerms.bcc} value={bccEmails.map(getRecipientLabel).join("; ")} />}
                </>
              )}
              {email.subject && <EmailDetailLine label={emailTerms.subject} value={email.subject} />}
              {mode !== "edit" && (
                <>
                  <EmailDetailLine label={emailTerms.created} value={moment(email.createdon).format("LLL")} />
                  {email.senton && <EmailDetailLine label={emailTerms.sent} value={moment(email.senton).format("LLL")} />}
                </>
              )}
              {aeUser && (
                <EmailDetailLine
                  label={emailTerms.accountExecutive}
                  value={aeUser.fullname ?? aeUser.domainname ?? emailTerms.noAccountUser}
                />
              )}
              {amUser && (
                <EmailDetailLine
                  label={emailTerms.accountManager}
                  value={amUser.fullname ?? amUser.domainname ?? emailTerms.noAccountUser}
                />
              )}
              {tsmUser && (
                <EmailDetailLine
                  label={emailTerms.territorySalesManager}
                  value={tsmUser.fullname ?? tsmUser.domainname ?? emailTerms.noAccountUser}
                />
              )}
            </>
          )}
        </Popover>
      </Box>
    </div>
  );
};
