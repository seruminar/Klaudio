import clsx from 'clsx';
import React, { ReactElement, ReactNode, useMemo, useState } from 'react';

import { createStyles, IconButton, makeStyles, Theme, Tooltip } from '@material-ui/core';
import { ExpandLess, ExpandMore } from '@material-ui/icons';

import { email } from '../../terms.en-us.json';

interface IExpandableChips<T> {
  first?: ReactNode;
  items: T[];
  renderItem: (item: T) => ReactNode;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      overflow: "hidden",
      position: "relative"
    },
    collapsed: {
      maxHeight: theme.spacing(6)
    },
    overlay: {
      position: "absolute",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      background: `linear-gradient(0, ${theme.palette.background.default}, transparent)`,
      zIndex: 100
    },
    icon: {
      float: "right",
      zIndex: 200
    },
    items: {}
  })
);

export const ExpandableChips: <T>(props: IExpandableChips<T>) => ReactElement<IExpandableChips<T>> = ({ first, items, renderItem }) => {
  const styles = useStyles();

  const [expanded, setExpanded] = useState(false);

  const getLabel = useMemo(() => (expanded ? email.less : email.more), [expanded]);

  return (
    <div className={clsx(styles.root, !expanded && styles.collapsed)}>
      <div className={clsx(!expanded && styles.overlay)} />
      <Tooltip title={getLabel} aria-label={getLabel}>
        <IconButton className={styles.icon} onClick={_ => setExpanded(!expanded)} aria-label={getLabel}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Tooltip>
      <div className={styles.items}>
        {first}
        {items.map(renderItem)}
      </div>
    </div>
  );
};
