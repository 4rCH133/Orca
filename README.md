# Orca — Reddit Client for iOS & Android

A fast, sleek Reddit client built with React Native + Expo.

## Tech Stack

- **Framework**: React Native + Expo (SDK 52+)
- **Language**: TypeScript
- **Navigation**: Expo Router v4 (file-based)
- **Server State**: TanStack Query v5
- **Local State**: Zustand
- **Local DB**: Expo SQLite (liked/saved post search) + MMKV (fast key-value)
- **Reddit API**: OAuth2 via `expo-auth-session` + `snoowrap`
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Lists**: FlashList (Shopify) — high-performance feeds
- **Images**: expo-image
- **CI/CD**: EAS (Expo Application Services)

## Project Structure

```
orca/
├── app/                    # Expo Router file-based routes
│   ├── (auth)/             # Auth screens (login, oauth callback)
│   ├── (tabs)/             # Main tab navigator
│   │   ├── home/           # Home feed
│   │   ├── search/         # Search (posts, subreddits, users)
│   │   ├── likes/          # Liked/saved posts with search
│   │   ├── inbox/          # Messages & notifications
│   │   └── profile/        # User profile
│   ├── r/[subreddit]/      # Subreddit view
│   ├── post/[id]/          # Post detail + comments
│   └── _layout.tsx         # Root layout
├── src/
│   ├── api/                # Reddit API client & queries
│   │   ├── reddit.ts       # snoowrap client setup
│   │   ├── auth.ts         # OAuth2 flow
│   │   └── queries/        # TanStack Query hooks
│   ├── components/         # Reusable UI components
│   │   ├── feed/           # PostCard, PostList, etc.
│   │   ├── comments/       # CommentThread, CommentCard
│   │   ├── ui/             # Buttons, inputs, sheets, etc.
│   │   └── layout/         # Headers, tabs, etc.
│   ├── store/              # Zustand stores
│   │   ├── authStore.ts
│   │   ├── settingsStore.ts
│   │   └── feedStore.ts
│   ├── db/                 # SQLite schema & queries
│   │   ├── schema.ts
│   │   └── likes.ts        # Local liked post search
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Helpers, formatters
│   └── types/              # TypeScript types & interfaces
├── assets/                 # Icons, splash, fonts
├── eas.json                # EAS Build config
├── app.config.ts           # Expo app config
└── tailwind.config.js      # NativeWind config
```

## Getting Started

### Prerequisites
- Node.js 20+
- Bun or npm
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- iOS: Xcode 15+ (Mac only)
- Android: Android Studio + JDK 17

### Setup

```bash
# Install dependencies
bun install

# Start dev server
bunx expo start

# Run on iOS simulator
bunx expo run:ios

# Run on Android emulator
bunx expo run:android
```

### Reddit API Setup

1. Go to https://www.reddit.com/prefs/apps
2. Create a new app (type: **installed app**)
3. Set redirect URI to your app's deep link scheme (e.g. `orca://auth/callback`)
4. Copy your `client_id` to `.env`:

```env
EXPO_PUBLIC_REDDIT_CLIENT_ID=your_client_id_here
EXPO_PUBLIC_REDDIT_REDIRECT_URI=orca://auth/callback
```

### EAS Build & Submit

```bash
# Configure EAS
eas build:configure

# Build for both platforms
eas build --platform all

# Submit to App Store + Play Store
eas submit --platform all
```

## Key Features

- [x] Reddit OAuth2 login
- [ ] Home feed (best/hot/new/top/rising)
- [ ] Subreddit browsing
- [ ] Post detail + comments (with threading)
- [ ] Vote, save, hide posts
- [ ] Search posts, subreddits, and users
- [ ] **Search your liked/saved posts** (local SQLite index)
- [ ] Multireddit support
- [ ] Dark/light/OLED themes
- [ ] Media viewer (images, GIFs, videos)
- [ ] Push notifications (via Expo Notifications)
- [ ] Offline reading (cached posts)
- [ ] Custom app icons & themes

## Reddit API Rate Limits

Reddit allows **60 requests/minute** for OAuth clients. TanStack Query is configured with smart caching to minimize API calls. Heavy operations use a local SQLite cache with background sync.
