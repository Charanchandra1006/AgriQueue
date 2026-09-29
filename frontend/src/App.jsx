import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';

// Page imports
import { Dashboard } from './pages/Dashboard';
import { MandiMap } from './pages/MandiMap';
import { MandiCenters } from './pages/MandiCenters';
import { MandiDetails } from './pages/MandiDetails';
import { BookSlot } from './pages/BookSlot';
import { MarketPrices } from './pages/MarketPrices';
import { Schemes } from './pages/Schemes';
import { BuySeeds } from './pages/BuySeeds';
import { AICropDoctor } from './pages/AICropDoctor';
import { WeatherAlerts } from './pages/WeatherAlerts';
import { BookTransport } from './pages/BookTransport';
import { AgriReels } from './pages/AgriReels';
import { Help } from './pages/Help';

import { Onboarding } from './pages/Onboarding';
import { useApp } from './context/AppContext';

function AppContent() {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <Onboarding />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Main App Shell Layout */}
        <Route path="/" element={<AppLayout />}>
          {/* Nested pages */}
          <Route index element={<Dashboard />} />
          <Route path="mandi-map" element={<MandiMap />} />
          <Route path="mandi-centers" element={<MandiCenters />} />
          <Route path="mandi-centers/:id" element={<MandiDetails />} />
          <Route path="book-slot" element={<BookSlot />} />
          <Route path="book-slot/:id" element={<BookSlot />} />
          <Route path="market-prices" element={<MarketPrices />} />
          <Route path="schemes" element={<Schemes />} />
          <Route path="buy-seeds" element={<BuySeeds />} />
          <Route path="crop-doctor" element={<AICropDoctor />} />
          <Route path="weather-alerts" element={<WeatherAlerts />} />
          <Route path="book-transport" element={<BookTransport />} />
          <Route path="reels" element={<AgriReels />} />
          <Route path="help" element={<Help />} />
          {/* Catch all route - fallback to Dashboard */}
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
