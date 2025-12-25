# Bezoar - Android Design Guidelines

## Platform & Language
- **Platform**: Android only
- **Primary Language**: Persian (FA) - RTL layout
- **Secondary Language**: English (EN) - LTR layout
- **Language Switch**: Available in Settings
- **Font**: Vazirmatn or similar professional Persian font

## Visual Design System

### Theme
- **Default Mode**: Dark Mode
- **Style**: Dark glassmorphism (luxury, minimal, premium dashboard aesthetic)
- **Accent Color**: Neon purple
- **Design Language**: Modern, minimal, professional
- **Corners**: Rounded corners throughout
- **Shadows**: Soft shadows
- **Icons**: Minimal, line-based style

### Color Palette
- **Primary**: Neon purple (accent color)
- **Background**: Dark with glassmorphism effects
- **Surface**: Semi-transparent dark cards with glass effect
- **Text**: High contrast for dark mode readability

### Typography
- **Primary Font**: Vazirmatn (or equivalent professional Persian font)
- **Hierarchy**: Clear distinction between headings, body, and labels
- **RTL Support**: Full bidirectional text support (Persian RTL, English LTR)

## Navigation Architecture

### Root Navigation: Vertical Sidebar
**Main Sections** (in order):
1. Dashboard
2. Patients
3. Drugs
4. Sales & Payments
5. Reports & Analytics
6. Backup & Restore
7. Settings

**Sidebar Specifications**:
- Fixed vertical position (reference image style)
- Icons for each section (minimal, line-based)
- Active state highlighting with neon purple
- Smooth transitions between sections

## Screen Specifications

### 1. Dashboard Screen
- **Purpose**: Overview of key metrics and quick actions
- **Layout**: Cards with glassmorphism showing:
  - Total patients count
  - Total sales summary
  - Outstanding debts
  - Recent activity
- **Components**: Stat cards, quick action buttons

### 2. Patients Screen
- **Purpose**: Manage patient records
- **Layout**: 
  - Header with search bar and "Add Patient" button
  - List/grid of patient cards with key info (Name, National ID, Phone)
  - Tap to view full patient details
- **Detail View**: Two sections
  - Identity Information (Name, National ID, Phone, Address, DOB, Gender)
  - Medical Information (Disease, background, description, treatment plan, duration, notes)

### 3. Drugs Screen
- **Purpose**: Manage drug inventory
- **Default Entry**: Bezoar (pre-populated)
- **Layout**: List of drugs with key info (Name, Code, Type, Prices)
- **Form Fields**: Drug Name, Code, Type, Purchase Price, Sale Price, Unit (Bottle), Description

### 4. Sales & Payments Screen
- **Purpose**: Record and track purchases/sales
- **Layout**: 
  - Purchase history list
  - Filter by payment status (Paid, Installment, Unpaid)
  - Color coding for payment status
- **Purchase Form**: Patient selection, Drug selection, Bottle count, Pricing (auto-calculated total), Payment status, Dates

### 5. Reports & Analytics Screen
- **Purpose**: Data visualization and insights
- **Layout**: 
  - Charts/graphs for sales trends
  - Summary cards showing:
    - Total sales
    - Total debt
    - Monthly/yearly breakdowns
    - Bottles sold count
    - Patients with unpaid balance
- **Export Options**: Excel and PDF export buttons prominently displayed

### 6. Backup & Restore Screen
- **Purpose**: Data management
- **Layout**:
  - Create Backup button (primary action)
  - List of existing backups with date/time
  - Restore button for each backup
  - Clear restore logs section
- **Confirmations**: Alert dialogs for critical actions

### 7. Settings Screen
- **Purpose**: App configuration
- **Layout**: Grouped list items
  - Language (FA/EN toggle)
  - Theme control
  - Backup management
  - Database reset (nested, double confirmation)
  - App lock (PIN setup)
  - Biometric authentication toggle
  - About section

## Component Specifications

### Cards
- Glassmorphism effect with dark background
- Soft shadows
- Rounded corners (16dp recommended)
- Semi-transparent borders

### Buttons
- Primary: Neon purple fill with white text
- Secondary: Outlined with purple border
- Touchable feedback: Ripple effect (Material)

### Forms
- Labeled input fields with Persian/English support
- Clear validation states
- Submit buttons at bottom of form
- Cancel option in header or as secondary button

### Lists
- Card-based list items
- Swipe actions where appropriate
- Empty states with helpful messaging

### Dialogs & Alerts
- Glassmorphism styling consistent with app
- Clear action buttons
- Double confirmation for destructive actions (Delete, Reset)

## Interaction Design

### Animations
- Smooth Material transitions between screens
- Subtle micro-interactions on button presses
- Page transitions respect RTL/LTR direction
- Loading states with elegant spinners

### Notifications
- Local notifications for installment reminders
- Non-intrusive notification styling

## Special Features

### Installment UI
- When payment type = "Installment":
  - Show installment schedule
  - Visual progress indicator
  - Status badges (Paid/Unpaid)
  - Remaining debt highlighted

### Export Functionality
- **Excel Export**: Simple icon button with clear labeling
- **PDF Export**: Adjacent to Excel export
- **Export Confirmation**: Toast message on success

### Security Features
- **PIN Lock**: Numeric keypad overlay on app launch
- **Biometric**: Fingerprint icon when enabled
- **Lock Screen**: Minimal, secure aesthetic

## Accessibility
- High contrast ratios for dark mode
- Touch targets minimum 48dp
- Clear focus indicators for keyboard navigation
- Persian screen reader support (TalkBack)

## Responsive Design
- Optimized for tablets and phones
- Sidebar adapts to screen size (collapsible on small screens)
- Landscape mode support with adjusted layouts