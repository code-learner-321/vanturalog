'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client/react';
import Link from 'next/link';
import { GET_LOGO_DATA, GET_USER_SETTINGS, UPDATE_LOGO_SETTINGS, UPDATE_USER_PROFILE, GET_ALL_CATEGORIES } from '@/graphql/queries';

// --- TYPES ---
interface LogoData {
    siteLogo?: { sourceUrl: string };
    logoWidth?: number;
    logoHeight?: number;
    displaySiteTitle?: boolean;
    generalSettings?: { title: string };
}

interface UpdateLogoMutationData {
    updateLogoSettings: {
        success: boolean;
    };
}

interface UserSettingsData {
    user?: {
        id: string;
        databaseId: number;
        name: string;
        avatarUrl: string;
        description: string;
        userSettingsGroup?: {
            userSettings: string; // This maps to homepage_category_slug in your GQL
            postsPerPage?: string | number; // This maps to posts_per_page in your GQL
        };
    };
}

interface AllCategoriesData {
    categories: {
        nodes: Array<{
            name: string;
            slug: string;
        }>;
    };
}

const handleLogout = async () => {
    try {
        await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'logout' }),
        });
    } finally {
        window.location.href = '/login?logout=success';
    }
};

// --- LOGO MANAGER ---
function LogoSettingsManager() {
    const router = useRouter();
    const { data, loading, refetch } = useQuery<LogoData>(GET_LOGO_DATA, { fetchPolicy: 'network-only' });
    const [dimensions, setDimensions] = useState({ width: 200, height: 100 });
    const [displayTitle, setDisplayTitle] = useState(true);
    const [status, setStatus] = useState('');
    const [updateSettings] = useMutation<UpdateLogoMutationData>(UPDATE_LOGO_SETTINGS);

    useEffect(() => {
        if (data) {
            setDimensions({ width: data.logoWidth || 200, height: data.logoHeight || 100 });
            if (typeof data.displaySiteTitle === 'boolean') setDisplayTitle(data.displaySiteTitle);
        }
    }, [data]);

    const handleSave = async () => {
        setStatus('Syncing with WordPress...');
        try {
            const response = await updateSettings({
                variables: {
                    width: parseInt(dimensions.width.toString()),
                    height: parseInt(dimensions.height.toString()),
                    displayTitle: displayTitle
                }
            });
            if (response.data?.updateLogoSettings?.success) {
                setStatus('✅ Saved successfully!');
                await refetch();
                router.refresh();
                setTimeout(() => setStatus(''), 3000);
            }
        } catch (err) { setStatus('❌ Error saving branding.'); }
    };

    if (loading) return <div className="p-8 text-orange-600 animate-pulse font-bold text-center uppercase tracking-widest text-sm">Loading Branding...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="p-6 border rounded-2xl bg-gray-50 flex flex-col items-center justify-center min-h-[160px]">
                <p className="text-[10px] font-black uppercase tracking-widest mb-4 text-gray-400">Logo Preview</p>
                <div className="bg-white p-4 border rounded-xl shadow-inner border-dashed border-gray-200">
                    {data?.siteLogo?.sourceUrl ? (
                        <img src={data.siteLogo.sourceUrl} style={{ width: `${dimensions.width}px` }} className="max-w-full h-auto object-contain transition-all" alt="Preview" />
                    ) : <p className="text-gray-400 italic text-xs">No logo uploaded</p>}
                </div>
            </div>
            <div className="p-4 border rounded-xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-orange-500 transition-all">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Logo Width (px)</label>
                <input type="number" value={dimensions.width} onChange={(e) => setDimensions({ ...dimensions, width: parseInt(e.target.value) || 0 })} className="w-full mt-1 text-lg font-bold outline-none bg-transparent text-gray-800" />
            </div>
            <div className="p-4 border rounded-xl bg-white shadow-sm flex items-center justify-between cursor-pointer hover:border-orange-200 transition-all" onClick={() => setDisplayTitle(!displayTitle)}>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Visibility</label>
                    <p className="text-sm font-bold text-gray-800">Display Site Title</p>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${displayTitle ? 'bg-orange-600' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${displayTitle ? 'left-7' : 'left-1'}`} />
                </div>
            </div>
            {status && <div className={`p-4 rounded-xl text-xs font-bold text-center ${status.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{status}</div>}
            <button onClick={handleSave} className="w-full cursor-pointer bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-orange-700 active:scale-95 transition-all">
                Save Settings
            </button>
        </div>
    );
}

