"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useRouter } from "next/navigation";

interface HeaderData {
    siteLogo: {
        sourceUrl: string;
        altText: string;
    } | null;
    logoWidth: number | null;
    displaySiteTitle: boolean | null;
    generalSettings: {
        title: string;
    } | null;
}

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

const LoadingSpinner = ({ color = "text-white" }) => (
    <svg className={`animate-spin h-4 w-4 ${color}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [userInitial, setUserInitial] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const [activeRedirect, setActiveRedirect] = useState<string | null>(null);

    // Add <HeaderData> here to tell TypeScript what to expect
    const { data } = useQuery<HeaderData>(GET_HEADER_DATA);

    // 2. Reset the spinner whenever the pathname (URL) changes
    useEffect(() => {
        setActiveRedirect(null);
        setIsOpen(false); // Close mobile menu on nav
    }, [pathname]);

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
        checkUserCookie();
        const cookieCheckInterval = setInterval(checkUserCookie, 500);
        const handleStorageChange = () => checkUserCookie();
        window.addEventListener('storage', handleStorageChange);
        return () => {
            clearInterval(cookieCheckInterval);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (pathname === path) return;

    setActiveRedirect(path);
    router.push(path);

    // Safety reset: if the page hasn't changed in 5 seconds, clear the spinner
    setTimeout(() => {
        setActiveRedirect(null);
    }, 5000);
};

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'About Me', href: '/about' },
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
                                    <img src={logoUrl} alt={data?.siteLogo?.altText || "Logo"} style={{ width: `${customWidth}px`, height: 'auto' }} className="object-contain" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="4 17 10 11 4 5"></polyline>
                                        <line x1="12" y1="19" x2="20" y2="19"></line>
                                    </svg>
                                )}
                            </div>
                            {showTitle && <h2 className="text-lg font-bold tracking-tight group-hover:text-[#FFA500] transition-colors">{dynamicTitle}</h2>}
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
                            <nav className="flex items-center gap-8">
                                {navLinks.map((link) => (
                                    <Link key={link.name} href={link.href} className="text-sm font-medium transition-colors hover:text-[#FFA500] text-slate-600 relative group">
                                        {link.name}
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FFA500] transition-all group-hover:w-full"></span>
                                    </Link>
                                ))}

                                <div className="flex items-center gap-3 border-l border-gray-300 pl-8">
                                    {userInitial ? (
                                        <button
                                            onClick={(e) => handleNavClick(e, "/admin/dashboard")}
                                            disabled={!!activeRedirect}
                                            className={`size-9 rounded-full bg-[#FFA500] text-white flex items-center justify-center text-sm font-bold shadow-md hover:brightness-110 transition-all cursor-pointer ring-2 ring-white relative ${activeRedirect === "/admin/dashboard" ? "opacity-80 cursor-wait" : ""}`}
                                        >
                                            {activeRedirect === "/admin/dashboard" ? <LoadingSpinner /> : userInitial}
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={(e) => handleNavClick(e, "/login")}
                                                disabled={!!activeRedirect}
                                                className="text-sm font-semibold text-slate-700 hover:text-[#FFA500] transition-colors cursor-pointer flex items-center gap-2"
                                            >
                                                {activeRedirect === "/login" && <LoadingSpinner color="text-[#FFA500]" />}
                                                Log in
                                            </button>

                                            <button
                                                onClick={(e) => handleNavClick(e, "/register")}
                                                disabled={!!activeRedirect}
                                                className="text-sm font-semibold bg-[#FFA500] text-white px-6 py-2.5 rounded-full hover:shadow-lg transition-all cursor-pointer flex items-center justify-center min-w-[110px]"
                                            >
                                                {activeRedirect === "/register" ? <LoadingSpinner /> : "Register"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </nav>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <div className="md:hidden flex items-center gap-3">
                            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-900 p-2 bg-white rounded-lg border border-gray-100">
                                {isOpen ? "✕" : "☰"}
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Mobile Menu Content - Added handleNavClick here too */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 bg-white border-t border-gray-100 ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <nav className="flex flex-col p-6 gap-5">
                        {navLinks.map((link) => (
                            <Link key={link.name} href={link.href} className="text-base font-semibold text-slate-700">{link.name}</Link>
                        ))}
                        <div className="pt-5 border-t border-gray-100 flex flex-col gap-4">
                            {userInitial ? (
                                <button onClick={(e) => handleNavClick(e, "/admin/dashboard")} className="flex items-center gap-3 text-base font-bold text-slate-700">
                                    <div className="size-10 rounded-full bg-[#FFA500] text-white flex items-center justify-center">
                                        {activeRedirect === "/admin/dashboard" ? <LoadingSpinner /> : userInitial}
                                    </div>
                                    Dashboard
                                </button>
                            ) : (
                                <>
                                    <button onClick={(e) => handleNavClick(e, "/login")} className="text-left text-base font-semibold text-slate-700 flex items-center gap-2">
                                        {activeRedirect === "/login" && <LoadingSpinner color="text-[#FFA500]" />} Log in
                                    </button>
                                    <button onClick={(e) => handleNavClick(e, "/register")} className="flex justify-center text-base font-bold bg-[#FFA500] text-white px-6 py-3 rounded-xl">
                                        {activeRedirect === "/register" ? <LoadingSpinner /> : "Register"}
                                    </button>
                                </>
                            )}
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    );
}