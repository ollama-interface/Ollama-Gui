import ReactDOM from 'react-dom/client';
import './index.css';
import { Toaster } from './components/ui/toaster.tsx';
import { TooltipProvider } from './components/ui/tooltip.tsx';
import { ThemeProvider } from './components/theme-provider.tsx';
import App from './app/index.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
	// <React.StrictMode>
	<>
		<TooltipProvider>
			<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
				<App />
			</ThemeProvider>
			<Toaster />
		</TooltipProvider>
	</>
	// </React.StrictMode>
);
