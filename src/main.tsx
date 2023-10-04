import ReactDOM from 'react-dom/client';
import './index.css';
import { Toaster } from './components/ui/toaster.tsx';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from './components/ui/tooltip.tsx';
import { ThemeProvider } from './components/theme-provider.tsx';
import App from './app/index.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
	// <React.StrictMode>
	<>
		<TooltipProvider>
			<BrowserRouter>
				<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
					<App />
				</ThemeProvider>
			</BrowserRouter>
			<Toaster />
		</TooltipProvider>
	</>
	// </React.StrictMode>
);
