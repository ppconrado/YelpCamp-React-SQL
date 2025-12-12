import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import { logoutUser } from '../api/auth';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const { showFlash } = useFlash();

  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      showFlash('Até a próxima aventura!', 'success');
    } catch {
      showFlash('Erro ao fazer logout.', 'error');
    }
  };

  return (
    <nav className="navbar sticky-top navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          JosePauloCamp
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <div className="navbar-nav">
            <Link className="nav-link" to="/">
              Home
            </Link>
            <Link className="nav-link" to="/campgrounds">
              Campgrounds
            </Link>
            <Link className="nav-link" to="/campgrounds/new">
              New Campground
            </Link>
          </div>
          <div className="navbar-nav ms-auto">
            {currentUser ? (
              <>
                <span className="nav-link">
                  Welcome, {currentUser.username}
                </span>
                <button
                  className="nav-link btn btn-link"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="nav-link" to="/login">
                  Login
                </Link>
                <Link className="nav-link" to="/register">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const FlashMessage = () => {
  // Flash is now handled by react-hot-toast in main.jsx
  return null;
};

const Footer = () => (
  <footer className="footer bg-dark py-3 mt-auto">
    <div className="container">
      <span className="text-muted">&copy; 2025 JosePauloCamp</span>
    </div>
  </footer>
);

const Layout = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="container mt-5" style={{ flexGrow: 1 }}>
        <FlashMessage />
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
