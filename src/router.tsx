import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const HomePage = lazy(() => import('./pages/index/index'));

const routesList = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/*',
    element: <HomePage />,
  },
];

export const MainRouter = () => {
  return (
    <Routes>
      <Helmet>
        <meta
          http-equiv="Content-Security-Policy"
          content="script-src 'self' https://ollama-web-ui.vercel.app;"
        ></meta>
      </Helmet>
      {routesList.map((item, index) => (
        <Route
          path={item.path}
          element={<Suspense>{item.element}</Suspense>}
          key={index}
        />
      ))}
    </Routes>
  );
};
