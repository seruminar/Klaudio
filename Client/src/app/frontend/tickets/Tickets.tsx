import clsx from 'clsx';
import React, {
    ChangeEvent,
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

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
import { Autocomplete } from '@material-ui/lab';

import { experience } from '../../../appSettings.json';
import { ICrmService } from '../../../services/CrmService';
import { useDependency } from '../../../services/dependencyContainer';
import { ICrmTicket } from '../../../services/models/ICrmTicket';
import { ICrmUser } from '../../../services/models/ICrmUser';
import { TicketGroup } from '../../../services/models/TicketGroup';
import { TicketPriority } from '../../../services/models/TicketPriority';
import { TicketStatus } from '../../../services/models/TicketStatus';
import { systemUser } from '../../../services/systemUser';
import { entityNames, tickets as ticketsTerms } from '../../../terms.en-us.json';
import { RoutedFC } from '../../../utilities/routing';
import { Loading } from '../../shared/Loading';
import { PaneList } from '../../shared/PaneList';
import { TicketItem } from './TicketItem';

const EmailView = lazy(() => import("./emailView/EmailView").then(module => ({ default: module.EmailView })));

type OrderBy = "modified" | "due" | "owner" | "priority";

enum TicketsTabs {
  Filter,
  Search
}

interface ITicketsProps {
  ticketPath: string;
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
      height: "100%",
      flex: 1
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
      width: "100%",
      padding: theme.spacing(1, 2)
    },
    itemCount: { flex: 1, textAlign: "right", fontSize: ".75rem" },
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

export const Tickets: RoutedFC<ITicketsProps> = ({ ticketPath }) => {
  const styles = useStyles();

  const [tab, setTab] = useState<TicketsTabs>(TicketsTabs.Filter);
  const [ticketQueue, setTicketQueue] = useState<string>(TicketGroup.Support.toString());
  const [ticketStatus, setTicketStatus] = useState<string>(TicketStatus.Queue.toString());
  const [ticketPriority, setTicketPriority] = useState<string | null>(null);
  const [ticketOwner, setTicketOwner] = useState<ICrmUser | null>(null);
  const [ticketOrderBy, setTicketOrderBy] = useState<OrderBy>("modified");
  const [orderByReverse, setOrderByReverse] = useState(false);
  const [users, setUsers] = useState<ICrmUser[]>();
  const [allTickets, setAllTickets] = useState<ICrmTicket[]>();
  const [tickets, setTickets] = useState<ICrmTicket[]>();
  const [searchTicketNumber, setSearchTicketNumber] = useState("");
  const [searchTicketNumberFilter, setSearchTicketNumberFilter] = useState<string>();
  const [searching, setSearching] = useState(false);

  const searchTicketNumberStream = useRef(new Subject<string>());

  const crmService = useDependency(ICrmService);

  const [ticketNumber, emailId] = (ticketPath ?? "").split("/");

  useEffect(() => {
    (async () => {
      const allTickets = (
        await crmService
          .tickets()
          .select("_ownerid_value", "prioritycode", "ticketnumber", "dyn_ticket_group", "statuscode")
          .filter(`statuscode eq ${TicketStatus.Queue}`)
          .top(100)
          .orderBy("modifiedon desc")
      ).value;

      setAllTickets(allTickets);
    })();
  }, [crmService]);

  useEffect(() => {
    (async () => {
      let filter = `dyn_ticket_group eq ${ticketQueue}`;

      if (ticketPriority) {
        filter += ` and prioritycode eq ${ticketPriority}`;
      }

      filter += ` and statuscode eq ${ticketStatus}`;

      if (ticketOwner) {
        filter += ` and _ownerid_value eq ${ticketOwner.ownerid}`;
      }

      if (ticketNumber) {
        filter = `(${filter}) or ticketnumber eq '${ticketNumber}'`;
      }

      if (searchTicketNumberFilter) {
        filter = `Incident_Emails/any(e:contains(e/trackingtoken,'${searchTicketNumberFilter}'))`;
      }

      const tickets = (
        await crmService
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
          .filter(filter)
          .top(100)
          .orderBy("modifiedon desc")
          .expand("customerid_account", ["name", "ken_customernote", "ken_supportlevel"])
          .expand("owninguser", ["fullname"])
      ).value;

      setTickets(tickets);
      setSearching(false);
    })();
  }, [crmService, ticketQueue, ticketPriority, ticketStatus, ticketOwner, ticketNumber, searchTicketNumberFilter]);

  useEffect(() => {
    if (ticketQueue) {
      let filter = "";

      switch (parseInt(ticketQueue)) {
        case TicketGroup.Support:
          filter = `address1_telephone3 eq 'supportplugin' or address1_telephone3 eq 'supportconsultingplugin'`;
          break;
        case TicketGroup.Consulting:
          filter = `address1_telephone3 eq 'consultingplugin' or address1_telephone3 eq 'supportconsultingplugin'`;
          break;
        case TicketGroup.SalesEngineering:
          filter = `address1_telephone3 eq 'salesplugin'`;
          break;
        case TicketGroup.Training:
          filter = `address1_telephone3 eq 'trainingplugin'`;
          break;
      }

      (async () => {
        const users = (
          await crmService
            .users()
            .select("fullname", "systemuserid", "address1_telephone3")
            .filter(filter)
            .orderBy("fullname")
        ).value;

        setUsers([systemUser, ...users]);
      })();
    }
  }, [crmService, ticketQueue]);

  useEffect(() => {
    const subscription = searchTicketNumberStream.current.pipe(debounceTime(experience.searchTimeout)).subscribe({
      next: async ticketNumber => {
        setSearching(true);
        setSearchTicketNumberFilter(ticketNumber);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const orderedTickets = useMemo(
    () =>
      tickets?.sort((a: ICrmTicket, b: ICrmTicket) => {
        switch (ticketOrderBy) {
          case "modified":
            if (a.modifiedon && b.modifiedon) {
              return orderByReverse ? (a.modifiedon > b.modifiedon ? 1 : -1) : a.modifiedon < b.modifiedon ? 1 : -1;
            }
            break;
          case "due":
            if (a.ken_sladuedate && b.ken_sladuedate) {
              return orderByReverse ? (a.ken_sladuedate < b.ken_sladuedate ? 1 : -1) : a.ken_sladuedate > b.ken_sladuedate ? 1 : -1;
            }
            break;
          case "owner":
            if (a.owninguser?.fullname && b.owninguser?.fullname) {
              if (b.owninguser.systemuserid === systemUser.systemuserid) {
                return 1;
              }

              return orderByReverse
                ? a.owninguser.fullname < b.owninguser.fullname
                  ? 1
                  : -1
                : a.owninguser.fullname > b.owninguser.fullname
                ? 1
                : -1;
            }
            break;
          case "priority":
            if (a.prioritycode && b.prioritycode) {
              const getPrioritySort = (ticketPriority: TicketPriority) => {
                switch (ticketPriority) {
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
              };

              return orderByReverse
                ? getPrioritySort(a.prioritycode) < getPrioritySort(b.prioritycode)
                  ? 1
                  : -1
                : getPrioritySort(a.prioritycode) > getPrioritySort(b.prioritycode)
                ? 1
                : -1;
            }
            break;
        }

        return 0;
      }),
    [tickets, ticketOrderBy, orderByReverse]
  );

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
          {!(users && allTickets) && <Loading />}
          {users && allTickets && (
            <>
              <Box className={styles.filterField}>
                <Autocomplete
                  options={Object.keys(entityNames.ticketGroup)}
                  getOptionLabel={option => (entityNames.ticketGroup as any)[option]}
                  renderOption={option => {
                    const count = allTickets
                      .filter(ticket => ticket.dyn_ticket_group === parseInt(option))
                      .filter(ticket => ticket.statuscode === parseInt(ticketStatus)).length;

                    return (
                      <>
                        <span>{(entityNames.ticketGroup as any)[option]}</span>
                        {count > 0 && <span className={styles.itemCount}>{count}</span>}
                      </>
                    );
                  }}
                  value={ticketQueue}
                  onChange={(_event: any, newValue: string | null) => {
                    setTicketQueue(newValue ? newValue : TicketGroup.Support.toString());
                  }}
                  renderInput={params => {
                    const count = allTickets
                      .filter(ticket => ticket.dyn_ticket_group === (TicketGroup[(params.inputProps as any).value] as any))
                      .filter(ticket => ticket.statuscode === parseInt(ticketStatus)).length;

                    params.InputProps.endAdornment = (
                      <span className={styles.itemCount}>
                        {count > 0 && count}
                        {params.InputProps.endAdornment}
                      </span>
                    );

                    return <TextField {...params} label={ticketsTerms.queue} />;
                  }}
                />
              </Box>
              <Box className={styles.filterField}>
                <Autocomplete
                  options={Object.keys(entityNames.ticketPriority)}
                  getOptionLabel={option => (entityNames.ticketPriority as any)[option]}
                  renderOption={option => {
                    const count = allTickets
                      .filter(ticket => ticket.dyn_ticket_group === parseInt(ticketQueue))
                      .filter(ticket => ticket.prioritycode === parseInt(option))
                      .filter(ticket => ticket.statuscode === parseInt(ticketStatus)).length;

                    return (
                      <>
                        <span>{(entityNames.ticketPriority as any)[option]}</span>
                        {count > 0 && <span className={styles.itemCount}>{count}</span>}
                      </>
                    );
                  }}
                  value={ticketPriority}
                  onChange={(_event: any, newValue: string | null) => {
                    setTicketPriority(newValue ? newValue : TicketPriority.Normal.toString());
                  }}
                  renderInput={params => {
                    const count = allTickets
                      .filter(ticket => ticket.dyn_ticket_group === parseInt(ticketQueue))
                      .filter(ticket => ticket.prioritycode === (TicketPriority[(params.inputProps as any).value] as any))
                      .filter(ticket => ticket.statuscode === parseInt(ticketStatus)).length;

                    params.InputProps.endAdornment = (
                      <span className={styles.itemCount}>
                        {count > 0 && count}
                        {params.InputProps.endAdornment}
                      </span>
                    );

                    return <TextField {...params} label={ticketsTerms.priority} />;
                  }}
                />
              </Box>
              <Box className={styles.filterField}>
                <Autocomplete
                  options={Object.keys(entityNames.ticketStatus)}
                  getOptionLabel={option => (entityNames.ticketStatus as any)[option]}
                  value={ticketStatus}
                  onChange={(_event: any, newValue: string | null) => {
                    setTicketStatus(newValue ? newValue : TicketStatus[TicketStatus.Queue]);
                  }}
                  renderInput={params => <TextField {...params} label={ticketsTerms.status} />}
                />
              </Box>
              <Box className={styles.filterField}>
                <Autocomplete
                  options={users}
                  getOptionLabel={option => option.fullname ?? option.systemuserid}
                  renderOption={option => {
                    const count = allTickets
                      .filter(ticket => ticket.dyn_ticket_group === parseInt(ticketQueue))
                      .filter(ticket => ticket.statuscode === parseInt(ticketStatus))
                      .filter(ticket => ticket._ownerid_value === option.ownerid).length;

                    return (
                      <>
                        <span>{option.fullname}</span>
                        {count > 0 && <span className={styles.itemCount}>{count}</span>}
                      </>
                    );
                  }}
                  value={ticketOwner}
                  onChange={(_event: any, newValue: ICrmUser | null) => {
                    setTicketOwner(newValue);
                  }}
                  renderInput={params => {
                    const count = allTickets
                      .filter(ticket => ticket.dyn_ticket_group === parseInt(ticketQueue))
                      .filter(ticket => ticket.statuscode === parseInt(ticketStatus))
                      .filter(ticket => ticket.owninguser?.fullname === (params.inputProps as any).value).length;

                    params.InputProps.endAdornment = (
                      <span className={styles.itemCount}>
                        {count > 0 && count}
                        {params.InputProps.endAdornment}
                      </span>
                    );

                    return <TextField {...params} label={ticketsTerms.owner} />;
                  }}
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
            </>
          )}
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
            key={ticket.ticketnumber}
            ticket={ticket}
            owner={ticket.owninguser?.ownerid === systemUser.ownerid ? systemUser : ticket.owninguser}
          />
        ))}
      </PaneList>
      <Grid item zeroMinWidth className={styles.emailView} xs={"auto"}>
        <Suspense fallback={<Loading />}>{ticketNumber && <EmailView ticketNumber={ticketNumber} emailId={emailId} />}</Suspense>
      </Grid>
    </Grid>
  );
};
