import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AppProvider, useApp } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Lazy load pages for better performance
const UploadPage = lazy(() => import('./pages/UploadPage').then(module => ({ default: module.UploadPage })));
const SupplierValidationPage = lazy(() => import('./pages/SupplierValidationPage').then(module => ({ default: module.SupplierValidationPage })));
const ProcessingPage = lazy(() => import('./pages/ProcessingPage').then(module => ({ default: module.ProcessingPage })));
const ResultsPage = lazy(() => import('./pages/ResultsPage').then(module => ({ default: module.ResultsPage })));

function AppContent() {
  const { state } = useApp();

  const renderCurrentStep = () => {
    switch (state.step) {
      case 'upload':
        return <UploadPage />;
      case 'supplier-validation':
        return <SupplierValidationPage />;
      case 'processing':
        return <ProcessingPage />;
      case 'results':
        return <ResultsPage />;
      default:
        return <UploadPage />;
    }
  };

  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      }>
        {renderCurrentStep()}
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AppContent />} />
          </Routes>
        </Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
              border: '1px solid var(--toast-border)',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;