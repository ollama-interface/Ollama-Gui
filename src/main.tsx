import ReactDOM from 'react-dom/client';
import './index.css';
import { Toaster } from './components/ui/toaster.tsx';
import { MainRouter } from './router.tsx';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from './components/ui/tooltip.tsx';
import { ThemeProvider } from './components/theme-provider.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  <>
    <TooltipProvider>
      <BrowserRouter>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <MainRouter />
        </ThemeProvider>
      </BrowserRouter>
      <Toaster />
    </TooltipProvider>
  </>
  // </React.StrictMode>
);
