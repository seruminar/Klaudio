import React, { ReactElement, ReactNode, useState } from 'react';

import {
    Avatar,
    Box,
    createStyles,
    ExpansionPanel,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    List,
    ListItem,
    makeStyles,
    Theme,
    Typography
} from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';

interface IExpandablePanelProps<T> {
  label: ReactNode;
  items: T[] | undefined;
  selected?: (item: T) => boolean;
  expanded?: boolean;
  getAvatar?: (item: T) => ReactNode;
  getHeading: (item: T) => ReactNode;
  getRight?: (item: T) => ReactNode;
  getAction?: (item: T) => ReactNode;
  getText?: (item: T) => ReactNode;
}

const useStyles = makeStyles((theme: Theme) =>
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
    listItem: { padding: theme.spacing(0, 1.5, 0, 1), flexDirection: "column" },
    listItemAvatar: {
      width: theme.spacing(2.5),
      height: theme.spacing(2.5),
      marginRight: theme.spacing(0.5),
      "& > svg": {
        fontSize: ".75rem",
      },
    },
    listItemHeader: {
      display: "flex",
      flexDirection: "row",
      width: "100%",
      alignItems: "center",
      justifyContent: "space-between",
    },
    listItemHeading: {
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      overflow: "hidden",
      flex: 1,
      placeSelf: "center",
      margin: theme.spacing(0.25, 0.5, 0.25, 0),
    },
    listItemContent: {
      marginBottom: theme.spacing(1),
    },
  })
);

export const ExpandablePanel: <T>(props: IExpandablePanelProps<T>) => ReactElement<IExpandablePanelProps<T>> = ({
  label,
  getAction,
  items,
  selected,
  expanded,
  getAvatar,
  getHeading,
  getRight,
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
            <ListItem key={index} dense alignItems="flex-start" className={styles.listItem} selected={selected && selected(item)}>
              <Box className={styles.listItemHeader}>
                {getAvatar && <Avatar className={styles.listItemAvatar}>{getAvatar(item)}</Avatar>}
                <Typography variant="caption" color="textSecondary" className={styles.listItemHeading}>
                  {getHeading(item)}
                </Typography>
                {getRight && getRight(item)}
                {getAction && getAction(item)}
              </Box>
              {getText && (
                <Typography className={styles.listItemContent} variant="body1">
                  {getText(item)}
                </Typography>
              )}
            </ListItem>
          ))}
        </List>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  );
};
