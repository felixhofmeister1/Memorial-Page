import { render } from 'preact';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource-variable/source-sans-3/index.css';
import './styles/site.css';
import { App } from './app';

render(<App />, document.getElementById('app')!);
