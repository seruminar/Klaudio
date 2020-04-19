import clsx from 'clsx';
import React, { FC, useState } from 'react';

import {
    createStyles,
    Grid,
    GridSize,
    IconButton,
    List,
    makeStyles,
    Theme
} from '@material-ui/core';
import { ChevronLeft, ChevronRight } from '@material-ui/icons';

interface IPaneListProps {
  xs: GridSize;
  expanded?: boolean;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    pane: {
      display: "flex",
      height: "100%",
      minWidth: 0,
      flexDirection: "column",
      borderRight: `${theme.spacing(0.1)}px solid ${theme.palette.divider}`,
      transition: theme.transitions.create("max-width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    paneClosed: {
      maxWidth: theme.spacing(9),
      transition: theme.transitions.create("max-width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      })
    },
    paneHeader: {
      borderBottom: `${theme.spacing(0.1)}px solid ${theme.palette.divider}`,
      textAlign: "right"
    },
    paneListHolder: {
      height: `calc(100% - ${theme.spacing(6)}px)`,
      position: "relative",
      overflowX: "hidden",
      overflowY: "scroll"
    },
    paneListOpen: {
      width: "100%"
    },
    paneList: {
      padding: 0,
      position: "absolute"
    }
  })
);

export const PaneList: FC<IPaneListProps> = ({ xs, expanded, children }) => {
  const styles = useStyles();

  const [drawerOpen, setDrawerOpen] = useState(expanded ?? true);

  return (
    <Grid item className={clsx(styles.pane, !drawerOpen && styles.paneClosed)} xs={xs}>
      <div className={styles.paneHeader}>
        <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>{drawerOpen ? <ChevronLeft /> : <ChevronRight />}</IconButton>
      </div>
      <div className={styles.paneListHolder}>
        <List className={clsx(styles.paneList, drawerOpen && styles.paneListOpen)}>{children}</List>
      </div>
    </Grid>
  );
};
