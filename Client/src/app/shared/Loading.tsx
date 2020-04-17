import React, { FC } from 'react';

import { CircularProgress, createStyles, makeStyles, Theme } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    space: {
      display: "flex",
      justifyContent: "center",
      height: "100%",
      width: "100%"
    },
    column: {
      flexDirection: "column",
      margin: theme.spacing(2),
      display: "flex",
      justifyContent: "center"
    },
    smallColumn: {
      flexDirection: "column",
      margin: theme.spacing(1),
      display: "flex",
      justifyContent: "center"
    },
    overlay: {
      display: "flex",
      justifyContent: "center",
      height: "100%",
      position: "absolute",
      width: "100%",
      "&+ *": {
        opacity: 0.5
      }
    }
  })
);

interface ILoadingProps {
  overlay?: boolean;
  small?: boolean;
}

export const Loading: FC<ILoadingProps> = ({ overlay, small }) => {
  const styles = useStyles();

  return (
    <div className={overlay ? styles.overlay : styles.space}>
      <div className={small ? styles.smallColumn : styles.column}>
        <CircularProgress size={small ? "1rem" : undefined} />
      </div>
    </div>
  );
};
