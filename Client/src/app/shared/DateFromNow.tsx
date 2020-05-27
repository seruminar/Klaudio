import moment from 'moment';
import React, { FC, ReactElement, useCallback, useEffect, useState } from 'react';

import { Chip, Tooltip } from '@material-ui/core';

interface IDateFromNowProps {
  date: string | Date;
  icon?: ReactElement;
}

export const DateFromNow: FC<IDateFromNowProps> = ({ date, icon }) => {
  const [ping, setPing] = useState(true);

  const now = new Date();

  useEffect(() => {
    const timeSpan = Math.abs(moment(date).diff(now));

    let nextRender = 1000;

    if (timeSpan > 1000 * 60 * 60) {
      nextRender *= 60 * 60;
    } else if (timeSpan > 1000 * 60) {
      nextRender *= 60;
    } else if (timeSpan > 1000 * 30) {
      nextRender *= 30;
    }

    setTimeout(() => setPing(!ping), nextRender);
  }, [date, now, ping]);

  const getDateString = useCallback((dateTimeString: Date | string) => moment(dateTimeString).format("LLL"), []);

  return (
    <Tooltip title={getDateString(date)} aria-label={getDateString(date)}>
      <Chip variant="outlined" size="small" component="span" icon={icon} label={moment(date).from(now)} />
    </Tooltip>
  );
};
