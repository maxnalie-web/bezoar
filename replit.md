# Bezoar - Patient & Drug Management App

## Overview
Bezoar is a mobile-first patient and drug management application built with React Native (Expo) and Express.js. The app features a dark glassmorphism design with neon purple accents, designed for managing patients, drugs, sales, and payment tracking.

## Key Features
- **Dashboard**: Overview of key metrics (patients, sales, debts, bottles sold)
- **Patient Management**: CRUD operations for patient records with medical information
- **Drug Management**: Drug inventory with pricing (purchase/sale prices)
- **Sales Tracking**: Record purchases with payment status (paid/unpaid/installment)
- **Reports**: Visual analytics with monthly sales trends
- **Backup/Restore**: Export and import data as JSON

## Architecture

### Frontend (Expo/React Native)
- **Location**: `/client/`
- **Navigation**: Drawer-based navigation with 7 main sections
- **State**: React Query for server state, local state for forms
- **Storage**: AsyncStorage for local persistence
- **Styling**: Dark glassmorphism theme with neon purple accent (#A855F7)

### Backend (Express.js)
- **Location**: `/server/`
- **Purpose**: Serves landing page and can be extended for API endpoints

### Key Directories
```
client/
├── components/       # Reusable UI components
│   ├── Button.tsx       # Primary/secondary/ghost buttons
│   ├── Card.tsx         # Basic card component
│   ├── GlassCard.tsx    # Glassmorphism card
│   ├── FormInput.tsx    # Form input with label
│   ├── StatCard.tsx     # Dashboard stat cards
│   ├── ListItem.tsx     # List item component
│   └── EmptyState.tsx   # Empty state placeholder
├── screens/          # App screens
│   ├── DashboardScreen.tsx
│   ├── PatientsScreen.tsx
│   ├── DrugsScreen.tsx
│   ├── SalesScreen.tsx
│   ├── ReportsScreen.tsx
│   ├── BackupScreen.tsx
│   ├── SettingsScreen.tsx
│   └── *DetailScreen.tsx  # Modal detail screens
├── navigation/       # Navigation configuration
│   ├── DrawerNavigator.tsx
│   └── RootStackNavigator.tsx
├── lib/
│   ├── storage.ts    # AsyncStorage utilities
│   └── query-client.ts
├── types/
│   └── models.ts     # TypeScript interfaces
└── constants/
    └── theme.ts      # Colors, spacing, typography
```

## Data Models
- **Patient**: Identity info (name, national ID, phone) + medical info (diseases, treatment)
- **Drug**: Name, code, type, purchase/sale prices, unit
- **Sale**: Links patient to drug purchase with payment status
- **Installment**: Payment schedule for installment purchases

## Theme Colors
- **Accent**: #A855F7 (Neon Purple)
- **Background Root**: #0D0D12
- **Background Default**: #16161D
- **Glass Border**: rgba(168, 85, 247, 0.2)
- **Success**: #22C55E
- **Warning**: #F59E0B
- **Error**: #EF4444

## Development

### Running the App
The app runs on port 8081 (Expo) with Express backend on port 5000.

### Asset Imports
Use ES module import syntax for assets to leverage the `@assets` alias:
```typescript
import AppIcon from "@assets/images/icon.png";

// Usage with expo-image
<Image source={AppIcon} style={styles.logo} contentFit="contain" />
```

The `@assets` alias is configured in both:
- `babel.config.js` (for Metro bundler)
- `tsconfig.json` (for TypeScript)

### Adding New Features
1. Create screen in `/client/screens/`
2. Add to navigation in `/client/navigation/DrawerNavigator.tsx`
3. Add storage functions in `/client/lib/storage.ts`
4. Follow existing component patterns for consistency

### Design Guidelines
- Follow dark glassmorphism aesthetic
- Use GlassCard for elevated content
- Maintain neon purple accent for interactive elements
- All text wrapped in ThemedText component
- Icons from @expo/vector-icons Feather set

## User Preferences
- Dark mode default
- Minimal, premium aesthetic
- No emojis in UI
- Mobile-first responsive design
