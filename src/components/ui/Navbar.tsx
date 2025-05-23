import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Compass, Award, Library, User, Film, Tv, Music, PlayCircle, LogOut, LucideIcon, Shield, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavDropdownItemProps {
    icon: LucideIcon;
    text: string;
    to: string;
}

const NavDropdownItem = ({ icon: Icon, text, to }: NavDropdownItemProps) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(to)}
            className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-700 cursor-pointer transition-colors"
        >
            <Icon size={18} className="text-gray-400" />
            <span className="text-gray-300 hover:text-white">{text}</span>
        </div>
    );
};

const Navbar = () => {
    const [isDiscoverOpen, setIsDiscoverOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const mediaCategories = [
        { icon: Film, text: 'Movies', path: '/explore/movies' },
        { icon: Tv, text: 'TV Shows', path: '/explore/tv' },
        { icon: PlayCircle, text: 'Anime', path: '/explore/anime' },
        { icon: Music, text: 'Music', path: '/explore/music' },
    ];

    return (
        <nav className="fixed top-0 w-full bg-gray-900 border-b border-gray-800 z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <span className="text-xl font-bold text-white">MediaRank</span>
                    </div>

                    <div className="hidden md:block">
                        <div className="flex items-center space-x-8">
                            <NavLink
                                to="/home"
                                className={({ isActive }) =>
                                    `flex items-center space-x-2 text-gray-300 hover:text-white transition-colors ${
                                        isActive ? 'text-white' : ''
                                    }`
                                }
                            >
                                <Home size={20} />
                                <span>Home</span>
                            </NavLink>

                            {/* Discover Dropdown */}
                            <div
                                className="relative"
                                onMouseEnter={() => setIsDiscoverOpen(true)}
                                onMouseLeave={() => setIsDiscoverOpen(false)}
                            >
                                <NavLink
                                    to="/discover"
                                    className={({ isActive }) =>
                                        `flex items-center space-x-2 text-gray-300 hover:text-white transition-colors ${
                                            isActive ? 'text-white' : ''
                                        }`
                                    }
                                >
                                    <Compass size={20} />
                                    <span>Discover</span>
                                </NavLink>

                                {/* Dropdown Menu */}
                                <div
                                    className={`absolute left-0 w-48 mt-2 py-2 bg-gray-800 rounded-md shadow-lg transition-all duration-200 ${
                                        isDiscoverOpen
                                            ? 'opacity-100 translate-y-0 visible'
                                            : 'opacity-0 -translate-y-2 invisible'
                                    }`}
                                >
                                    {mediaCategories.map((category, index) => (
                                        <NavDropdownItem
                                            key={index}
                                            icon={category.icon}
                                            text={category.text}
                                            to={category.path}
                                        />
                                    ))}
                                </div>
                            </div>

                            <NavLink
                                to="/rank"
                                className={({ isActive }) =>
                                    `flex items-center space-x-2 text-gray-300 hover:text-white transition-colors ${
                                        isActive ? 'text-white' : ''
                                    }`
                                }
                            >
                                <Award size={20} />
                                <span>Compare</span>
                            </NavLink>

                            <NavLink
                                to="/library"
                                className={({ isActive }) =>
                                    `flex items-center space-x-2 text-gray-300 hover:text-white transition-colors ${
                                        isActive ? 'text-white' : ''
                                    }`
                                }
                            >
                                <Library size={20} />
                                <span>Library</span>
                            </NavLink>

                            {/* Profile Menu */}
                            <div
                                className="relative"
                                onMouseEnter={() => setIsProfileOpen(true)}
                                onMouseLeave={() => setIsProfileOpen(false)}
                            >
                                <NavLink
                                    to="/profile"
                                    className={({ isActive }) =>
                                        `flex items-center space-x-2 text-gray-300 hover:text-white transition-colors ${
                                            isActive ? 'text-white' : ''
                                        }`
                                    }
                                >
                                    <User size={20} />
                                    <span>{user?.displayName || 'Profile'}</span>
                                </NavLink>

                                {/* Profile Dropdown */}
                                <div
                                    className={`absolute right-0 w-48 mt-2 py-2 bg-gray-800 rounded-md shadow-lg transition-all duration-200 ${
                                        isProfileOpen
                                            ? 'opacity-100 translate-y-0 visible'
                                            : 'opacity-0 -translate-y-2 invisible'
                                    }`}
                                >
                                    <div
                                        onClick={handleLogout}
                                        className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-700 cursor-pointer transition-colors text-red-400 hover:text-red-300"
                                    >
                                        <LogOut size={18} />
                                        <span>Logout</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;