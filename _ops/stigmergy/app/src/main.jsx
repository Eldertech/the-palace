import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import PublicApp from './PublicApp.jsx';
import './styles/tokens.css';

// The read view build (VITE_PUBLIC=1, scripts/build-public.mjs) mounts only the
// STATE deck. The check reads import.meta.env directly so it folds to a
// constant at build time and the full app never ships in the read view.
const Root = import.meta.env.VITE_PUBLIC === '1' ? PublicApp : App;

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
