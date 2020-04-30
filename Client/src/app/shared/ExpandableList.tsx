import clsx from 'clsx';
import React, { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
    createStyles,
    Grid,
    IconButton,
    makeStyles,
    Theme,
    Tooltip,
    useTheme
} from '@material-ui/core';
import { ExpandLess, ExpandMore } from '@material-ui/icons';

interface IExpandableListProps {
  tooltip?: [string, string];
  showOverlay?: boolean;
  className?: string;
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
      height: theme.spacing(3),
      bottom: 0,
      cursor: "pointer",
      background: `linear-gradient(0, ${theme.palette.background.default}, transparent)`,
      zIndex: 100
    },
    icon: {
      zIndex: 200
    }
  })
);

export const ExpandableList: FC<IExpandableListProps> = ({ tooltip, showOverlay, className, children }) => {
  const styles = useStyles();

  const [expanded, setExpanded] = useState(false);
  const [showExpand, setShowExpand] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const itemsRef = useRef<HTMLDivElement>(null);

  const getLabel = useMemo(() => tooltip && (!expanded ? tooltip[0] : tooltip[1]), [tooltip, expanded]);

  const theme = useTheme();

  useEffect(() => {
    const resizeWindow = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", resizeWindow);

    return () => window.removeEventListener("resize", resizeWindow);
  }, []);

  useLayoutEffect(() => {
    if (itemsRef.current && itemsRef.current.scrollHeight <= theme.spacing(6)) {
      setShowExpand(false);
      setExpanded(true);
    } else {
      setShowExpand(true);
      setExpanded(false);
    }
  }, [children, itemsRef, theme, windowWidth]);

  return (
    <div className={clsx(styles.root, !expanded && styles.collapsed, className)}>
      <div className={clsx(showOverlay && !expanded && styles.overlay)} onClick={_ => setExpanded(!expanded)} />
      <Grid container>
        <Grid item sm ref={itemsRef}>
          {children}
        </Grid>
        <Grid item className={styles.icon}>
          {showExpand &&
            (tooltip ? (
              <Tooltip title={getLabel} aria-label={getLabel}>
                <IconButton onClick={_ => setExpanded(!expanded)} aria-label={getLabel}>
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Tooltip>
            ) : (
              <IconButton onClick={_ => setExpanded(!expanded)} aria-label={getLabel}>
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            ))}
        </Grid>
      </Grid>
    </div>
  );
};
