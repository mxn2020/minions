
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import Playground from './pages/Playground';
import NotFound from './pages/NotFound';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: 'playground',
                element: <Playground />,
            },
            {
                path: '*',
                element: <NotFound />,
            },
        ],
    },
]);
