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
    ListItemAvatar,
    ListItemSecondaryAction,
    ListItemText,
    makeStyles,
    Theme
} from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';

interface IExpandableListProps<T> {
  label: ReactNode;
  items: T[];
  selected?: (item: T) => boolean;
  direction?: "vertical" | "horizontal";
  expanded?: boolean;
  getAvatar?: (item: T) => ReactNode;
  getLeft: (item: T) => ReactNode;
  getRight: (item: T) => ReactNode;
  getAction?: (item: T) => ReactNode;
  classes?: { avatar: string };
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    list: {
      overflowY: "scroll",
      overscrollBehavior: "contain",
      width: "100%",
      maxHeight: theme.spacing(20)
    },
    default: {
      background: "none",
      margin: `${theme.spacing(1)}px 0 !important`,
      "&:before": {
        background: "none"
      },
      "& .MuiExpansionPanelSummary-expandIcon": {
        padding: "initial"
      }
    },
    summary: { minHeight: `${theme.spacing(5)}px !important` },
    labelHolder: {
      display: "flex",
      justifyContent: "space-between",
      width: "100%",
      padding: theme.spacing(0, 1, 0, 0)
    },
    label: { margin: "0 !important" },
    container: { padding: theme.spacing(0.5) },
    item: {
      display: "flex"
    },
    vertical: {
      display: "flex",
      flexDirection: "column"
    },
    left: {
      display: "flex",
      justifyContent: "space-between"
    }
  })
);

export const ExpandableList: <T>(props: IExpandableListProps<T>) => ReactElement<IExpandableListProps<T>> = ({
  label,
  getAction,
  items,
  selected,
  direction,
  expanded,
  getAvatar,
  getLeft,
  getRight,
  classes
}) => {
  const styles = useStyles();

  const [expand, setExpand] = useState(expanded ?? false);

  const { avatar } = classes ?? { avatar: undefined };

  return (
    <ExpansionPanel className={styles.default} square expanded={expand} onChange={(_, expand) => setExpand(expand)}>
      <ExpansionPanelSummary classes={{ root: styles.summary, content: styles.label }} expandIcon={<ExpandMore />}>
        <Box className={styles.labelHolder}>{label}</Box>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails className={styles.container}>
        <List className={styles.list}>
          {items.map((item, index) => (
            <ListItem key={index} alignItems="flex-start" dense selected={selected && selected(item)}>
              {getAvatar && (
                <ListItemAvatar className={avatar}>
                  <Avatar>{getAvatar(item)}</Avatar>
                </ListItemAvatar>
              )}
              <ListItemText
                className={direction === "vertical" ? styles.vertical : styles.item}
                primary={getLeft(item)}
                secondary={getRight(item)}
                classes={{ primary: styles.left }}
              />
              {getAction && <ListItemSecondaryAction>{getAction(item)}</ListItemSecondaryAction>}
            </ListItem>
          ))}
        </List>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  );
};
