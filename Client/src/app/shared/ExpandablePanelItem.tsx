import React, { Dispatch, ReactElement, ReactNode, SetStateAction, useState } from 'react';

import {
    Avatar,
    Box,
    createStyles,
    ListItem,
    makeStyles,
    Theme,
    Typography
} from '@material-ui/core';

export type ExpandablePanelItemMode = "view" | "edit";

interface IExpandablePanelItemProps<T> {
  item: T;
  selected?: (item: T) => boolean;
  getAvatar?: (item: T) => ReactNode;
  getHeading: (item: T) => ReactNode;
  getRight?: (item: T) => ReactNode;
  getAction?: (item: T, mode: ExpandablePanelItemMode, setMode: Dispatch<SetStateAction<ExpandablePanelItemMode>>) => ReactNode;
  getText?: (item: T, mode: ExpandablePanelItemMode, setMode: Dispatch<SetStateAction<ExpandablePanelItemMode>>) => ReactNode;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: { padding: theme.spacing(0.5, 0.5, 0.5, 1), flexDirection: "column", wordBreak: "break-word" },
    avatar: {
      width: theme.spacing(2.5),
      height: theme.spacing(2.5),
      marginRight: theme.spacing(0.5),
      "& > svg": {
        fontSize: ".75rem",
      },
    },
    header: {
      display: "flex",
      flexDirection: "row",
      width: "100%",
      alignItems: "center",
      justifyContent: "space-between",
    },
    heading: {
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      overflow: "hidden",
      flex: 1,
      placeSelf: "center",
      margin: theme.spacing(0.25, 0.5, 0.25, 0),
    },
  })
);

export const ExpandablePanelItem: <T>(props: IExpandablePanelItemProps<T>) => ReactElement<IExpandablePanelItemProps<T>> = ({
  getAction,
  item,
  selected,
  getAvatar,
  getHeading,
  getRight,
  getText,
}) => {
  const styles = useStyles();

  const [mode, setMode] = useState<ExpandablePanelItemMode>("view");

  return (
    <ListItem dense alignItems="flex-start" className={styles.root} selected={selected && selected(item)}>
      <Box className={styles.header}>
        {getAvatar && <Avatar className={styles.avatar}>{getAvatar(item)}</Avatar>}
        <Typography variant="caption" color="textSecondary" className={styles.heading}>
          {getHeading(item)}
        </Typography>
        {getRight && getRight(item)}
        {getAction && getAction(item, mode, setMode)}
      </Box>
      {getText && getText(item, mode, setMode)}
    </ListItem>
  );
};
