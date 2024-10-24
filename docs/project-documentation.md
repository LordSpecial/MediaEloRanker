# Media Elo Ranker - Project Structure Documentation

## Overview
A React-based application for ranking and organizing media content (movies, TV shows, anime, music) using an ELO rating system. The application integrates with TMDB API for media data and Firebase for authentication and data storage.

## Project Structure

### Root Directory
```
MediaEloRanker/
├── src/                  # Source code
├── public/              # Static assets
├── .env                 # Environment variables
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── package.json         # Project dependencies
```

### Source Code Organization

#### Components (`src/components/`)
Organized by feature and responsibility:

```
components/
├── auth/                # Authentication components
│   ├── Login.tsx       # Login form
│   ├── Register.tsx    # Registration form
│   └── AuthStyles.css  # Auth-specific styles
│
├── media/              # Media-related components
│   ├── MediaComponents.tsx    # Shared media components
│   ├── MediaExplorePage.tsx  # Generic media explorer
│   └── MovieExplorePage.tsx  # Movie-specific explorer
│
├── pages/              # Main page components
│   └── Pages.tsx       # Core pages (Home, Discover, etc.)
│
└── ui/                 # Reusable UI components
    ├── Navbar.tsx      # Navigation bar
    ├── alert.tsx       # Alert component
    ├── button.tsx      # Button component
    ├── card.tsx        # Card component
    ├── input.tsx       # Input component
    ├── skeleton.tsx    # Loading skeleton
    ├── toast.tsx       # Toast notifications
    └── use-toast.ts    # Toast hook
```

#### Hooks (`src/hooks/`)
Custom React hooks:

```
hooks/
├── useAuth.ts          # Authentication hook
├── useLibrary.ts       # Library management hook
└── tmdb/              # TMDB API hooks
    ├── useDetails.ts   # Media details hook
    ├── useMovies.ts    # Movies data hook
    ├── useSearch.ts    # Search functionality
    └── useTV.ts        # TV shows data hook
```

#### Services (`src/services/`)
API and service integrations:

```
services/
├── api/
│   └── tmdb/          # TMDB API integration
│       ├── endpoints.ts   # API endpoints
│       ├── tmdbApi.ts    # API client
│       └── types.ts      # TypeScript types
│
├── config/
│   └── tmdb.config.ts # TMDB configuration
│
├── firebase/
│   └── libraryService.ts # Firebase operations
│
└── utils/
    └── mediaUtils.ts  # Media-related utilities
```

### Core Files

#### Configuration Files
- `.env`: Environment variables
  ```
  VITE_TMDB_API_KEY=your_api_key
  VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
  VITE_FIREBASE_CONFIG=your_firebase_config
  ```

- `vite.config.ts`: Vite configuration
  ```typescript
  export default defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  })
  ```

- `tailwind.config.js`: Tailwind CSS configuration
  ```javascript
  module.exports = {
    darkMode: ["class"],
    content: ['./src/**/*.{ts,tsx}'],
    theme: {
      extend: {
        // Custom theme extensions
      }
    },
    plugins: [require("tailwindcss-animate")]
  }
  ```

#### Main Application Files
- `src/App.tsx`: Main application component
- `src/firebase.ts`: Firebase initialization
- `src/main.tsx`: Application entry point

### Core Features Implementation

#### Authentication
- Handled by Firebase Authentication
- Components in `src/components/auth/`
- Protected routes in `App.tsx`

#### Media Management
- TMDB API integration for movie/TV data
- Local library management with Firebase
- ELO ranking system implementation

#### User Interface
- Dark theme by default
- Responsive design using Tailwind CSS
- Custom UI components using shadcn/ui

### Key Dependencies

```json
{
  "dependencies": {
    "@radix-ui/react-toast": "^1.1.5",
    "axios": "^1.6.0",
    "firebase": "^10.5.0",
    "react": "^18.2.0",
    "react-router-dom": "^6.17.0",
    "tailwindcss": "^3.3.3"
  }
}
```

### Development Tools
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Vite for development and building

### Build and Development

#### Development
```bash
npm install
npm run dev
```

#### Production Build
```bash
npm run build
npm run preview
```