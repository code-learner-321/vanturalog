'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import Link from 'next/link';

// GraphQL Definitions
const GET_LOGO_DATA = gql`
  query GetLogoData {
    siteLogo { sourceUrl }
    logoWidth
    logoHeight
    displaySiteTitle 
    generalSettings { title }
  }
`;

const GET_USER_SETTINGS = gql`
  query GetUserSettings($id: ID!) {
    user(id: $id, idType: DATABASE_ID) {
      databaseId
      name
      avatarUrl
    }
  }
`;

const UPDATE_LOGO_SETTINGS = gql`
  mutation UpdateLogoSettings($width: Int, $height: Int, $displayTitle: Boolean) {
    updateLogoSettings(input: { width: $width, height: $height, displayTitle: $displayTitle }) {
      success
    }
  }
`;

const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile($userId: Int!, $displayName: String, $mediaId: Int) {
    updateUserProfile(input: { userId: $userId, displayName: $displayName, mediaId: $mediaId }) {
      success
    }
  }
`;

// Helper: Centralized Logout
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
    const { data, loading, refetch } = useQuery(GET_LOGO_DATA, { fetchPolicy: 'network-only' });
    const [dimensions, setDimensions] = useState({ width: 200, height: 100 });
    const [displayTitle, setDisplayTitle] = useState(true);
    const [status, setStatus] = useState('');
    const [updateSettings] = useMutation(UPDATE_LOGO_SETTINGS);

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
                setTimeout(() => setStatus(''), 3000);
            }
        } catch (err) {
            setStatus('❌ Error: Check permissions.');
        }
    };

    if (loading) return <div className="p-8 text-orange-600 animate-pulse font-bold text-center text-sm uppercase tracking-widest">Loading Settings...</div>;

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

            <button onClick={handleSave} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-orange-700 active:scale-95 transition-all">
                Save Branding Settings
            </button>
        </div>
    );
}

// --- USER SETTINGS MANAGER ---
function UserSettingsManager({ userData, jwtToken }: { userData: any, jwtToken: string }) {
    // Robust ID extraction
    const safeUserId = useMemo(() => {
        const id = userData?.databaseId || userData?.userId || userData?.id || userData?.sub;
        if (!id || id === "undefined") return null;
        const parsed = parseInt(id.toString(), 10);
        return isNaN(parsed) ? null : parsed;
    }, [userData]);

    const { data, refetch, loading: queryLoading } = useQuery(GET_USER_SETTINGS, {
        variables: { id: safeUserId?.toString() },
        fetchPolicy: 'cache-and-network',
        skip: !safeUserId,
        onError: (err) => {
            // If the query fails due to authentication (401), force logout
            if (err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('expired')) {
                handleLogout();
            }
        }
    });

    const [updateProfile] = useMutation(UPDATE_USER_PROFILE);
    const [displayName, setDisplayName] = useState(userData?.name || '');
    const [previewUrl, setPreviewUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [status, setStatus] = useState('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (data?.user) {
            setDisplayName(data.user.name || '');
            const finalUrl = data.user.avatarUrl || userData?.avatarUrl;
            if (finalUrl && finalUrl.startsWith('http')) {
                setPreviewUrl(finalUrl);
            }
        }
    }, [data, userData]);

    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 1200;
                    if (width > MAX_WIDTH) {
                        height = (MAX_WIDTH / width) * height;
                        width = MAX_WIDTH;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name.split('.')[0] + '.jpg', { type: 'image/jpeg' }));
                        }
                    }, 'image/jpeg', 0.7);
                };
            };
        });
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            const compressed = await compressImage(file);
            setSelectedFile(compressed);
            setPreviewUrl(URL.createObjectURL(compressed));
        } else {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!safeUserId) return;
        setStatus('loading');
        try {
            let uploadedMediaId = null;
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const uploadRes = await fetch("https://vanturalog.najubudeen.info/wp-json/wp/v2/media", {
                    method: 'POST',
                    body: formData,
                    headers: { 'Authorization': `Bearer ${jwtToken}` }
                });
                const mediaData = await uploadRes.json();
                if (mediaData.id) uploadedMediaId = parseInt(mediaData.id.toString(), 10);
            }

            await updateProfile({
                variables: { userId: safeUserId, displayName, mediaId: uploadedMediaId }
            });

            setStatus('success');
            setSelectedFile(null);
            await refetch();
            router.refresh();
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            setStatus('error');
        }
    };

    // Only show session expired if we've attempted to find the ID and it's definitely gone
    if (!safeUserId && !queryLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-orange-50 rounded-3xl border-2 border-dashed border-orange-200 animate-fade-in">
                <span className="material-symbols-outlined text-orange-500 text-6xl mb-4">history_toggle_off</span>
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Session Expired</h2>
                <p className="text-gray-500 text-center text-sm mb-6">Your authentication has timed out. Please log in again.</p>
                <button onClick={handleLogout} className="px-8 cursor-pointer py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg">
                    Logout & Re-authenticate
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSaveProfile} className="space-y-8 animate-fade-in pb-10">
            <div className="flex flex-col items-center justify-center">
                <div className="relative group">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gradient-to-tr from-orange-100 to-orange-50 flex items-center justify-center cursor-pointer relative transition-transform hover:scale-105 active:scale-95"
                    >
                        {(previewUrl || userData?.avatarUrl) ? (
                            <img src={previewUrl || userData?.avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                            <div className="size-full flex items-center justify-center text-orange-600 font-black text-4xl">
                                {displayName?.charAt(0) || "U"}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="material-symbols-outlined text-white text-3xl mb-1">photo_camera</span>
                            <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change Photo</span>
                        </div>
                    </div>
                    <div className="absolute bottom-1 right-2 w-7 h-7 bg-green-500 border-4 border-white rounded-full shadow-md"></div>
                </div>
                <div className="mt-4 text-center">
                    <h3 className="text-lg font-black text-gray-800 leading-none">{displayName || 'User'}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Profile Picture</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
            </div>

            <div className="space-y-4">
                <div className="group p-4 border-2 border-gray-100 rounded-2xl bg-white shadow-sm focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-50 transition-all">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-focus-within:text-orange-500 transition-colors">
                        Public Display Name
                    </label>
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gray-400 group-focus-within:text-orange-500">badge</span>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full text-lg font-bold outline-none bg-transparent text-gray-800"
                            placeholder="Enter your name..."
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2
                        ${status === 'loading' ? 'bg-gray-100 text-gray-400' : status === 'success' ? 'bg-green-500 text-white' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
                >
                    {status === 'loading' ? 'Updating Profile...' : status === 'success' ? 'Saved Successfully' : 'Save Profile Changes'}
                </button>
            </div>
        </form>
    );
}

// --- MAIN WRAPPER ---
export default function DashboardClientWrapper({ userData, jwtToken }: { userData: any, jwtToken: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: headerData } = useQuery(GET_LOGO_DATA);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const currentView = searchParams.get('view') || 'dashboard';
    const isAdmin = userData?.role === 'administrator';

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row text-black">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

            {/* MOBILE HEADER */}
            <div className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="size-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-black">V</div>
                    <span className="font-black text-lg tracking-tighter">{headerData?.generalSettings?.title || "Vantura"}</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
                    <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                </button>
            </div>

            {/* SIDEBAR */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col p-6 bg-white border-r border-slate-100">
                    <div className="hidden md:flex items-center gap-3 mb-10 group cursor-pointer">
                        <div className="size-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200 transition-all duration-300 group-hover:shadow-orange-300 group-hover:-rotate-3">
                            <span className="font-black text-xl tracking-tighter">V</span>
                        </div>
                        <h1 className="text-xl font-black tracking-tighter text-slate-900">
                            <Link href="/" className="hover:text-orange-600 transition-colors">
                                {headerData?.generalSettings?.title || "VanturaLog"}
                            </Link>
                        </h1>
                    </div>

                    <nav className="space-y-1.5 flex-1">
                        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">Main Menu</p>
                        <button
                            onClick={() => { router.push('?view=dashboard'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl font-bold text-sm transition-all ${currentView === 'dashboard' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">dashboard</span> Dashboard
                        </button>

                        <button
                            onClick={() => { router.push('?view=user_settings'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl font-bold text-sm transition-all ${currentView === 'user_settings' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">settings</span> Account Settings
                        </button>

                        {isAdmin && (
                            <button
                                onClick={() => { router.push('?view=logo'); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl font-bold text-sm transition-all ${currentView === 'logo' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <span className="material-symbols-outlined text-[20px]">straighten</span> Logo Settings
                            </button>
                        )}
                    </nav>

                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                        {userData ? (
                            <>
                                <div className="flex items-center gap-3 overflow-hidden text-left">
                                    <div className="relative size-11 shrink-0">
                                        <div className="size-full rounded-full overflow-hidden ring-2 ring-white ring-offset-2 ring-offset-slate-50 border border-slate-200 shadow-sm bg-orange-50 flex items-center justify-center">
                                            <img 
                                                src={userData?.avatarUrl || "https://www.gravatar.com/avatar/?d=mp&s=128"} 
                                                className="w-full h-full object-cover" 
                                                alt="Profile" 
                                            />
                                        </div>
                                        <span className="absolute bottom-0.5 right-0.5 size-3 bg-green-500 border-2 border-white rounded-full"></span>
                                    </div>
                                    <div className="truncate">
                                        <p className="text-[13px] font-black text-slate-900 truncate">{userData?.name || "User Name"}</p>
                                        <span className="inline-flex px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold uppercase rounded">
                                            {userData?.role || "subscriber"}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={handleLogout} className="size-10 flex items-center cursor-pointer justify-center rounded-xl text-slate-400 hover:text-red-500 transition-all">
                                    <span className="material-symbols-outlined">logout</span>
                                </button>
                            </>
                        ) : (
                            <button onClick={handleLogout} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg">
                                Logout Session
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    {currentView === 'dashboard' && (
                        <div className="animate-fade-in">
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-2 tracking-tight">Hello, {userData?.name || "User"}!</h2>
                            <p className="text-gray-500 font-medium">Welcome back to your dashboard.</p>
                        </div>
                    )}
                    {currentView === 'logo' && isAdmin && (
                        <div className="max-w-md animate-fade-in">
                            <header className="mb-8">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Branding & Logo</h2>
                            </header>
                            <LogoSettingsManager />
                        </div>
                    )}
                    {currentView === 'user_settings' && (
                        <div className="max-w-md animate-fade-in">
                            <header className="mb-8">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Account Settings</h2>
                            </header>
                            <UserSettingsManager userData={userData} jwtToken={jwtToken} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}