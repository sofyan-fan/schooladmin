import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthProvider.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <Router      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}  >
    <AuthProvider>
      <App />
    </AuthProvider>
  </Router>
);
