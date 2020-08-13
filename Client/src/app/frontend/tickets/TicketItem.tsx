import clsx from 'clsx';
import React, {
    FC,
    lazy,
    memo,
    Suspense,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from 'react';

import {
    createStyles,
    Grid,
    ListItem,
    makeStyles,
    PaletteType,
    Theme,
    Typography
} from '@material-ui/core';
import { grey } from '@material-ui/core/colors';
import { AccountBalance, Alarm, Cake, Edit, PersonAdd } from '@material-ui/icons';
import { navigate } from '@reach/router';

import { experience } from '../../../appSettings.json';
import { useDependency } from '../../../dependencyContainer';
import { CrmEntity } from '../../../services/crmService/CrmEntity';
import { ICrmService } from '../../../services/crmService/CrmService';
import { ICrmServiceCache } from '../../../services/crmService/CrmServiceCache';
import { ICrmTicket } from '../../../services/crmService/models/ICrmTicket';
import { ICrmUser } from '../../../services/crmService/models/ICrmUser';
import { TicketGroup } from '../../../services/crmService/models/TicketGroup';
import { email as emailTerms } from '../../../terms.en-us.json';
import { useSubscription, useSubscriptionEffect } from '../../../utilities/observables';
import { wait } from '../../../utilities/promises';
import { ThemeContext } from '../../App';
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
  alternate: boolean;
}

const useStyles = makeStyles<Theme, Partial<ITicketItemProps> & { theme: PaletteType }>((theme) =>
  createStyles({
    root: {
      padding: theme.spacing(0, 1),
    },
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
    alternate: {
      backgroundColor: (props) => (props.alternate ? (props.theme === "light" ? grey[200] : grey[900]) : "transparent"),
    },
  })
);

export const TicketItem: FC<ITicketItemProps> = memo(
  ({ ticket, ticketNumber, emailId, owner, alternate }) => {
    const themeContext = useContext(ThemeContext);

    const styles = useStyles({ alternate, theme: themeContext.themeColor });

    const [mode, setMode] = useState<"loading" | "ready">("ready");

    const listItemRef = useRef<HTMLDivElement>(null);

    const crmService = useDependency(ICrmService);
    const crmServiceCache = useDependency(ICrmServiceCache);

    const currentUser = useSubscription(crmService.currentUser().getObservable());

    const currentSystemUser = useSubscriptionEffect(
      () =>
        currentUser &&
        crmService
          .users()
          .select("fullname", "systemuserid", "address1_telephone3")
          .filter(`systemuserid eq ${currentUser?.UserId}`)
          .orderBy("fullname")
          .getObservable(),
      [currentUser]
    )?.[0];

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

    const selected = ticketIsSelected(ticket);

    useEffect(() => {
      if (selected) {
        wait(200).then(() => scrollIntoView());
      }
    }, [scrollIntoView, ticket, selected]);

    const assignUser = useCallback(
      async (user: ICrmUser) => {
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

          await wait(experience.apiDelay);

          crmServiceCache.refresh("incidents");

          setMode("ready");
        }
      },
      [crmService, ticket.incidentid, crmServiceCache]
    );

    return (
      <ListItem
        dense
        disableGutters
        alignItems="flex-start"
        ref={listItemRef}
        className={clsx(styles.root, !selected && styles.alternate)}
        button={!selected as any}
        selected={selected}
        onClick={onClick(ticket)}
      >
        {mode === "loading" && <Loading overlay />}
        <Grid container direction="column" className={styles.content}>
          <Grid item container>
            <Grid item>
              <TicketIcon className={styles.icon} ticket={ticket} />
            </Grid>
            <Grid item sm>
              {owner && currentSystemUser && (
                <>
                  <Menu
                    className={styles.menu}
                    tooltip={emailTerms.more}
                    options={[
                      ticket.owninguser?.systemuserid !== currentSystemUser.systemuserid && {
                        icon: <PersonAdd />,
                        label: emailTerms.assignToMe,
                        onClick: () => assignUser(currentSystemUser),
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
            <Suspense fallback={<Loading />}>{selected && <TicketDetails ticket={ticket} emailId={emailId} />}</Suspense>
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
