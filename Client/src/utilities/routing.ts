import { RouteComponentProps } from '@reach/router';
import { FC } from 'react';

export type RoutedFC<P = {}> = FC<RouteComponentProps<P>>;
