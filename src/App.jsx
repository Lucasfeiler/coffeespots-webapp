import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ShopsProvider } from './context/ShopsContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { VisitsProvider } from './context/VisitsContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import ShopDetail from './pages/ShopDetail';
import MapPage from './pages/MapPage';
import NearMe from './pages/NearMe';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import AddShop from './pages/AddShop';
import Admin from './pages/Admin';
import MyShop from './pages/MyShop';
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import { Privacy, Terms, Impressum } from './pages/StaticPages';

export default function App() {
  return (
    <AuthProvider>
      <ShopsProvider>
        <FavoritesProvider>
          <VisitsProvider>
            <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/shop/:slug" element={<ShopDetail />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/near-me" element={<NearMe />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/add-shop" element={<AddShop />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/my-shop" element={<MyShop />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/impressum" element={<Impressum />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </VisitsProvider>
        </FavoritesProvider>
      </ShopsProvider>
    </AuthProvider>
  );
}
