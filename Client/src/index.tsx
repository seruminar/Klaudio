import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import React from 'react';
import { render } from 'react-dom';

import { App } from './app/App';

const root = document.createElement('div');
root.id = 'root';
document.body.textContent = '';
document.body.append(root);

render(<App />, document.getElementById('root'));
