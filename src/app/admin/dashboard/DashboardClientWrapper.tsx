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
                router.refresh(); // INTERNAL REFRESH
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
                Save Branding Settings
            </button>
        </div>
    );
}

// --- USER SETTINGS MANAGER ---
function UserSettingsManager({ userData, jwtToken }: { userData: any, jwtToken: string }) {
    const router = useRouter();
    const [isHydrated, setIsHydrated] = useState(false);

    const safeUserId = useMemo(() => {
        const id = userData?.databaseId || userData?.userId || userData?.id;
        if (!id || id === "undefined") return null;
        return parseInt(id.toString(), 10);
    }, [userData]);
    if (safeUserId) {
        console.log("userid exists" + safeUserId)
    } else {
        console.log("userid does not exist" + safeUserId)
    }
    // Inside UserSettingsManager
    const { data, refetch, loading: queryLoading } = useQuery(GET_USER_SETTINGS, {
        variables: { id: safeUserId?.toString() },
        fetchPolicy: 'cache-and-network',
        skip: !safeUserId,
        // Apply this logic to BOTH useQuery(GET_LOGO_DATA) and useQuery(GET_USER_SETTINGS)
        onError: (err) => {
            const msg = err.message.toLowerCase();
            console.error("GraphQL Background Error:", msg);

            // STOP the auto-logout for these specific errors
            if (
                msg.includes('internal server error') ||
                msg.includes('expired') ||
                msg.includes('fetch failed')
            ) {
                console.warn("Session issues detected, but staying on page via Fallback Mode.");
                return; // <--- This prevents handleLogout() from being called
            }

            // Only logout if it is a hard 'Unauthorized' (meaning the user is definitely logged out)
            if (msg.includes('unauthorized')) {
                handleLogout();
            }
        }
    });
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
                if (mediaData.id) uploadedMediaId = parseInt(mediaData.id);
            }

            await updateProfile({ variables: { userId: safeUserId, displayName, mediaId: uploadedMediaId } });
            setStatus('success');
            setSelectedFile(null);
            await refetch();
            router.refresh(); // INTERNAL REFRESH (Updates Sidebar)
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
            <button type="submit" disabled={status === 'loading'} className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all ${status === 'loading' ? 'bg-gray-100 text-gray-400' : 'bg-orange-600 text-white hover:bg-orange-700'}`}>
                {status === 'loading' ? 'Updating...' : status === 'success' ? 'Saved Successfully' : 'Save Changes'}
            </button>
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

            {/* SIDEBAR */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col p-6 border-r border-slate-100">
                    <div className="flex items-center gap-3 mb-10 group">
                        <div className="size-9 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:-rotate-3 font-black text-xl tracking-tighter">V</div>
                        <h1 className="text-xl font-black tracking-tighter text-slate-900">
                            <Link href="/" className="hover:text-orange-600 transition-colors">{headerData?.generalSettings?.title || "Vantura"}</Link>
                        </h1>
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
                    </nav>

                    {/* RESTORED: LEFT BOTTOM USER PROFILE WITH IMAGE */}
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden text-left">
                            <div className="relative size-11 shrink-0">
                                <div className="size-full rounded-full overflow-hidden border border-slate-200 shadow-sm bg-orange-50 flex items-center justify-center">
                                    <img
                                        src={userData?.avatarUrl || "https://www.gravatar.com/avatar/?d=mp&s=128"}
                                        className="w-full h-full object-cover"
                                        alt="Profile"
                                    />
                                </div>
                                <span className="absolute bottom-0.5 right-0.5 size-3 bg-green-500 border-2 border-white rounded-full"></span>
                            </div>
                            <div className="truncate">
                                <p className="text-[13px] font-black text-slate-900 truncate leading-none mb-1">{userData?.name || "User Name"}</p>
                                <span className="inline-flex px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold uppercase rounded">
                                    {userData?.role || "subscriber"}
                                </span>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="size-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 transition-all cursor-pointer">
                            <span className="material-symbols-outlined">logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
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
                </div>
            </main>
        </div>
    );
}