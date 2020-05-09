import clsx from 'clsx';
import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import sortArray from 'sort-array';

import {
    Box,
    createStyles,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Grid,
    InputAdornment,
    makeStyles,
    Radio,
    RadioGroup,
    Switch,
    Tab,
    Tabs,
    TextField,
    Theme,
    Tooltip
} from '@material-ui/core';
import { Alarm, Edit, FilterList, FlashOn, Person, Search } from '@material-ui/icons';
import { useMatch } from '@reach/router';

import { experience } from '../../../appSettings.json';
import { ICrmService } from '../../../services/crmService/CrmService';
import { ICrmTicket } from '../../../services/crmService/models/ICrmTicket';
import { TicketGroup } from '../../../services/crmService/models/TicketGroup';
import { TicketPriority } from '../../../services/crmService/models/TicketPriority';
import { TicketStatus } from '../../../services/crmService/models/TicketStatus';
import { useDependency } from '../../../services/dependencyContainer';
import { systemUser } from '../../../services/systemUser';
import { entityNames, tickets as ticketsTerms } from '../../../terms.en-us.json';
import { useSubscription, useSubscriptionEffect } from '../../../utilities/observables';
import { RoutedFC } from '../../../utilities/routing';
import { routes } from '../../routes';
import { Loading } from '../../shared/Loading';
import { PaneList } from '../../shared/PaneList';
import { TicketItem } from './TicketItem';
import { TicketsFilterField } from './TicketsFilterField';

type OrderBy = "modified" | "due" | "owner" | "priority";

enum TicketsTabs {
  Filter,
  Search
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    search: {
      height: "100%",
      maxWidth: theme.spacing(32),
      borderRight: `${theme.spacing(0.1)}px solid ${theme.palette.divider}`
    },
    emailView: {
      display: "flex",
      margin: theme.spacing(2),
      flex: 1,
      "& > div": {
        width: "100%"
      }
    },
    hidden: {
      display: "none"
    },
    tab: {
      [theme.breakpoints.up("sm")]: {
        minWidth: theme.spacing(2)
      }
    },
    emailRouter: { display: "flex", minWidth: 0, width: "100%" },
    fill: {
      flex: 1
    },
    filter: {
      flex: 1
    },
    filterField: {
      width: "100% ",
      padding: theme.spacing(1, 2)
    },
    orderByRow: {
      "& > label": {
        margin: "initial"
      }
    },
    orderByIcon: {
      display: "block"
    },
    searchLoading: {
      height: "1em"
    }
  })
);

