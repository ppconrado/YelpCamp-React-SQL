import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import CampgroundIndex from './pages/campgrounds/CampgroundIndex';
import CampgroundShow from './pages/campgrounds/CampgroundShow';
import CampgroundNew from './pages/campgrounds/CampgroundNew';
import CampgroundEdit from './pages/campgrounds/CampgroundEdit';
import Register from './pages/users/Register';
import Login from './pages/users/Login';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="campgrounds" element={<CampgroundIndex />} />
        <Route
          path="campgrounds/new"
          element={
            <ProtectedRoute>
              <CampgroundNew />
            </ProtectedRoute>
          }
        />
        <Route path="campgrounds/:id" element={<CampgroundShow />} />
        <Route
          path="campgrounds/:id/edit"
          element={
            <ProtectedRoute>
              <CampgroundEdit />
            </ProtectedRoute>
          }
        />
        <Route path="register" element={<Register />} />
        <Route path="login" element={<Login />} />
        <Route path="*" element={<h1>404 - Not Found</h1>} />
      </Route>
    </Routes>
  );
}

export default App;