// --- USER PROFILE MANAGER ---
function UserSettingsManager({ userData, jwtToken }: { userData: any, jwtToken: string }) {
    const router = useRouter();
    const [isHydrated, setIsHydrated] = useState(false);

    const safeUserId = useMemo(() => {
        const id = userData?.databaseId || userData?.userId || userData?.id;
        if (!id || id === "undefined") return null;
        return parseInt(id.toString(), 10);
    }, [userData]);

    const { data, refetch, error } = useQuery<UserSettingsData>(GET_USER_SETTINGS, {
        variables: { id: safeUserId?.toString() },
        fetchPolicy: 'cache-and-network',
        skip: !safeUserId,
    });

    useEffect(() => {
        if (error) {
            const msg = error.message.toLowerCase();
            if (msg.includes('internal server error') || msg.includes('expired') || msg.includes('fetch failed')) return;
            if (msg.includes('unauthorized')) handleLogout();
        }
    }, [error]);

    useEffect(() => { setIsHydrated(true); }, []);

    const [updateProfile] = useMutation(UPDATE_USER_PROFILE);
    const [displayName, setDisplayName] = useState(userData?.name || '');
    const [previewUrl, setPreviewUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [status, setStatus] = useState('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (data?.user) {
            setDisplayName(data.user.name || '');
            if (data.user.avatarUrl) setPreviewUrl(data.user.avatarUrl);
        }
    }, [data, userData]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        const wpRestApiUrl = process.env.NEXT_PUBLIC_WP_GRAPHQL_REST_API_URL;
        e.preventDefault();
        if (!safeUserId) return;
        setStatus('loading');
        try {
            let uploadedMediaId = null;
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const uploadRes = await fetch(wpRestApiUrl!, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Authorization': `Bearer ${jwtToken}` }
                });
                const mediaData = await uploadRes.json();
                if (mediaData.id) uploadedMediaId = parseInt(mediaData.id);
            }
            await updateProfile({ variables: { userId: safeUserId, displayName, mediaId: uploadedMediaId } });
            setStatus('success');
            setSelectedFile(null);
            await refetch();
            router.refresh();
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) { setStatus('error'); }
    };

    if (!isHydrated) return null;

    return (
        <form onSubmit={handleSaveProfile} className="space-y-8 animate-fade-in pb-10">
            <div className="flex flex-col items-center justify-center">
                <div onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-orange-50 flex items-center justify-center cursor-pointer relative group transition-transform hover:scale-105">
                    {previewUrl || userData?.avatarUrl ? (
                        <img src={previewUrl || userData?.avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                        <span className="text-4xl font-black text-orange-600">{displayName?.charAt(0) || "U"}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                        <span className="material-symbols-outlined text-3xl mb-1">photo_camera</span>
                        <span className="text-[10px] font-bold uppercase">Change</span>
                    </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
                }} className="hidden" accept="image/*" />
            </div>
            <div className="p-4 border-2 border-gray-100 rounded-2xl bg-white shadow-sm focus-within:border-orange-500 transition-all">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Public Display Name</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full text-lg font-bold outline-none bg-transparent text-gray-800" required />
            </div>
            <button type="submit" disabled={status === 'loading'} className={`w-full cursor-pointer py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all ${status === 'loading' ? 'bg-gray-100 text-gray-400' : 'bg-orange-600 text-white hover:bg-orange-700'}`}>
                {status === 'loading' ? 'Updating...' : status === 'success' ? 'Saved Successfully' : 'Save Changes'}
            </button>
        </form>
    );
}