export const Tickets: RoutedFC = ({ children }) => {
  const styles = useStyles();

  const [tab, setTab] = useState<TicketsTabs>(TicketsTabs.Filter);
  const [ticketQueue, setTicketQueue] = useState<string>(TicketGroup.Support.toString());
  const [ticketStatus, setTicketStatus] = useState<string>(TicketStatus.Queue.toString());
  const [ticketPriority, setTicketPriority] = useState<string | null>(null);
  const [ticketOwner, setTicketOwner] = useState<string | null>(null);
  const [ticketOrderBy, setTicketOrderBy] = useState<OrderBy>("modified");
  const [orderByReverse, setOrderByReverse] = useState(false);
  const [searchTicketNumber, setSearchTicketNumber] = useState("");
  const [searchTicketNumberFilter, setSearchTicketNumberFilter] = useState<string>();
  const [searching, setSearching] = useState(false);

  const searchTicketNumberStream = useRef(new Subject<string>());

  const ticketPath = useMatch(`${routes.base}${routes.tickets}/*ticketPath`)?.ticketPath;
  const [ticketNumber, emailId] = (ticketPath ?? "").split("/");

  const crmService = useDependency(ICrmService);

  const allTickets = useSubscription(
    crmService
      .tickets()
      .select("_ownerid_value", "prioritycode", "ticketnumber", "dyn_ticket_group", "statuscode")
      .filter(`statuscode eq ${TicketStatus.Queue}`)
      .top(100)
      .orderBy("modifiedon desc")
      .getObservable()
  );

  const ticketsFilter = useMemo(() => {
    let filter = `dyn_ticket_group eq ${ticketQueue}`;

    if (ticketPriority) {
      filter += ` and prioritycode eq ${ticketPriority}`;
    }

    filter += ` and statuscode eq ${ticketStatus}`;

    if (ticketOwner) {
      filter += ` and _ownerid_value eq ${ticketOwner}`;
    }

    if (ticketNumber) {
      filter = `(${filter}) or ticketnumber eq '${ticketNumber}'`;
    }

    if (searchTicketNumberFilter) {
      filter = `Incident_Emails/any(e:contains(e/trackingtoken,'${searchTicketNumberFilter}'))`;
    }

    return filter;
  }, [ticketQueue, ticketPriority, ticketStatus, ticketOwner, ticketNumber, searchTicketNumberFilter]);

  const tickets = useSubscriptionEffect(
    (previousValue: ICrmTicket[] | undefined) =>
      crmService
        .tickets()
        .select(
          "title",
          "ken_sladuedate",
          "modifiedon",
          "createdon",
          "ticketnumber",
          "dyn_issla",
          "dyn_is2level",
          "prioritycode",
          "dyn_ticket_group",
          "statuscode"
        )
        .filter(ticketsFilter)
        .top(100)
        .orderBy("modifiedon desc")
        .expand("customerid_account", ["name", "ken_customernote", "ken_supportlevel"])
        .expand("owninguser", ["fullname"])
        .getObservable(previousValue),
    [ticketsFilter]
  );

  useEffect(() => {
    if (tickets) {
      setSearching(false);
    }
  }, [tickets]);

  const usersFilter = useMemo(() => {
    switch (parseInt(ticketQueue)) {
      case TicketGroup.Support:
        return `address1_telephone3 eq 'supportplugin' or address1_telephone3 eq 'supportconsultingplugin'`;
      case TicketGroup.Consulting:
        return `address1_telephone3 eq 'consultingplugin' or address1_telephone3 eq 'supportconsultingplugin'`;
      case TicketGroup.SalesEngineering:
        return `address1_telephone3 eq 'salesplugin'`;
      case TicketGroup.Training:
        return `address1_telephone3 eq 'trainingplugin'`;
    }
  }, [ticketQueue]);

  const users = useSubscriptionEffect(() => {
    if (usersFilter) {
      return crmService
        .users()
        .select("fullname", "systemuserid", "address1_telephone3")
        .filter(usersFilter)
        .orderBy("fullname")
        .getObservable();
    }
  }, [usersFilter]);

  const usersFilterOptions = useMemo(() => {
    let options: { [key: string]: string } = {};

    if (users) {
      [systemUser, ...users].map(user => (options[user.systemuserid] = user.fullname ?? user.systemuserid));
    }

    return options;
  }, [users]);

  useEffect(() => {
    const subscription = searchTicketNumberStream.current.pipe(debounceTime(experience.searchTimeout)).subscribe({
      next: async ticketNumber => {
        setSearching(true);
        setSearchTicketNumberFilter(ticketNumber);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const orderedTickets = useMemo(() => {
    if (tickets) {
      const order = orderByReverse ? "asc" : "desc";

      const unassigned = (ticket: ICrmTicket) =>
        ticket.owninguser?.systemuserid === systemUser.systemuserid ? (orderByReverse ? 1 : 3) : 2;

      switch (ticketOrderBy) {
        case "modified":
          return sortArray(tickets, {
            by: ["unassigned", "modifiedon"],
            order: [order, order],
            computed: {
              unassigned
            }
          });
        case "due":
          return sortArray(tickets, {
            by: ["unassigned", "ken_sladuedate"],
            order: [order, order],
            computed: {
              unassigned
            }
          });
        case "owner":
          return sortArray(tickets, {
            by: ["unassigned", "name"],
            order: [order, order],
            computed: {
              unassigned,
              name: ticket =>
                ticket.owninguser?.systemuserid === systemUser.systemuserid ? (orderByReverse ? "Zz" : "Aa") : ticket.owninguser?.fullname
            }
          });
        case "priority":
          return sortArray(tickets, {
            by: ["unassigned", "priority"],
            order: [order, order],
            computed: {
              unassigned,
              priority: ticket => {
                switch (ticket.prioritycode) {
                  case TicketPriority.FireFighting:
                    return 1;
                  case TicketPriority.HighPriority:
                    return 2;
                  case TicketPriority.Normal:
                    return 3;
                  case TicketPriority.WaitingForDevelopers:
                    return 4;
                  case TicketPriority.LowPriority:
                    return 5;
                  case TicketPriority.Processed:
                    return 6;
                }
              }
            }
          });
      }
    }
  }, [tickets, ticketOrderBy, orderByReverse]);

  const changeTab = useCallback((_event: ChangeEvent<{}>, newValue: TicketsTabs) => {
    switch (newValue) {
      case TicketsTabs.Filter:
        setSearchTicketNumber("");
        setSearchTicketNumberFilter(undefined);
        break;
    }

    setTab(newValue);
  }, []);

  return (
    <Grid container wrap="nowrap">
      <Grid item zeroMinWidth className={styles.search} container direction="column" xs={2}>
        <Tabs variant="fullWidth" value={tab} onChange={changeTab}>
          <Tab classes={{ fullWidth: styles.tab }} icon={<FilterList />} />
          <Tab classes={{ fullWidth: styles.tab }} icon={<Search />} />
        </Tabs>
        <Grid
          container
          className={clsx(styles.filter, tab !== TicketsTabs.Filter && styles.hidden)}
          direction="column"
          justify="flex-start"
        >
          <Box className={styles.filterField}>
            <TicketsFilterField
              options={entityNames.ticketGroup}
              label={ticketsTerms.queue}
              getCount={value =>
                allTickets
                  ?.filter(ticket => ticket.dyn_ticket_group === parseInt(value))
                  .filter(ticket => ticket.statuscode === parseInt(ticketStatus)).length
              }
              value={ticketQueue}
              setValue={value => setTicketQueue(value ? value : TicketGroup.Support.toString())}
            />
          </Box>
          <Box className={styles.filterField}>
            <TicketsFilterField
              options={entityNames.ticketPriority}
              label={ticketsTerms.priority}
              getCount={value =>
                allTickets
                  ?.filter(ticket => ticket.dyn_ticket_group === parseInt(ticketQueue))
                  .filter(ticket => ticket.prioritycode === parseInt(value))
                  .filter(ticket => ticket.statuscode === parseInt(ticketStatus)).length
              }
              value={ticketPriority}
              setValue={value => setTicketPriority(value)}
            />
          </Box>
          <Box className={styles.filterField}>
            <TicketsFilterField
              options={entityNames.ticketStatus}
              label={ticketsTerms.status}
              value={ticketStatus}
              setValue={value => setTicketStatus(value ? value : TicketStatus.Queue.toString())}
            />
          </Box>
          <Box className={styles.filterField}>
            <TicketsFilterField
              options={usersFilterOptions}
              label={ticketsTerms.owner}
              getCount={value =>
                allTickets
                  ?.filter(ticket => ticket.dyn_ticket_group === parseInt(ticketQueue))
                  .filter(ticket => ticket.statuscode === parseInt(ticketStatus))
                  .filter(ticket => ticket._ownerid_value === value).length
              }
              value={ticketOwner}
              setValue={value => setTicketOwner(value)}
            />
          </Box>
          <Box className={styles.filterField}>
            <FormGroup>
              <FormControl component="fieldset">
                <FormLabel component="legend">{ticketsTerms.orderBy}</FormLabel>
                <RadioGroup
                  row
                  className={styles.orderByRow}
                  aria-label={ticketsTerms.orderBy}
                  name={ticketsTerms.orderBy}
                  value={ticketOrderBy}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setTicketOrderBy(event.target.value as OrderBy)}
                >
                  <FormControlLabel
                    value="modified"
                    control={<Radio color="primary" />}
                    label={
                      <Tooltip title={ticketsTerms.modified} aria-label={ticketsTerms.modified}>
                        <Edit className={styles.orderByIcon} />
                      </Tooltip>
                    }
                  />
                  <FormControlLabel
                    value="due"
                    control={<Radio color="primary" />}
                    label={
                      <Tooltip title={ticketsTerms.due} aria-label={ticketsTerms.due}>
                        <Alarm className={styles.orderByIcon} />
                      </Tooltip>
                    }
                  />
                  <FormControlLabel
                    value="priority"
                    control={<Radio color="primary" />}
                    label={
                      <Tooltip title={ticketsTerms.priority} aria-label={ticketsTerms.priority}>
                        <FlashOn className={styles.orderByIcon} />
                      </Tooltip>
                    }
                  />
                  <FormControlLabel
                    value="owner"
                    control={<Radio color="primary" />}
                    label={
                      <Tooltip title={ticketsTerms.owner} aria-label={ticketsTerms.owner}>
                        <Person className={styles.orderByIcon} />
                      </Tooltip>
                    }
                  />
                </RadioGroup>
              </FormControl>
              <FormControlLabel
                control={<Switch color="primary" checked={orderByReverse} onChange={() => setOrderByReverse(!orderByReverse)} />}
                label={ticketsTerms.orderByReverse}
              />
            </FormGroup>
          </Box>
          <Box className={styles.fill} />
        </Grid>
        <Grid
          container
          className={clsx(styles.filter, tab !== TicketsTabs.Search && styles.hidden)}
          direction="column"
          justify="flex-start"
        >
          <Box className={styles.filterField}>
            <TextField
              label={ticketsTerms.ticketNumber}
              fullWidth
              value={searchTicketNumber}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setSearchTicketNumber(event.target.value);
                searchTicketNumberStream.current.next(event.target.value);
              }}
              InputProps={
                searching
                  ? {
                      endAdornment: (
                        <InputAdornment position="end" className={styles.searchLoading}>
                          <Loading small />
                        </InputAdornment>
                      )
                    }
                  : undefined
              }
            />
          </Box>
          <Box className={styles.fill}></Box>
        </Grid>
      </Grid>
      <PaneList tooltip={[ticketsTerms.expand, ticketsTerms.collapse]}>
        {!tickets && <Loading />}
        {orderedTickets?.map(ticket => (
          <TicketItem
            key={ticket.incidentid}
            ticket={ticket}
            ticketNumber={ticketNumber}
            emailId={emailId}
            owner={ticket.owninguser?.systemuserid === systemUser.systemuserid ? systemUser : ticket.owninguser}
          />
        ))}
      </PaneList>
      <Grid item zeroMinWidth className={styles.emailView} xs={"auto"}>
        {ticketNumber && children}
      </Grid>
    </Grid>
  );
};
