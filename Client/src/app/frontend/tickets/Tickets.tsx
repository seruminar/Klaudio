import moment, { Moment } from 'moment';
import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import sortArray from 'sort-array';

import {
    Box,
    createStyles,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Grid,
    makeStyles,
    Radio,
    RadioGroup,
    Switch,
    Tab,
    Tabs,
    Tooltip
} from '@material-ui/core';
import { Alarm, Cake, Edit, FilterList, FlashOn, Person, Search } from '@material-ui/icons';
import { useMatch } from '@reach/router';
import { useLocalStorage } from '@rehooks/local-storage';

import { useDependency } from '../../../dependencyContainer';
import { ICrmService } from '../../../services/crmService/CrmService';
import { ICrmTicket } from '../../../services/crmService/models/ICrmTicket';
import { ICrmUser } from '../../../services/crmService/models/ICrmUser';
import { TicketGroup } from '../../../services/crmService/models/TicketGroup';
import { TicketPriority } from '../../../services/crmService/models/TicketPriority';
import { TicketStatus } from '../../../services/crmService/models/TicketStatus';
import { systemUser } from '../../../services/systemUser';
import { entityNames, tickets as ticketsTerms } from '../../../terms.en-us.json';
import { useSubscription, useSubscriptionEffect } from '../../../utilities/observables';
import { RoutedFC } from '../../../utilities/routing';
import { routes } from '../../routes';
import { Loading } from '../../shared/Loading';
import { PaneList } from '../../shared/PaneList';
import { LocalStorageKeys } from '../LocalStorageKeys';
import { EmailLoader } from './emailView/EmailLoader';
import { TicketItem } from './TicketItem';
import { TicketsFilterDatesField } from './TicketsFilterDatesField';
import { TicketsFilterField } from './TicketsFilterField';
import { TicketsSearchField } from './TicketsSearchField';

type OrderBy = "modified" | "due" | "created" | "owner" | "priority";

enum TicketsTabs {
  Filter,
  Search,
}

interface ITicketsProps {
  ticketNumber: string;
  emailId: string;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    search: {
      height: "100%",
      maxWidth: theme.spacing(28),
      borderRight: `${theme.spacing(0.1)}px solid ${theme.palette.divider}`,
    },
    emailView: {
      display: "flex",
      margin: theme.spacing(2),
      flex: 1,
      "& > div": {
        width: "100%",
      },
    },
    hidden: {
      display: "none",
    },
    tab: {
      [theme.breakpoints.up("sm")]: {
        minWidth: theme.spacing(2),
      },
    },
    emailRouter: { display: "flex", minWidth: 0, width: "100%" },
    fill: {
      flex: 1,
    },
    filter: {
      flex: 1,
    },
    filterField: {
      width: "100%",
      padding: theme.spacing(0.5, 1),
    },
    orderByRow: {
      "& > label": {
        margin: "initial",
      },
    },
    orderByIcon: {
      display: "block",
    },
    searchLoading: {
      height: "1em",
    },
  })
);

