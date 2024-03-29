import clsx from 'clsx';
import React, { FC, useMemo } from 'react';

import { Avatar, createStyles, makeStyles, Tooltip } from '@material-ui/core';
import {
    amber,
    blue,
    deepOrange,
    green,
    indigo,
    orange,
    red,
    yellow
} from '@material-ui/core/colors';

import { ICrmTicket } from '../../../services/crmService/models/ICrmTicket';
import { SupportLevel } from '../../../services/crmService/models/SupportLevel';
import { TicketPriority } from '../../../services/crmService/models/TicketPriority';
import { entityNames, ticket as ticketTerms } from '../../../terms.en-us.json';

interface ITicketIconProps {
  ticket: ICrmTicket;
  className?: string;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    metadata: {
      whiteSpace: "nowrap",
      "& > *": {
        margin: theme.spacing(0.5),
      },
    },
    premium: {
      background: indigo.A700,
    },
    fireFighting: {
      background: `repeating-linear-gradient(135deg, ${amber[600]} 0 ${theme.spacing(0.25)}px, ${deepOrange[200]} ${theme.spacing(
        0.25
      )}px ${theme.spacing(0.75)}px)`,
    },
    doNotProvideSupport: {
      background: red[600],
    },
    important: {
      background: orange[800],
    },
    vip: {
      background: yellow[600],
    },
    prospect: {
      background: green[500],
    },
    newcomer: {
      background: green.A400,
    },
    kenticoCloud: {
      background: blue.A400,
    },
    unknown: {
      background: red[200],
    },
  })
);

export const TicketIcon: FC<ITicketIconProps> = ({ ticket, className }) => {
  const styles = useStyles();

  const ticketClass = useMemo(() => {
    const priority = ticket.prioritycode;

    if (priority) {
      switch (priority) {
        case TicketPriority.FireFighting:
          return styles.fireFighting;
      }
    }

    if (ticket.dyn_issla) {
      return styles.premium;
    }

    const supportLevel = ticket.customerid_account?.ken_supportlevel;

    if (supportLevel) {
      switch (supportLevel) {
        case SupportLevel.DoNotProvideSupport:
          return styles.doNotProvideSupport;
        case SupportLevel.Important:
          return styles.important;
        case SupportLevel.VIP:
          return styles.vip;
        case SupportLevel.Prospect:
          return styles.prospect;
        case SupportLevel.Newcomer:
          return styles.newcomer;
        case SupportLevel.KenticoCloud:
          return styles.kenticoCloud;
        default:
          return undefined;
      }
    }

    return styles.unknown;
  }, [
    styles.doNotProvideSupport,
    styles.premium,
    styles.fireFighting,
    styles.important,
    styles.kenticoCloud,
    styles.newcomer,
    styles.prospect,
    styles.unknown,
    styles.vip,
    ticket.dyn_issla,
    ticket.customerid_account,
    ticket.prioritycode,
  ]);

  const ticketPriority = useMemo(() => {
    const priority = ticket.prioritycode;

    if (priority) {
      switch (priority) {
        case TicketPriority.LowPriority:
        case TicketPriority.HighPriority:
        case TicketPriority.Processed:
        case TicketPriority.WaitingForDevelopers:
        case TicketPriority.FireFighting:
          return entityNames.ticketPriority[priority];
      }
    }
  }, [ticket.prioritycode]);

  const supportLevel = useMemo(() => {
    if (ticket.dyn_issla) {
      return ticketTerms.premium;
    }

    const supportLevel = ticket.customerid_account?.ken_supportlevel;

    if (supportLevel) {
      return entityNames.supportLevel[supportLevel];
    }

    return ticketTerms.unknown;
  }, [ticket.dyn_issla, ticket.customerid_account]);

  return (
    <Tooltip
      title={ticketPriority ? `${supportLevel} ${ticketPriority}` : supportLevel}
      aria-label={ticketPriority ? `${supportLevel} ${ticketPriority}` : supportLevel}
    >
      <Avatar variant={ticket.dyn_is2level ? "rounded" : "circle"} className={clsx(ticketClass, className)}>
        {ticket.dyn_issla ? ticketTerms.premium[0] : ""}
        {ticketClass === styles.unknown ? "?" : ticketPriority && ticketPriority[0]}
      </Avatar>
    </Tooltip>
  );
};
