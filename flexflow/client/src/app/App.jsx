import { AppProviders } from './AppProviders.jsx';
import { AppRoutes } from './AppRoutes.jsx';

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
