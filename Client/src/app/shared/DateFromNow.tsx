import moment from 'moment';
import React, { FC, ReactElement, useCallback } from 'react';

import { Chip, Tooltip } from '@material-ui/core';

interface IDateFromNowProps {
  date: string | Date;
  icon?: ReactElement;
}

export const DateFromNow: FC<IDateFromNowProps> = ({ date, icon }) => {
  const getDateString = useCallback((dateTimeString: Date | string) => new Date(dateTimeString).toDateString(), []);

  return (
    <Tooltip title={getDateString(date)} aria-label={getDateString(date)}>
      <Chip variant="outlined" size="small" component="span" icon={icon} label={moment(date).fromNow()} />
    </Tooltip>
  );
};
