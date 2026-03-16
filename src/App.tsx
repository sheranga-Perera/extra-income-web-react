import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Jobs from './pages/Jobs';
import Hire from './pages/Hire';
import Advertise from './pages/Advertise';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: (
        <div className="app-shell">
          <NavBar />
          <Home />
          <footer className="footer">Extra Income V1 • Sri Lanka</footer>
        </div>
      )
    },
    {
      path: '/login',
      element: (
        <div className="app-shell">
          <NavBar />
          <Login />
          <footer className="footer">Extra Income V1 • Sri Lanka</footer>
        </div>
      )
    },
    {
      path: '/register',
      element: (
        <div className="app-shell">
          <NavBar />
          <Register />
          <footer className="footer">Extra Income V1 • Sri Lanka</footer>
        </div>
      )
    },
    {
      path: '/profile',
      element: (
        <div className="app-shell">
          <NavBar />
          <Profile />
          <footer className="footer">Extra Income V1 • Sri Lanka</footer>
        </div>
      )
    },
    {
      path: '/jobs',
      element: (
        <div className="app-shell">
          <NavBar />
          <Jobs />
          <footer className="footer">Extra Income V1 • Sri Lanka</footer>
        </div>
      )
    },
    {
      path: '/hire',
      element: (
        <div className="app-shell">
          <NavBar />
          <Hire />
          <footer className="footer">Extra Income V1 • Sri Lanka</footer>
        </div>
      )
    },
    {
      path: '/advertise',
      element: (
        <div className="app-shell">
          <NavBar />
          <Advertise />
          <footer className="footer">Extra Income V1 • Sri Lanka</footer>
        </div>
      )
    }
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

export default function App() {
  return <RouterProvider router={router} />;
}
