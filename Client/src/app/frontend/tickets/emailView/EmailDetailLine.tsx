import React, { FC } from 'react';

import { createStyles, makeStyles, Theme, Typography } from '@material-ui/core';

interface IEmailDetailLineProps {
  label: string;
  value: string;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: { margin: theme.spacing(0.5), maxWidth: theme.spacing(60) },
    partyChip: {
      margin: theme.spacing(0, 0.5)
    }
  })
);

export const EmailDetailLine: FC<IEmailDetailLineProps> = ({ label, value }) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <Typography variant="caption" color="textSecondary">
        {label}
      </Typography>
      <Typography variant="caption" className={styles.partyChip}>
        {value}
      </Typography>
    </div>
  );
};
