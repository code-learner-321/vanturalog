"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const GET_HEADER_DATA = gql`
  query GetHeaderData {
    siteLogo {
      sourceUrl
      altText
    }
    logoWidth
    displaySiteTitle
    generalSettings {
      title
    }
  }
`;

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [userInitial, setUserInitial] = useState<string | null>(null);
    const pathname = usePathname();

    // Fetch logo and title from WordPress
    const { data } = useQuery(GET_HEADER_DATA);

    const toggleMenu = () => setIsOpen(!isOpen);

    // Helper function to check and update user state
    const checkUserCookie = () => {
        const nameCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('user_name='))
            ?.split('=')[1];
        
        if (nameCookie) {
            setUserInitial(decodeURIComponent(nameCookie).charAt(0).toUpperCase());
        } else {
            setUserInitial(null);
        }
    };

    useEffect(() => {
        // Check cookie on mount and whenever pathname changes
        // This ensures we update when user is redirected after logout
        checkUserCookie();

        // Poll for cookie changes (check every 5 seconds)
        // This detects when user is logged out automatically or cookies are cleared
        const cookieCheckInterval = setInterval(() => {
            checkUserCookie();
        }, 500);

        // Also listen for storage events (in case logout happens in another tab)
        const handleStorageChange = () => {
            checkUserCookie();
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            clearInterval(cookieCheckInterval);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [pathname]); // Re-check when route changes

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'About Me', href: '/about'},
        { name: 'Contact', href: '/contact' },
    ];

    const logoUrl = data?.siteLogo?.sourceUrl;
    const customWidth = data?.logoWidth || 32;
    const dynamicTitle = data?.generalSettings?.title || "Vantura";
    const showTitle = data?.displaySiteTitle !== false;

    return (
        <header className="sticky bg-[#F5F5F5]/80 top-0 z-50 w-full border-b border-gray-200 backdrop-blur-md text-slate-900">
            <div className="flex h-full flex-col">
                <div className="px-4 md:px-10 lg:px-20 xl:px-40 flex justify-center py-3">
                    <div className="w-full flex items-center justify-between max-w-[1280px]">
                        
                        {/* Logo & Site Title */}
                        <Link href="/" className="flex items-center gap-4 cursor-pointer group">
                            <div className="text-[#FFA500] transition-transform group-hover:scale-110 flex items-center justify-center">
                                {logoUrl ? (
                                    <img 
                                        src={logoUrl} 
                                        alt={data?.siteLogo?.altText || "Logo"} 
                                        style={{ width: `${customWidth}px`, height: 'auto' }}
                                        className="object-contain transition-all duration-300"
                                    />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="4 17 10 11 4 5"></polyline>
                                        <line x1="12" y1="19" x2="20" y2="19"></line>
                                    </svg>
                                )}
                            </div>
                            {showTitle && (
                                <h2 className="text-lg font-bold tracking-tight group-hover:text-[#FFA500] transition-colors">
                                    {dynamicTitle}
                                </h2>
                            )}
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
                            <nav className="flex items-center gap-8">
                                {navLinks.map((link) => (
                                    <Link key={link.name} href={link.href} className="text-sm font-medium transition-colors hover:text-[#FFA500] text-slate-600 relative group">
                                        {link.name}
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FFA500] transition-all group-hover:w-full"></span>
                                    </Link>
                                ))}
                                
                                {/* Login / Register or User Profile */}
                                <div className="flex items-center gap-3 border-l border-gray-300 pl-8">
                                    {userInitial ? (
                                        <Link href="/admin/dashboard" className="size-9 rounded-full bg-[#FFA500] text-white flex items-center justify-center text-sm font-bold shadow-md hover:brightness-110 transition-all cursor-pointer ring-2 ring-white">
                                            {userInitial}
                                        </Link>
                                    ) : (
                                        <>
                                            <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-[#FFA500] transition-colors">Log in</Link>
                                            <Link href="/register" className="text-sm font-semibold bg-[#FFA500] text-white px-6 py-2.5 rounded-full hover:shadow-lg transition-all">Register</Link>
                                        </>
                                    )}
                                </div>
                            </nav>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <div className="md:hidden flex items-center gap-3">
                            <button onClick={toggleMenu} className="text-slate-900 p-2 bg-white rounded-lg border border-gray-100 cursor-pointer">
                                {isOpen ? "✕" : "☰"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Content */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 bg-white border-t border-gray-100 ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <nav className="flex flex-col p-6 gap-5">
                        {navLinks.map((link) => (
                            <Link key={link.name} href={link.href} onClick={() => setIsOpen(false)} className="text-base font-semibold text-slate-700 hover:text-[#FFA500]">
                                {link.name}
                            </Link>
                        ))}
                        
                        <div className="pt-5 border-t border-gray-100 flex flex-col gap-4">
                            {userInitial ? (
                                <Link 
                                    href="/admin/dashboard" 
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 text-base font-bold text-slate-700"
                                >
                                    <div className="size-10 rounded-full bg-[#FFA500] text-white flex items-center justify-center">
                                        {userInitial}
                                    </div>
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" onClick={() => setIsOpen(false)} className="text-base font-semibold text-slate-700">Log in</Link>
                                    <Link href="/register" onClick={() => setIsOpen(false)} className="text-center text-base font-bold bg-[#FFA500] text-white px-6 py-3 rounded-xl shadow-md">Register</Link>
                                </>
                            )}
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    );
}