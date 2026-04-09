import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app.jsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

const CLIENT_ID = '962611864630-9hcuufkg88n5qps0f9pcc8v933ag9s0n.apps.googleusercontent.com';

const root = createRoot(document.getElementById('root'));
root.render(
    <StrictMode>
        <GoogleOAuthProvider clientId={CLIENT_ID}>
            <App />
        </GoogleOAuthProvider>
    </StrictMode>
)

