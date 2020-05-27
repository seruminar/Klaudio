import React, { Dispatch, ReactElement, ReactNode, SetStateAction, useState } from 'react';

import {
    Box,
    createStyles,
    ExpansionPanel,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    List,
    makeStyles
} from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';

import { ExpandablePanelItem, ExpandablePanelItemMode } from './ExpandablePanelItem';

interface IExpandablePanelProps<T> {
  label: ReactNode;
  expanded?: boolean;
  items: T[] | undefined;
  selected?: (item: T) => boolean;
  getAvatar?: (item: T) => ReactNode;
  getHeading: (item: T) => ReactNode;
  getRight?: (item: T) => ReactNode;
  getAction?: (item: T, mode: ExpandablePanelItemMode, setMode: Dispatch<SetStateAction<ExpandablePanelItemMode>>) => ReactNode;
  getText?: (item: T, mode: ExpandablePanelItemMode, setMode: Dispatch<SetStateAction<ExpandablePanelItemMode>>) => ReactNode;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      background: "none",
      margin: `${theme.spacing(1)}px 0 !important`,
      "&:before": {
        background: "none",
      },
      "& .MuiExpansionPanelSummary-expandIcon": {
        padding: "initial",
      },
    },
    summaryRoot: { minHeight: `${theme.spacing(5)}px !important` },
    summary: { margin: "0 !important" },
    summaryHolder: {
      display: "flex",
      justifyContent: "space-between",
      width: "100%",
      padding: theme.spacing(0, 1, 0, 0),
    },
    container: { padding: theme.spacing(0.5) },
    list: {
      overflowY: "scroll",
      overscrollBehavior: "contain",
      width: "100%",
      maxHeight: theme.spacing(20),
    },
  })
);

export const ExpandablePanel: <T>(props: IExpandablePanelProps<T>) => ReactElement<IExpandablePanelProps<T>> = ({
  label,
  expanded,
  items,
  selected,
  getAvatar,
  getHeading,
  getRight,
  getAction,
  getText,
}) => {
  const styles = useStyles();

  const [expand, setExpand] = useState(expanded ?? false);

  return (
    <ExpansionPanel
      className={styles.root}
      square
      expanded={expand}
      onChange={(_, expand) => setExpand(expand)}
      onClick={(event) => event.stopPropagation()}
    >
      <ExpansionPanelSummary classes={{ root: styles.summaryRoot, content: styles.summary }} expandIcon={<ExpandMore />}>
        <Box className={styles.summaryHolder}>{label}</Box>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails className={styles.container}>
        <List className={styles.list}>
          {items?.map((item, index) => (
            <ExpandablePanelItem
              key={index}
              item={item}
              selected={selected}
              getAvatar={getAvatar}
              getHeading={getHeading}
              getRight={getRight}
              getAction={getAction}
              getText={getText}
            />
          ))}
        </List>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  );
};
