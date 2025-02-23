import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import posthog from 'posthog-js'

posthog.init('phc_PsGQf2yEDp6dUbqGcLbCMiBWpLfY2JAtlTCsLWGXxkK',
    {
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'identified_only' // or 'always' to create profiles for anonymous users as well
    }
)

createRoot(document.getElementById("root")!).render(<App />);
