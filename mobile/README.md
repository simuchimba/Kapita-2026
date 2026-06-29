# Kapita Mobile App

React Native/Expo mobile app for Kapita business tracking system.

## Features

- **Authentication**: JWT-based login and registration
- **Dashboard**: Real-time business metrics and analytics
- **Products**: Manage inventory, add and delete products
- **Sales**: Record sales transactions
- **Customers**: Manage customer database
- **Profile**: View user information and logout

## Tech Stack

- React Native with Expo
- Expo Router for navigation
- TypeScript
- Axios for API calls
- AsyncStorage for token management
- Context API for state management

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
2. JWT access and refresh tokens are stored in AsyncStorage
3. Access token is included in all API requests
4. Token is automatically refreshed when expired
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

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
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
