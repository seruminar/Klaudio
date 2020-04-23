import React, { FC, lazy, Suspense, useCallback, useEffect, useRef } from 'react';

import { createStyles, Grid, ListItem, makeStyles, Theme, Typography } from '@material-ui/core';
import { Alarm, Cake, Edit } from '@material-ui/icons';
import { navigate, useMatch } from '@reach/router';

import { ICrmTicket } from '../../../services/models/ICrmTicket';
import { ICrmUser } from '../../../services/models/ICrmUser';
import { email as emailTerms } from '../../../terms.en-us.json';
import { routes } from '../../routes';
import { DateFromNow } from '../../shared/DateFromNow';
import { Loading } from '../../shared/Loading';
import { Menu } from '../../shared/Menu';
import { TicketIcon } from './TicketIcon';

const TicketDetails = lazy(() => import("./TicketDetails").then(module => ({ default: module.TicketDetails })));

interface ITicketItemProps {
  ticket: ICrmTicket;
  owner?: ICrmUser;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    metadata: {
      "& > *": {
        margin: theme.spacing(0.5)
      }
    },
    icon: {
      margin: theme.spacing(0, 1, 1, 0)
    },
    owner: {
      float: "right",
      marginLeft: theme.spacing(1)
    },
    menu: {
      float: "right",
      padding: 0,
      marginLeft: theme.spacing(1)
    },
    content: {
      margin: theme.spacing(0.75, 0),
      minWidth: 0,
      "& > div": {
        width: "100%"
      }
    }
  })
);

export const TicketItem: FC<ITicketItemProps> = ({ ticket, owner }) => {
  const styles = useStyles();

  const listItemRef = useRef<HTMLDivElement>(null);

  const context = useMatch(`${routes.base}${routes.tickets}/:ticketNumber/*emailId`);

  const ticketIsSelected = useCallback(
    (ticket: ICrmTicket) => {
      return context?.ticketNumber === ticket.ticketnumber;
    },
    [context]
  );

  const scrollIntoView = useCallback(() => {
    listItemRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, []);

  const onClick = useCallback(
    (ticket: ICrmTicket) => async () => {
      scrollIntoView();
      if (!ticketIsSelected(ticket)) {
        await navigate(`${routes.base}${routes.tickets}/${ticket.ticketnumber}`);
      }
    },
    [ticketIsSelected, scrollIntoView]
  );

  useEffect(() => {
    if (ticketIsSelected(ticket)) {
      scrollIntoView();
    }
  }, [scrollIntoView, ticket, ticketIsSelected]);

  return (
    <ListItem
      dense
      alignItems="flex-start"
      ref={listItemRef}
      button={!ticketIsSelected(ticket) as any}
      selected={ticketIsSelected(ticket)}
      onClick={onClick(ticket)}
    >
      <Grid container direction="column" className={styles.content}>
        <Grid item container>
          <Grid item>
            <TicketIcon className={styles.icon} ticket={ticket} />
          </Grid>
          <Grid item sm>
            {owner && (
              <>
                <Menu className={styles.menu} tooltip={emailTerms.more} options={[emailTerms.assignToMe, emailTerms.openInCrm]} />
                <Typography variant="caption" className={styles.owner}>
                  {owner.fullname}
                </Typography>
              </>
            )}
            <Typography variant="subtitle2">{ticket.title}</Typography>
            {ticket.customerid_account && <Typography variant="caption">{ticket.customerid_account.name}</Typography>}
          </Grid>
        </Grid>
        <Grid item>
          <Typography component="span" className={styles.metadata}>
            {ticket.modifiedon && <DateFromNow icon={<Edit />} date={ticket.modifiedon} />}
            {ticket.ken_sladuedate && <DateFromNow icon={<Alarm />} date={ticket.ken_sladuedate} />}
            {ticket.createdon && <DateFromNow icon={<Cake />} date={ticket.createdon} />}{" "}
          </Typography>
        </Grid>
        <Grid item>
          <Suspense fallback={<Loading />}>{ticketIsSelected(ticket) && <TicketDetails ticket={ticket} />}</Suspense>
        </Grid>
      </Grid>
    </ListItem>
  );
};