export const Tickets: RoutedFC<ITicketsProps> = () => {
  const styles = useStyles();

  const [tab, setTab] = useState<TicketsTabs>(TicketsTabs.Filter);

  const [ticketQueue, setTicketQueue] = useLocalStorage(LocalStorageKeys.TicketQueue, TicketGroup.Support.toString());
  const [ticketPriority, setTicketPriority] = useLocalStorage<string | null>(LocalStorageKeys.TicketPriority, null);
  const [ticketStatus, setTicketStatus] = useLocalStorage<string | null>(LocalStorageKeys.TicketStatus, null);
  const [ticketOwner, setTicketOwner] = useLocalStorage<string | null>(LocalStorageKeys.TicketOwner, null);
  const [ticketDates, setTicketDates] = useLocalStorage<[Moment | null, Moment | null]>(LocalStorageKeys.TicketDates, [null, null]);
  const [ticketOrderBy, setTicketOrderBy] = useLocalStorage<OrderBy>(LocalStorageKeys.TicketOrderBy, "modified");
  const [orderByReverse, setOrderByReverse] = useLocalStorage(LocalStorageKeys.OrderByReverse, false);
  const [unassignedFirst, setUnassignedFirst] = useLocalStorage(LocalStorageKeys.UnassignedFirst, true);

  const [searching, setSearching] = useState(false);
  const [searchTicketNumberFilter, setSearchTicketNumberFilter] = useState<string>();
  const [searchTicketOwnerFilter, setSearchTicketOwnerFilter] = useState<string>();

  const [ticketNumber, emailId] = useMatch(`${routes.base}${routes.tickets}/*ticketPath`)?.ticketPath?.split("/") || [undefined, undefined];

  const crmService = useDependency(ICrmService);

  const currentUser = useSubscription(crmService.currentUser().getObservable());

  const allTickets = useSubscription(
    crmService
      .tickets()
      .select("_ownerid_value", "prioritycode", "dyn_ticket_group")
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

    if (ticketStatus) {
      filter += ` and statuscode eq ${ticketStatus}`;
    }

    if (ticketOwner) {
      filter += ` and _ownerid_value eq ${ticketOwner}`;
    }

    if (ticketDates[0]) {
      filter += ` and modifiedon gt ${moment(ticketDates[0]).toISOString()}`;
    }

    if (ticketDates[1]) {
      filter += ` and modifiedon lt ${moment(ticketDates[1]).toISOString()}`;
    }

    if (ticketNumber) {
      filter = `(${filter}) or ticketnumber eq '${ticketNumber}'`;
    }

    if (searchTicketNumberFilter) {
      filter = `Incident_Emails/any(e:contains(e/trackingtoken,'${searchTicketNumberFilter}'))`;
    }

    if (searchTicketOwnerFilter) {
      filter = `contains(customerid_account/name, '${searchTicketOwnerFilter}')`;
    }

    return filter;
  }, [
    ticketQueue,
    ticketPriority,
    ticketStatus,
    ticketOwner,
    ticketDates,
    ticketNumber,
    searchTicketNumberFilter,
    searchTicketOwnerFilter,
  ]);

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
    if (users && currentUser) {
      let options: { [key: string]: string } = {};

      let sortedUsers = sortArray([systemUser, ...users], {
        by: ["parentheses", "fullname"],
        computed: {
          parentheses: (user: ICrmUser) =>
            user.systemuserid === systemUser.systemuserid || user.systemuserid === currentUser.UserId ? 1 : 2,
        },
      });

      for (const user of sortedUsers) {
        if (user.systemuserid === currentUser.UserId) {
          options[user.systemuserid] = ticketsTerms.me;
        } else if (user.fullname) {
          options[user.systemuserid] = user.fullname;
        } else {
          options[user.systemuserid] = user.systemuserid;
        }
      }

      return options;
    }
  }, [users, currentUser]);

  const getUserFilterOptionString = useCallback(
    (userId: string) => {
      if (users) {
        const user = users.find((user) => user.systemuserid === userId);

        if (user?.fullname) {
          return user.fullname;
        }
      }

      if (usersFilterOptions) {
        return usersFilterOptions[userId];
      }

      return userId;
    },
    [users, usersFilterOptions]
  );

  const orderedTickets = useMemo(() => {
    if (tickets) {
      const order = orderByReverse ? "asc" : "desc";

      const unassigned = (ticket: ICrmTicket) =>
        ticket.owninguser?.systemuserid === systemUser.systemuserid ? (orderByReverse ? 1 : 3) : 2;

      switch (ticketOrderBy) {
        case "modified":
          return sortArray(tickets, {
            by: unassignedFirst ? ["unassigned", "modifiedon"] : ["modifiedon"],
            order: [order, order],
            computed: {
              unassigned,
            },
          });
        case "due":
          return sortArray(tickets, {
            by: unassignedFirst ? ["unassigned", "ken_sladuedate"] : ["ken_sladuedate"],
            order: [order, order],
            computed: {
              unassigned,
            },
          });
        case "created":
          return sortArray(tickets, {
            by: unassignedFirst ? ["unassigned", "createdon"] : ["createdon"],
            order: [order, order],
            computed: {
              unassigned,
            },
          });
        case "owner":
          return sortArray(tickets, {
            by: unassignedFirst ? ["unassigned", "name"] : ["name"],
            order: [order, order],
            computed: {
              unassigned,
              name: (ticket) =>
                ticket.owninguser?.systemuserid === systemUser.systemuserid ? (orderByReverse ? "Zz" : "Aa") : ticket.owninguser?.fullname,
            },
          });
        case "priority":
          return sortArray(tickets, {
            by: unassignedFirst ? ["unassigned", "priority"] : ["priority"],
            order: [order, order],
            computed: {
              unassigned,
              priority: (ticket) => {
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
              },
            },
          });
      }
    }
  }, [tickets, ticketOrderBy, orderByReverse, unassignedFirst]);

  const changeTab = useCallback((_event: ChangeEvent<{}>, newValue: TicketsTabs) => {
    switch (newValue) {
      case TicketsTabs.Filter:
        setSearchTicketNumberFilter(undefined);
        setSearchTicketOwnerFilter(undefined);
        break;
    }

    setTab(newValue);
  }, []);

  return (
    <>
      <Helmet>
        <title>
          {`${ticketsTerms.cases} | ${(entityNames.ticketGroup as any)[ticketQueue]} (${
            allTickets?.filter((ticket) => ticket.dyn_ticket_group === parseInt(ticketQueue)).length
          })`}
        </title>
      </Helmet>
      <Grid container wrap="nowrap">
        <Grid item zeroMinWidth className={styles.search} container direction="column" xs={2}>
          <Tabs variant="fullWidth" value={tab} onChange={changeTab}>
            <Tab classes={{ fullWidth: styles.tab }} icon={<FilterList />} />
            <Tab classes={{ fullWidth: styles.tab }} icon={<Search />} />
          </Tabs>
          {tab === TicketsTabs.Filter && (
            <Grid container className={styles.filter} direction="column" justify="flex-start">
              <Box className={styles.filterField}>
                <TicketsFilterField
                  options={entityNames.ticketGroup}
                  label={ticketsTerms.queue}
                  getCount={(value) => allTickets?.filter((ticket) => ticket.dyn_ticket_group === parseInt(value)).length}
                  value={ticketQueue}
                  setValue={(value) => setTicketQueue(value ? value : TicketGroup.Support.toString())}
                />
              </Box>
              <Box className={styles.filterField}>
                <TicketsFilterField
                  options={entityNames.ticketStatus}
                  label={ticketsTerms.status}
                  value={ticketStatus}
                  setValue={setTicketStatus}
                />
              </Box>
              <Box className={styles.filterField}>
                <TicketsFilterField
                  options={entityNames.ticketPriority}
                  label={ticketsTerms.priority}
                  getCount={(value) =>
                    allTickets
                      ?.filter((ticket) => ticket.dyn_ticket_group === parseInt(ticketQueue))
                      .filter((ticket) => ticket.prioritycode === parseInt(value)).length
                  }
                  value={ticketPriority}
                  setValue={setTicketPriority}
                />
              </Box>
              <Box className={styles.filterField}>
                {!usersFilterOptions && <Loading />}
                {usersFilterOptions && (
                  <TicketsFilterField
                    options={usersFilterOptions}
                    label={ticketsTerms.owner}
                    getCount={(value) =>
                      allTickets
                        ?.filter((ticket) => ticket.dyn_ticket_group === parseInt(ticketQueue))
                        .filter((ticket) => ticket._ownerid_value === value).length
                    }
                    value={ticketOwner}
                    setValue={setTicketOwner}
                    getFilterOptionString={getUserFilterOptionString}
                  />
                )}
              </Box>
              <Box className={styles.filterField}>
                <TicketsFilterDatesField
                  labels={[ticketsTerms.dateFrom, ticketsTerms.dateTo]}
                  value={ticketDates}
                  setValue={setTicketDates}
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
                      onChange={(event) => setTicketOrderBy(event.target.value as OrderBy)}
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
                        value="created"
                        control={<Radio color="primary" />}
                        label={
                          <Tooltip title={ticketsTerms.created} aria-label={ticketsTerms.created}>
                            <Cake className={styles.orderByIcon} />
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
                  <FormControlLabel
                    control={<Switch color="primary" checked={unassignedFirst} onChange={() => setUnassignedFirst(!unassignedFirst)} />}
                    label={ticketsTerms.unassignedFirst}
                  />
                </FormGroup>
              </Box>
              <Box className={styles.fill} />
            </Grid>
          )}
          {tab === TicketsTabs.Search && (
            <Grid container className={styles.filter} direction="column" justify="flex-start">
              <Box className={styles.filterField}>
                <TicketsSearchField
                  label={ticketsTerms.ticketNumber}
                  searching={searchTicketNumberFilter !== undefined && searching}
                  setFilter={(value) => {
                    setSearching(true);
                    setSearchTicketOwnerFilter(undefined);
                    setSearchTicketNumberFilter(value);
                  }}
                  resetValue={searchTicketOwnerFilter !== undefined}
                />
              </Box>
              <Box className={styles.filterField}>
                <TicketsSearchField
                  label={ticketsTerms.ticketAccount}
                  searching={searchTicketOwnerFilter !== undefined && searching}
                  setFilter={(value) => {
                    setSearching(true);
                    setSearchTicketOwnerFilter(value);
                    setSearchTicketNumberFilter(undefined);
                  }}
                  resetValue={searchTicketNumberFilter !== undefined}
                />
              </Box>
              <Box className={styles.fill}></Box>
            </Grid>
          )}
        </Grid>
        <PaneList tooltip={[ticketsTerms.expand, ticketsTerms.collapse]}>
          {!tickets && <Loading />}
          {orderedTickets?.map((ticket, index) => (
            <TicketItem
              key={ticket.incidentid}
              ticket={ticket}
              ticketNumber={ticketNumber}
              emailId={emailId}
              owner={ticket.owninguser?.systemuserid === systemUser.systemuserid ? systemUser : ticket.owninguser}
              alternate={Boolean(index % 2)}
            />
          ))}
        </PaneList>
        <Grid item zeroMinWidth className={styles.emailView} xs={"auto"}>
          {ticketNumber && <EmailLoader ticketNumber={ticketNumber} emailId={emailId} users={users} />}
        </Grid>
      </Grid>
    </>
  );
};
