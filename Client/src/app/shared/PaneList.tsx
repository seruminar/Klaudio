import clsx from 'clsx';
import React, { FC, useMemo, useState } from 'react';

import {
    createStyles,
    Grid,
    IconButton,
    List,
    makeStyles,
    Theme,
    Tooltip
} from '@material-ui/core';
import { ChevronLeft, ChevronRight } from '@material-ui/icons';

interface IPaneListProps {
  tooltip?: [string, string];
  expanded?: boolean;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    pane: {
      display: "flex",
      height: "100%",
      position: "relative",
      width: theme.spacing(52),
      flexDirection: "column",
      borderRight: `${theme.spacing(0.1)}px solid ${theme.palette.divider}`,
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    paneClosed: {
      width: theme.spacing(9),
      transition: theme.transitions.create("width", {
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
    paneList: {
      padding: 0,
      width: theme.spacing(51),
      position: "absolute",
      height: "100%"
    },
    overlay: {
      position: "absolute",
      width: "100%",
      height: `calc(100% - ${theme.spacing(6)}px)`,
      bottom: 0,
      cursor: "pointer",
      background: `linear-gradient(-90deg, ${theme.palette.background.default}, transparent)`,
      zIndex: 100
    }
  })
);

export const PaneList: FC<IPaneListProps> = ({ tooltip, expanded, children }) => {
  const styles = useStyles();

  const [paneOpen, setPaneOpen] = useState(expanded ?? true);

  const getLabel = useMemo(() => tooltip && (!paneOpen ? tooltip[0] : tooltip[1]), [tooltip, paneOpen]);

  return (
    <Grid item zeroMinWidth className={clsx(styles.pane, !paneOpen && styles.paneClosed)}>
      <div className={clsx(!paneOpen && styles.overlay)} onClick={() => setPaneOpen(!paneOpen)} />
      <div className={styles.paneHeader}>
        {tooltip ? (
          <Tooltip title={getLabel} aria-label={getLabel}>
            <IconButton onClick={() => setPaneOpen(!paneOpen)}>{paneOpen ? <ChevronLeft /> : <ChevronRight />}</IconButton>
          </Tooltip>
        ) : (
          <IconButton onClick={() => setPaneOpen(!paneOpen)}>{paneOpen ? <ChevronLeft /> : <ChevronRight />}</IconButton>
        )}
      </div>
      <div className={styles.paneListHolder}>
        <List className={styles.paneList}>{children}</List>
      </div>
    </Grid>
  );
};
