import { NavLink } from 'react-router-dom';
import { Home, Compass, Award, Library, User } from 'lucide-react';

const Navbar = () => {
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

                            <NavLink
                                to="/rank"
                                className={({ isActive }) =>
                                    `flex items-center space-x-2 text-gray-300 hover:text-white transition-colors ${
                                        isActive ? 'text-white' : ''
                                    }`
                                }
                            >
                                <Award size={20} />
                                <span>Rank</span>
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
                                <span>My Library</span>
                            </NavLink>

                            <NavLink
                                to="/profile"
                                className={({ isActive }) =>
                                    `flex items-center space-x-2 text-gray-300 hover:text-white transition-colors ${
                                        isActive ? 'text-white' : ''
                                    }`
                                }
                            >
                                <User size={20} />
                                <span>Profile</span>
                            </NavLink>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;