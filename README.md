# MediaEloRanker

A React application for discovering, collecting, and ranking various media types (movies, TV shows, anime, music) using an ELO rating system. Built with React, TypeScript, Tailwind CSS, and Firebase, featuring TMDB API integration for movie and TV show data.

## Features

- 🎬 Browse trending movies and TV shows
- 📚 Personal media library management
- ⭐ ELO-based ranking system
- 🔍 Advanced search functionality
- 🌙 Dark mode interface
- 📱 Responsive design
- 🔐 User authentication
- 🏆 Personal and global rankings

## Documentation

- [Project Structure](./docs/project-documentation.md) - Detailed project organization and architecture
- [Component Documentation](./docs/component-api-documentation.md) - Component API references and examples
- [Firestore Structure](./docs/firestore-documentation.md) - Database schema and operations

## Tech Stack

- **Frontend**:
    - React 18
    - TypeScript
    - Tailwind CSS
    - shadcn/ui components
    - Vite

- **Backend**:
    - Firebase Authentication
    - Cloud Firestore
    - TMDB API

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- TMDB API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/LordSpecial/MediaEloRanker
cd MediaEloRanker
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_FIREBASE_CONFIG=your_firebase_config
```

4. Start the development server:
```bash
npm run dev
```

### Firebase Setup

1. Create a new Firebase project
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Add your Firebase configuration to `.env`
5. Deploy Firestore security rules:
```bash
firebase deploy --only firestore:rules
```

## Project Structure

```
MediaEloRanker/
├── src/
│   ├── components/      # UI components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API and service integrations
│   ├── lib/           # Utility functions
│   └── assets/        # Static assets
├── docs/              # Documentation
└── public/            # Public assets
```

## Key Features Implementation

### Authentication
```typescript
// Example usage of authentication
const { user, loading } = useAuth();

if (loading) return <Loading />;
if (!user) return <Login />;
```

### Media Discovery
```typescript
// Example usage of media hooks
const { movies, loading } = useMovies('trending');
const { shows } = useTV('popular');
```

### Library Management
```typescript
// Example usage of library hook
const { addToLibrary, checkInLibrary } = useLibrary();
```

## Contributing

1. Fork the repository
2. Create your feature branch:
```bash
git checkout -b feature/AmazingFeature
```
3. Commit your changes:
```bash
git commit -m 'Add some AmazingFeature'
```
4. Push to the branch:
```bash
git push origin feature/AmazingFeature
```
5. Open a Pull Request

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
- `npm run type-check` - Check TypeScript

## Deployment

The application can be deployed to various platforms:

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Vercel
```bash
vercel
```

## Environment Variables

Required environment variables:

```env
VITE_TMDB_API_KEY=           # TMDB API Key
VITE_TMDB_BASE_URL=          # TMDB API Base URL
VITE_FIREBASE_CONFIG=        # Firebase Configuration
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [TMDB](https://www.themoviedb.org/) for providing the movie and TV show data
- [shadcn/ui](https://ui.shadcn.com/) for the UI components
- [Firebase](https://firebase.google.com/) for backend services
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for icons

## Roadmap

- [ ] Add support for anime tracking
- [ ] Implement music library integration
- [ ] Add social features
- [ ] Implement recommendation system
- [ ] Add offline support
- [ ] Add PWA support

## Support

For support, please open an issue in the repository or contact the maintainers.

## Notes

- This is a work in progress
- Contributions are welcome
- Please read the documentation before contributing

## Related Projects

- [TMDB React Components](link-to-repo)
- [Firebase Auth Examples](link-to-repo)
- [ELO Rating System](link-to-repo)

Would you like me to add:
1. More detailed setup instructions?
2. Additional deployment options?
3. Testing documentation?
4. Performance optimization guidelines?
