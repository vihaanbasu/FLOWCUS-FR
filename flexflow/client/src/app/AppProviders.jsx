import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext.jsx';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary.jsx';

export function AppProviders({ children }) {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>{children}</AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