// --- CATEGORY & PAGINATION MANAGER ---
function PostCategorySettingsManager({ userData, jwtToken }: { userData: any, jwtToken: string }) {
    const router = useRouter();
    const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [postsPerPage, setPostsPerPage] = useState<number>(6);

    const { data: freshData, loading: userLoading, refetch } = useQuery<UserSettingsData>(GET_USER_SETTINGS, {
        variables: { id: userData?.databaseId?.toString() },
        fetchPolicy: 'network-only',
        skip: !userData?.databaseId
    });
    
    const { data: catData, loading: catsLoading } = useQuery<AllCategoriesData>(GET_ALL_CATEGORIES);

    useEffect(() => {
        if (freshData?.user?.userSettingsGroup) {
            const group = freshData.user.userSettingsGroup;
            // Note: matching the property name used in your UserSettingsData interface
            if (group.userSettings) setSelectedCategory(group.userSettings);
            if (group.postsPerPage) setPostsPerPage(Number(group.postsPerPage));
        }
    }, [freshData]);

    const handleSave = async () => {
        setStatus('saving');
        
        // FIX: Based on your error message, WP requires this as a string
        const payload = {
            acf: {
                homepage_category_slug: selectedCategory || "",
                posts_per_page: postsPerPage.toString() // Change number to string here
            }
        };

        try {
            const response = await fetch(`https://vanturalog.najubudeen.info/wp-json/wp/v2/users/${userData.databaseId}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${jwtToken}` 
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setStatus('success');
                await refetch();
                router.refresh();
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                const errorData = await response.json();
                console.error("WP Error:", errorData);
                setStatus('idle');
            }
        } catch (err) { 
            console.error("Network Fetch error:", err);
            setStatus('idle'); 
        }
    };

    if (userLoading || catsLoading) return <div className="p-8 text-orange-600 animate-pulse text-center font-bold uppercase tracking-widest text-xs">Loading Settings...</div>;

    return (
        <div className="space-y-6 max-w-md">
            <div className="p-6 bg-white border rounded-[2rem] shadow-sm border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-5 bg-orange-600 rounded-full" />
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Display Settings</h2>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="text-[10px] uppercase font-black text-slate-400 ml-2 mb-1 block">Featured Category</label>
                        <div className="p-4 border-2 border-slate-50 rounded-2xl bg-slate-50 focus-within:border-orange-200 transition-all">
                            <select 
                                value={selectedCategory} 
                                onChange={(e) => setSelectedCategory(e.target.value)} 
                                className="w-full bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                            >
                                <option value="">Select Category</option>
                                {catData?.categories?.nodes.map((cat: any) => (
                                    <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-black text-slate-400 ml-2 mb-1 block">Posts Per Page</label>
                        <div className="p-4 border-2 border-slate-50 rounded-2xl bg-slate-50 focus-within:border-orange-200 transition-all">
                            <input 
                                type="number" 
                                min="1" 
                                max="30"
                                value={postsPerPage} 
                                onChange={(e) => setPostsPerPage(Number(e.target.value))}
                                className="w-full bg-transparent font-bold text-slate-800 outline-none"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleSave} 
                        disabled={status === 'saving'} 
                        className={`w-full py-4 rounded-2xl font-black transition-all transform active:scale-95 shadow-lg ${
                            status === 'success' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100'
                        }`}
                    >
                        {status === 'saving' ? 'Processing...' : status === 'success' ? '✓ Changes Saved' : 'Save Settings'}
                    </button>
                    
                    {status === 'success' && (
                        <p className="text-center text-[10px] font-bold text-green-600 animate-fade-in">
                            Settings synchronized with WordPress
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- MAIN WRAPPER ---
export default function DashboardClientWrapper({ userData, jwtToken }: { userData: any, jwtToken: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: headerData } = useQuery<LogoData>(GET_LOGO_DATA);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const currentView = searchParams.get('view') || 'dashboard';
    const isAdmin = userData?.role === 'administrator';

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row text-black overflow-hidden h-screen">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col p-6 border-r border-slate-100">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3 group">
                            
                            <h1 className="text-xl font-black tracking-tighter text-slate-900">
                                <Link href="/" className="hover:text-orange-600 text-accent-100 transition-colors">{headerData?.generalSettings?.title || "Vantura"}</Link>
                            </h1>
                        </div>
                        <button className="md:hidden text-slate-400" onClick={() => setIsMobileMenuOpen(false)}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <nav className="space-y-1.5 flex-1">
                        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Main Menu</p>
                        <button onClick={() => { router.push('?view=dashboard'); setIsMobileMenuOpen(false); }} className={`w-full cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${currentView === 'dashboard' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <span className="material-symbols-outlined">dashboard</span> Dashboard
                        </button>
                        <button onClick={() => { router.push('?view=user_settings'); setIsMobileMenuOpen(false); }} className={`w-full cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${currentView === 'user_settings' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <span className="material-symbols-outlined">settings</span> Account Settings
                        </button>
                        {isAdmin && (
                            <button onClick={() => { router.push('?view=logo'); setIsMobileMenuOpen(false); }} className={`w-full cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${currentView === 'logo' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                                <span className="material-symbols-outlined">straighten</span> Logo Settings
                            </button>
                        )}
                        {isAdmin && (
                            <button onClick={() => { router.push('?view=categories'); setIsMobileMenuOpen(false); }} className={`w-full cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${currentView === 'categories' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                                <span className="material-symbols-outlined text-[20px]">category</span> Layout Settings
                            </button>
                        )}
                    </nav>

                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden text-left">
                            <div className="relative size-11 shrink-0">
                                <div className="size-full rounded-full overflow-hidden border border-slate-200 shadow-sm bg-orange-50 flex items-center justify-center">
                                    <img src={userData?.avatarUrl || "https://www.gravatar.com/avatar/?d=mp&s=128"} className="w-full h-full object-cover" alt="Profile" />
                                </div>
                                <span className="absolute bottom-0.5 right-0.5 size-3 bg-green-500 border-2 border-white rounded-full"></span>
                            </div>
                            <div className="truncate">
                                <p className="text-[13px] font-black text-slate-900 truncate leading-none mb-1">{userData?.name || "User Name"}</p>
                                <span className="inline-flex px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold uppercase rounded">{userData?.role || "subscriber"}</span>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="size-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 transition-all cursor-pointer">
                            <span className="material-symbols-outlined">logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="md:hidden flex items-center justify-between bg-white px-6 py-4 border-b">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-600">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <span className="font-black text-slate-900 uppercase tracking-tighter">VanturaLog</span>
                    <div className="size-8 rounded-full overflow-hidden border">
                         <img src={userData?.avatarUrl || "https://www.gravatar.com/avatar/?d=mp&s=128"} alt="" />
                    </div>
                </header>

                <main className="flex-1 p-6 md:p-12 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        {currentView === 'dashboard' && (
                            <div className="animate-fade-in">
                                <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-2">Hello, {userData?.name || "User"}!</h2>
                                <p className="text-gray-500 font-medium">Welcome back to your dashboard.</p>
                            </div>
                        )}
                        {currentView === 'logo' && isAdmin && <div className="max-w-md animate-fade-in"><LogoSettingsManager /></div>}
                        {currentView === 'user_settings' && <div className="max-w-md animate-fade-in"><UserSettingsManager userData={userData} jwtToken={jwtToken} /></div>}
                        {currentView === 'categories' && <div className="max-w-md animate-fade-in"><PostCategorySettingsManager userData={userData} jwtToken={jwtToken} /></div>}
                    </div>
                </main>
            </div>
        </div>
    );
}