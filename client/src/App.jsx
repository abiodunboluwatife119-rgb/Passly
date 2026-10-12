import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HowItWorks from './pages/HowItWorks';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Cars from './pages/Cars';
import CarDetail from './pages/CarDetail';
import Restaurants from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyBookings from './pages/MyBookings';
import TicketView from './pages/TicketView';
import Verify from './pages/Verify';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import MyEvents from './pages/MyEvents';
import MyCars from './pages/MyCars';
import MyRestaurants from './pages/MyRestaurants';
import BecomeVendor from './pages/BecomeVendor';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/cars" element={<Cars />} />
            <Route path="/cars/:id" element={<CarDetail />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/restaurants/:id" element={<RestaurantDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/tickets/:code" element={<TicketView />} />
            <Route
              path="/verify"
              element={
                <ProtectedRoute allowedRoles={['vendor', 'admin']}>
                  <Verify />
                </ProtectedRoute>
              }
            />
            <Route
              path="/become-vendor"
              element={
                <ProtectedRoute>
                  <BecomeVendor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['vendor', 'admin']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/events"
              element={
                <ProtectedRoute allowedRoles={['vendor', 'admin']}>
                  <MyEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/cars"
              element={
                <ProtectedRoute allowedRoles={['vendor', 'admin']}>
                  <MyCars />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/restaurants"
              element={
                <ProtectedRoute allowedRoles={['vendor', 'admin']}>
                  <MyRestaurants />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;