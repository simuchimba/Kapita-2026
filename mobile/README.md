# Kapita Mobile App

React Native/Expo mobile app for Kapita business tracking system.

## Features

- **Authentication**: JWT-based login/register, with automatic refresh-token rotation
- **Dashboard, Sales, Products, Customers, Credits, Expenses, Reinvestments,
  Suppliers, Purchase Orders, Quotations, Promotions, Analytics, Reports,
  Billing, Settings, Profile**: business-domain CRUD screens
- **Admin panel** (drawer navigation, staff-only): Overview, Users, Payments
  (approve/reject with proof-image preview), Subscriptions (extend/revoke/
  history), cross-tenant Purchase Orders/Suppliers, Feedback review, Activity log
- **Feedback bar**: an expandable widget on the main tab screens for test
  users to submit bug reports/feature requests, reviewed in the admin panel

## Tech Stack

- React Native with Expo (SDK 52)
- Expo Router for navigation, `@react-navigation/drawer` for the admin panel
- TypeScript
- Axios for API calls
- `expo-secure-store` for token storage (not AsyncStorage)
- Context API for state management
- `src/constants/theme.ts` — brand colors/spacing ported directly from the
  web app's `tailwind.config.js`, plus shared UI primitives in `src/components/ui/`

## Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI (installed via npx)
- Backend server running (see main README)

## Installation

1. Navigate to mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your backend API URL:
```
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

For production, use your deployed backend URL:
```
EXPO_PUBLIC_API_URL=https://your-backend-url.com/api
```

## Running the App

### Development

Start the Expo development server:
```bash
npm start
```

Then:
- Press `i` to run on iOS simulator
- Press `a` to run on Android emulator
- Scan the QR code with Expo Go app on your physical device

### Web

Run in browser:
```bash
npm run web
```

## Project Structure

```
mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/            # Main app tabs
│   │   ├── index.tsx      # Dashboard
│   │   ├── products.tsx
│   │   ├── sales.tsx
│   │   ├── customers.tsx
│   │   ├── profile.tsx
│   │   └── _layout.tsx
│   └── _layout.tsx        # Root layout
├── src/
│   ├── context/           # React Context
│   │   └── AuthContext.tsx
│   ├── services/          # API services
│   │   └── api.ts
│   ├── components/        # Reusable components
│   └── screens/           # Additional screens
├── assets/                # Images, icons, etc.
├── package.json
├── app.json
├── tsconfig.json
└── babel.config.js
```

## API Integration

The mobile app connects to the existing Django backend using the same API endpoints:

- Authentication: `/api/auth/login/`, `/api/auth/register/`
- Products: `/api/products/`
- Sales: `/api/sales/`
- Customers: `/api/customers/`
- Analytics: `/api/analytics/dashboard/`

## Authentication Flow

1. User logs in via `/api/auth/login/`
2. JWT access and refresh tokens are stored securely via `expo-secure-store`
3. Access token is included in all API requests
4. On a 401, the refresh token is exchanged for a new access token — **and**
   a new refresh token, since the backend rotates and blacklists refresh
   tokens on every use (`ROTATE_REFRESH_TOKENS` + `BLACKLIST_AFTER_ROTATION`
   in Django settings). Discarding the new refresh token here would cause
   every session to fail on its *second* token refresh.
5. User is logged out if refresh fails

## Development Notes

- The app uses Expo Router for file-based routing
- All API calls are handled through the centralized `api.ts` service
- Authentication state is managed via React Context
- The app automatically redirects to login if not authenticated

## Testing

To test the mobile app:

1. Ensure the backend is running on `http://localhost:8000`
2. Start the mobile app with `npm start`
3. Use Expo Go app on your phone or simulator
4. Test login with existing backend credentials
5. Try creating products, sales, and customers

## Building for Production

Build profiles are defined in `eas.json` (`development`, `preview`, `production`).
`preview` and `production` both point `EXPO_PUBLIC_API_URL` at the deployed
backend (`https://kapita-api-fbpp.onrender.com/api`) — no `.env` needed for
EAS builds.

Requires an Expo account logged in locally (`eas login`) and an EAS project
linked (`eas init`) before the first build.

### Android APK (for internal testing / sideloading)

```bash
eas build --platform android --profile preview
```

### Android App Bundle (for Play Store)

```bash
eas build --platform android --profile production
```

### iOS

```bash
eas build --platform ios --profile production
```

## Troubleshooting

**Backend connection issues:**
- Ensure backend is running
- Check `EXPO_PUBLIC_API_URL` in `.env`
- For physical devices, use your computer's IP address instead of localhost

**Metro bundler issues:**
- Clear cache: `npm start -- --clear`
- Reset cache: `expo start -c`

**Build errors:**
- Ensure all dependencies are installed
- Check Node.js version compatibility
- Clear node_modules and reinstall

## License

MIT
