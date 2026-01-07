'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import Link from 'next/link';
import { json } from 'stream/consumers';

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
    // 1. Identify User ID
    const rawId = userData?.databaseId || userData?.userId || userData?.id || userData?.sub;
    const safeUserId = (rawId && rawId !== "undefined") ? parseInt(rawId.toString(), 10) : null;

    // 2. Query WordPress
    const { data, loading, refetch } = useQuery(GET_USER_SETTINGS, {
        variables: { id: safeUserId?.toString() },
        fetchPolicy: 'cache-and-network',
        skip: !safeUserId
    });

    const [updateProfile] = useMutation(UPDATE_USER_PROFILE);

    // States
    const [displayName, setDisplayName] = useState(userData?.name || '');
    const [previewUrl, setPreviewUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [status, setStatus] = useState('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 3. EFFECTIVE SYNC: Catch the Avatar from WordPress
useEffect(() => {
    if (data?.user) {
        setDisplayName(data.user.name || '');
        
        const wpAvatar = data.user.avatarUrl;
        const initialAvatar = userData?.avatarUrl;
        
        // DEBUG: Check your browser console (F12) to see this table!
        console.table({
            "WP_GraphQL_Avatar": wpAvatar,
            "Initial_Session_Avatar": initialAvatar
        });

        // FORCE: Use whatever URL we can find
        const finalUrl = wpAvatar || initialAvatar;
        
        if (finalUrl && finalUrl.startsWith('http')) {
            setPreviewUrl(finalUrl);
        }
    }
}, [data, userData]);
    // 4. IMAGE CHANGE HANDLER
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const router = useRouter();
    // 5. THE MISSING SAVE HANDLER
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
            variables: {
                userId: safeUserId,
                displayName: displayName,
                mediaId: uploadedMediaId
            }
        });

        // --- THE FIX ---
        setStatus('success');
        setSelectedFile(null);
        
        // 1. Refresh Apollo's local cache for this component
        const { data: updatedData } = await refetch();
        
        if (updatedData?.user?.avatarUrl) {
            setPreviewUrl(updatedData.user.avatarUrl);
        }
        // 2. Tell Next.js to refresh the server data (updates Sidebar/Header)
        router.refresh(); 

        setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
        console.error("Save Error:", err);
        setStatus('error');
    }
};  
const handleHardLogout = () => {
    // 1. Define the cookies you want to clear
    const cookiesToClear = ['auth_token', 'user_name', 'user_role', 'userData'];

    // 2. Loop through and kill each one
    cookiesToClear.forEach(cookieName => {
        // We set the path to / and the domain to localhost to ensure it matches
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    // 3. Clear storage
    localStorage.clear();
    sessionStorage.clear();

    // 4. Force a hard redirect to login
    window.location.href = "/login";
};

    if (!safeUserId) {
    return (
        <div className="flex flex-col items-center justify-center p-10 bg-orange-50 rounded-3xl border-2 border-dashed border-orange-200 animate-fade-in">
            <span className="material-symbols-outlined text-orange-500 text-6xl mb-4">history_toggle_off</span>
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Session Expired</h2>
            <p className="text-gray-500 text-center max-w-xs mt-2 text-sm leading-relaxed">
                Your login session has ended or is invalid. Please log out and sign in again to edit your profile.
            </p>
            <button
                onClick={handleHardLogout}
                className="mt-6 px-8 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg hover:bg-orange-700 active:scale-95 transition-all flex items-center gap-2"
            >
                <span className="material-symbols-outlined">logout</span>
                Logout & Re-authenticate
            </button>
        </div>
    );
}

    return (
        <form onSubmit={handleSaveProfile} className="space-y-8 animate-fade-in pb-10">
    {/* AVATAR SECTION */}
    <div className="flex flex-col items-center justify-center">
        <div className="relative group">
            {/* Main Avatar Container */}
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gradient-to-tr from-orange-100 to-orange-50 flex items-center justify-center cursor-pointer relative transition-transform hover:scale-105 active:scale-95"
            >
                {/* Logic: Show 'previewUrl' if user just picked a file, 
                   otherwise show the 'userData.avatarUrl' from the server 
                */}
                {(previewUrl || userData?.avatarUrl) ? (
                    <img
                        src={previewUrl || userData?.avatarUrl}
                        className="w-full h-full object-cover"
                        alt="Profile"
                        key={previewUrl || userData?.avatarUrl}
                    />
                ) : (
                    <div className="size-full flex items-center justify-center text-orange-600 font-black text-4xl">
                        {displayName?.charAt(0) || "U"}
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="material-symbols-outlined text-white text-3xl mb-1">photo_camera</span>
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change Photo</span>
                </div>
            </div>

            {/* Status Indicator (Small dot at the bottom right of the avatar) */}
            <div className="absolute bottom-1 right-2 w-7 h-7 bg-green-500 border-4 border-white rounded-full shadow-md"></div>
        </div>

        <div className="mt-4 text-center">
            <h3 className="text-lg font-black text-gray-800 leading-none">{displayName || 'User'}</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Profile Picture</p>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
    </div>

    {/* INPUT SECTION */}
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
                    className="w-full text-lg font-bold outline-none bg-transparent text-gray-800 placeholder:text-gray-300"
                    placeholder="Enter your name..."
                    required
                />
            </div>
        </div>
    </div>

    {/* SUBMIT SECTION */}
    <div className="pt-2">
        <button
            type="submit"
            disabled={status === 'loading'}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2
                ${status === 'loading' 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : status === 'success'
                    ? 'bg-green-500 text-white'
                    : 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-orange-200'
                }`}
        >
            {status === 'loading' ? (
                <>
                    <span className="animate-spin size-4 border-2 border-white/30 border-t-white rounded-full" />
                    Updating Profile...
                </>
            ) : status === 'success' ? (
                <>
                    <span className="material-symbols-outlined">check_circle</span>
                    Saved Successfully
                </>
            ) : (
                'Save Profile Changes'
            )}
        </button>
        
        {status === 'error' && (
            <p className="mt-3 text-center text-xs font-bold text-red-500 animate-bounce">
                Update failed. Please try again.
            </p>
        )}
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

    const handleLogout = async () => {
        await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'logout' }),
        });
        window.location.href = '/login?logout=success';
    };

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
                <div className="p-6 h-full flex flex-col">
                    <div className="hidden md:flex items-center gap-2 mb-10">
                        <div className="size-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-black text-xl">V</div>
                        <h1 className="text-xl font-black tracking-tighter text-black">
                            <Link href="/">{headerData?.generalSettings?.title || "VanturaLog"}</Link>
                        </h1>
                    </div>

                    <nav className="space-y-1 flex-1">
                        <button onClick={() => { router.push('?view=dashboard'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${currentView === 'dashboard' ? 'bg-orange-50 text-orange-600' : 'text-gray-400 hover:bg-gray-50'}`}>
                            <span className="material-symbols-outlined text-xl">dashboard</span> Dashboard
                        </button>

                        {isAdmin ? (
                            <button onClick={() => { router.push('?view=logo'); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${currentView === 'logo' ? 'bg-orange-50 text-orange-600' : 'text-gray-400 hover:bg-gray-50'}`}>
                                <span className="material-symbols-outlined text-xl">straighten</span> Logo Settings
                            </button>
                        ) : (
                            <button onClick={() => { router.push('?view=user_settings'); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${currentView === 'user_settings' ? 'bg-orange-50 text-orange-600' : 'text-gray-400 hover:bg-gray-50'}`}>
                                <span className="material-symbols-outlined text-xl">person_settings</span> User Settings
                            </button>
                        )}
                    </nav>

                    <div className="pt-6 border-t flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="size-10 shrink-0 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600">
                                {userData?.name?.charAt(0) || "U"}
                            </div>
                            <div className="truncate">
                                <p className="text-sm font-bold text-gray-800 truncate">{userData?.name || "User"}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-black">{userData?.role || "Subscriber"}</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="size-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500">
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
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-2 tracking-tight">Hello, {userData?.name || "User"}!</h2>
                            <p className="text-gray-500 font-medium">Welcome back to your dashboard.</p>
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 bg-white border rounded-2xl shadow-sm">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Account Role</p>
                                    <p className="text-xl font-black text-gray-800 capitalize">{userData?.role || "Subscriber"}</p>
                                </div>
                                <div className="p-6 bg-white border rounded-2xl shadow-sm">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">System Status</p>
                                    <p className="text-xl font-black text-green-600">Online</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === 'logo' && isAdmin && (
                        <div className="max-w-md animate-fade-in">
                            <header className="mb-8">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Branding & Logo</h2>
                                <p className="text-sm text-gray-500 font-medium">Control how your site looks to visitors.</p>
                            </header>
                            <LogoSettingsManager />
                        </div>
                    )}

                    {currentView === 'user_settings' && !isAdmin && (
                        <div className="max-w-md animate-fade-in">
                            <header className="mb-8">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Account Settings</h2>
                                <p className="text-sm text-gray-500 font-medium">Update your public profile information.</p>
                            </header>
                            <UserSettingsManager userData={userData} jwtToken={jwtToken} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}