import ReactDOM from 'react-dom/client';
import './index.css';
import { Toaster } from './components/ui/toaster.tsx';
import { MainRouter } from './router.tsx';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from './components/ui/tooltip.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  <>
    <TooltipProvider>
      <BrowserRouter>
        <MainRouter />
      </BrowserRouter>
      <Toaster />
    </TooltipProvider>
  </>
  // </React.StrictMode>
);
