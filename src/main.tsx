import ReactDOM from 'react-dom/client';
import './index.css';
import { Toaster } from './components/ui/toaster.tsx';
import { TooltipProvider } from './components/ui/tooltip.tsx';
import { ThemeProvider } from './components/theme-provider.tsx';
import App from './app/index.tsx';
import { Provider as JotaiProvider } from 'jotai';
import { store } from './app/state/store.ts';

ReactDOM.createRoot(document.getElementById('root')!).render(
	// <React.StrictMode>
	<TooltipProvider>
		<JotaiProvider store={store}>
			<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
				<App />
			</ThemeProvider>
			<Toaster />
		</JotaiProvider>
	</TooltipProvider>,
	// </React.StrictMode>
);
