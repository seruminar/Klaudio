import React from 'react';

import { Container, createStyles, makeStyles, Typography } from '@material-ui/core';

import { errors } from '../../terms.en-us.json';
import { RoutedFC } from '../../utilities/routing';

export interface IErrorProps {
  message?: string;
  stack?: string;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      flex: 1,
      margin: theme.spacing(2),
    },
  })
);

export const Error: RoutedFC<IErrorProps> = ({ location, message, stack }) => {
  const styles = useStyles();

  let errorMessage: IErrorProps = { message: errors.genericError, stack: errors.genericStack };

  message && (errorMessage.message = message);
  stack && (errorMessage.stack = stack);

  location && location.state && (errorMessage = { ...errorMessage, ...location.state });

  return (
    <Container className={styles.root}>
      <Typography variant="h4" gutterBottom>
        {errorMessage.message}
      </Typography>
      <Typography variant="body1" gutterBottom>
        {errorMessage.stack}
      </Typography>
    </Container>
  );
};
