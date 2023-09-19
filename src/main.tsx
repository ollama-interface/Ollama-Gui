import ReactDOM from 'react-dom/client';
import './index.css';
import { Toaster } from './components/ui/toaster.tsx';
import { MainRouter } from './router.tsx';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  <>
    <BrowserRouter>
      <MainRouter />
    </BrowserRouter>
    <Toaster />
  </>
  // </React.StrictMode>
);
