import React, { FC, lazy, memo, Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { createStyles, Grid, ListItem, makeStyles, Typography } from '@material-ui/core';
import { AccountBalance, Alarm, Cake, Edit, PersonAdd } from '@material-ui/icons';
import { navigate } from '@reach/router';

import { useDependency } from '../../../dependencyContainer';
import { CrmEntity } from '../../../services/crmService/CrmEntity';
import { ICrmService } from '../../../services/crmService/CrmService';
import { ICrmServiceCache } from '../../../services/crmService/CrmServiceCache';
import { ICrmTicket } from '../../../services/crmService/models/ICrmTicket';
import { ICrmUser } from '../../../services/crmService/models/ICrmUser';
import { email as emailTerms } from '../../../terms.en-us.json';
import { useSubscription } from '../../../utilities/observables';
import { wait } from '../../../utilities/promises';
import { routes } from '../../routes';
import { DateFromNow } from '../../shared/DateFromNow';
import { Loading } from '../../shared/Loading';
import { Menu } from '../../shared/Menu';
import { TicketIcon } from './TicketIcon';

const TicketDetails = lazy(() => import("./TicketDetails").then((module) => ({ default: module.TicketDetails })));

interface ITicketItemProps {
  ticket: ICrmTicket;
  ticketNumber: string | undefined;
  emailId: string | undefined;
  owner?: ICrmUser;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    metadata: {
      margin: theme.spacing(0.5, 0.25, 0.5, 0),
    },
    icon: {
      margin: theme.spacing(0, 1, 1, 0),
    },
    owner: {
      float: "right",
      marginLeft: theme.spacing(1),
    },
    menu: {
      float: "right",
      padding: 0,
      marginLeft: theme.spacing(1),
    },
    content: {
      margin: theme.spacing(0.75, 0),
      minWidth: 0,
      "& > div": {
        width: "100%",
      },
    },
  })
);

export const TicketItem: FC<ITicketItemProps> = memo(
  ({ ticket, ticketNumber, emailId, owner }) => {
    const styles = useStyles();

    const [mode, setMode] = useState<"loading" | "ready">("ready");

    const listItemRef = useRef<HTMLDivElement>(null);

    const crmService = useDependency(ICrmService);
    const crmServiceCache = useDependency(ICrmServiceCache);

    const currentUser = useSubscription(crmService.currentUser().getObservable());

    const ticketIsSelected = useCallback((ticket: ICrmTicket) => ticketNumber === ticket.ticketnumber, [ticketNumber]);

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
        wait(200).then(() => scrollIntoView());
      }
    }, [scrollIntoView, ticket, ticketIsSelected]);

    const assignUser = useCallback(
      async (userId: Guid) => {
        setMode("loading");

        await crmService.tickets().upsert(ticket.incidentid, { "ownerid@odata.bind": `/systemusers(${userId})` });
        await wait(1000);
        crmServiceCache.refresh("incidents");

        setMode("ready");
      },
      [crmService, ticket.incidentid, crmServiceCache]
    );

    return (
      <ListItem
        dense
        alignItems="flex-start"
        ref={listItemRef}
        button={!ticketIsSelected(ticket) as any}
        selected={ticketIsSelected(ticket)}
        onClick={onClick(ticket)}
      >
        {mode === "loading" && <Loading overlay />}
        <Grid container direction="column" className={styles.content}>
          <Grid item container>
            <Grid item>
              <TicketIcon className={styles.icon} ticket={ticket} />
            </Grid>
            <Grid item sm>
              {owner && currentUser && (
                <>
                  <Menu
                    className={styles.menu}
                    tooltip={emailTerms.more}
                    options={[
                      ticket.owninguser?.systemuserid !== currentUser?.UserId && {
                        icon: <PersonAdd />,
                        label: emailTerms.assignToMe,
                        onClick: () => assignUser(currentUser.UserId),
                      },
                      {
                        icon: <AccountBalance />,
                        label: emailTerms.openInCrm,
                        target: crmService.crmUrl(CrmEntity.Ticket).id(ticket.incidentid).build(),
                      },
                    ]}
                  />
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
            <Typography component="span">
              {ticket.modifiedon && <DateFromNow className={styles.metadata} icon={<Edit />} date={ticket.modifiedon} />}
              {ticket.ken_sladuedate && <DateFromNow className={styles.metadata} icon={<Alarm />} date={ticket.ken_sladuedate} />}
              {ticket.createdon && <DateFromNow className={styles.metadata} icon={<Cake />} date={ticket.createdon} />}
            </Typography>
          </Grid>
          <Grid item>
            <Suspense fallback={<Loading />}>{ticketIsSelected(ticket) && <TicketDetails ticket={ticket} emailId={emailId} />}</Suspense>
          </Grid>
        </Grid>
      </ListItem>
    );
  },
  (previous, next) =>
    previous.ticketNumber === next.ticketNumber &&
    previous.ticket.modifiedon === next.ticket.modifiedon &&
    previous.emailId === next.emailId
);
