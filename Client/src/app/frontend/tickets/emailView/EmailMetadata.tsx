import moment from 'moment';
import React, { FC, MouseEvent, useCallback, useContext, useMemo, useState } from 'react';

import {
    createStyles,
    IconButton,
    makeStyles,
    Popover,
    Theme,
    Tooltip,
    Typography
} from '@material-ui/core';
import { ExpandLess, ExpandMore } from '@material-ui/icons';

import { ICrmEmail } from '../../../../services/models/ICrmEmail';
import { ICrmTicket } from '../../../../services/models/ICrmTicket';
import { ICrmUser } from '../../../../services/models/ICrmUser';
import { email as emailTerms } from '../../../../terms.en-us.json';
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
  aeUser?: ICrmUser;
  amUser?: ICrmUser;
  tsmUser?: ICrmUser;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    more: {
      padding: 0,
      marginLeft: theme.spacing(1)
    },
    metadata: {
      margin: theme.spacing(0, 2)
    }
  })
);

export const EmailMetadata: FC<IEmailMetadataProps> = ({ ticket, email, toEmails, ccEmails, bccEmails, aeUser, amUser, tsmUser }) => {
  const styles = useStyles();

  const [popoverEl, setPopoverEl] = useState<HTMLButtonElement | null>(null);
  const popoverIsOpen = useMemo(() => Boolean(popoverEl), [popoverEl]);

  const { mode } = useContext(EmailContext);

  const openMorePopover = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setPopoverEl(event.currentTarget);
  }, []);

  const closeMorePopover = useCallback(() => {
    setPopoverEl(null);
  }, []);

  return (
    <div className={styles.metadata}>
      {ticket.customerid_account && <Typography variant="subtitle2">{ticket.customerid_account.name}</Typography>}
      <Typography variant="subtitle1">
        {ticket.primarycontactid && ticket.primarycontactid.fullname}
        <Tooltip className={styles.more} title={emailTerms.showDetails} aria-label={emailTerms.showDetails}>
          <IconButton onClick={openMorePopover}>{popoverIsOpen ? <ExpandLess /> : <ExpandMore />}</IconButton>
        </Tooltip>
        <Popover
          keepMounted
          anchorEl={popoverEl}
          open={popoverIsOpen}
          onClose={closeMorePopover}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left"
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left"
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
                  <EmailDetailLine label={emailTerms.sent} value={moment(email.senton).format("LLL")} />
                </>
              )}
              {ticket.customerid_account && aeUser && (
                <EmailDetailLine
                  label={emailTerms.accountExecutive}
                  value={aeUser.fullname ?? aeUser.domainname ?? emailTerms.noAccountUser}
                />
              )}
              {ticket.customerid_account && amUser && (
                <EmailDetailLine
                  label={emailTerms.accountManager}
                  value={amUser.fullname ?? amUser.domainname ?? emailTerms.noAccountUser}
                />
              )}
              {ticket.customerid_account && tsmUser && (
                <EmailDetailLine
                  label={emailTerms.territorySalesManager}
                  value={tsmUser.fullname ?? tsmUser.domainname ?? emailTerms.noAccountUser}
                />
              )}
            </>
          )}
        </Popover>
      </Typography>
    </div>
  );
};
