import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

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
