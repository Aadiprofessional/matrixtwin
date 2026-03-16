import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import * as Ri from 'react-icons/ri';
import { Button } from '../components/ui/Button';
import { API_BASE_URL } from '../utils/api';

type UploadType = 'signature' | 'attachment' | 'image' | 'pic';

interface SettingsCategoryProps {
  key: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

interface UploadedFile {
  id?: string;
  url?: string;
  fileUrl?: string;
  file_url?: string;
  fileName?: string;
  originalname?: string;
  original_name?: string;
  name?: string;
  mimeType?: string;
  mimetype?: string;
  mime_type?: string;
  size?: number;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

interface GroupedUploads {
  signature: UploadedFile[];
  attachment: UploadedFile[];
  image: UploadedFile[];
  pic: UploadedFile[];
}

interface UploadState {
  uploading: boolean;
  success: string;
  error: string;
}

interface ProfileFormState {
  name: string;
  email: string;
  role: string;
  phone: string;
  bio: string;
}

interface PreviewState {
  file: UploadedFile;
  url: string;
}

const emptyUploads: GroupedUploads = {
  signature: [],
  attachment: [],
  image: [],
  pic: []
};

const uploadAcceptMap: Record<UploadType, string> = {
  signature: 'image/png,image/jpeg,image/webp',
  attachment: '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  image: 'image/*',
  pic: 'image/*'
};

const uploadDescriptionMap: Record<UploadType, string> = {
  signature: 'Upload signed images for approvals and signoff workflows.',
  attachment: 'Upload PDF and Word documents for profile-related records.',
  image: 'Upload generic images that belong to your account assets.',
  pic: 'Upload profile picture using the dedicated /uploads/pic endpoint.'
};

const uploadSectionTypes: UploadType[] = ['signature', 'attachment'];

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useTranslation();
  const { language, changeLanguage, languages } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('profile');
  const [uploads, setUploads] = useState<GroupedUploads>(emptyUploads);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [uploadsError, setUploadsError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    name: '',
    email: '',
    role: '',
    phone: '',
    bio: ''
  });
  const [activePreview, setActivePreview] = useState<PreviewState | null>(null);
  const [uploadState, setUploadState] = useState<Record<UploadType, UploadState>>({
    signature: { uploading: false, success: '', error: '' },
    attachment: { uploading: false, success: '', error: '' },
    image: { uploading: false, success: '', error: '' },
    pic: { uploading: false, success: '', error: '' }
  });

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || '',
      phone: user?.phone || '',
      bio: user?.bio || ''
    });
  }, [user]);

  const settingsCategories: SettingsCategoryProps[] = [
    {
      key: 'profile',
      title: 'Profile Settings',
      icon: <Ri.RiUserSettingsLine />,
      description: 'Manage profile details and all uploads.'
    },
    {
      key: 'appearance',
      title: 'Appearance',
      icon: <Ri.RiPaintLine />,
      description: 'Switch light and dark theme.'
    },
    {
      key: 'language',
      title: 'Language',
      icon: <Ri.RiTranslate2 />,
      description: 'Change your preferred application language.'
    },
    {
      key: 'privacy',
      title: 'Privacy & Security',
      icon: <Ri.RiShieldLine />,
      description: 'Review account security information.'
    }
  ];

  const totalUploadedFiles = useMemo(
    () => uploadSectionTypes.reduce((total, uploadType) => total + uploads[uploadType].length, 0),
    [uploads]
  );

  const getToken = () => localStorage.getItem('token');

  const normalizeUploads = (payload: any): GroupedUploads => {
    const value = payload?.data || payload || {};
    const normalizeFile = (file: UploadedFile): UploadedFile => ({
      ...file,
      fileUrl: file.fileUrl || file.file_url || file.url || '',
      fileName: file.fileName || file.originalname || file.original_name || file.name || '',
      mimeType: file.mimeType || file.mimetype || file.mime_type || '',
      createdAt: file.createdAt || file.created_at || file.updatedAt || file.updated_at || ''
    });

    return {
      signature: Array.isArray(value.signature) ? value.signature.map(normalizeFile) : [],
      attachment: Array.isArray(value.attachment) ? value.attachment.map(normalizeFile) : [],
      image: Array.isArray(value.image) ? value.image.map(normalizeFile) : [],
      pic: Array.isArray(value.pic) ? value.pic.map(normalizeFile) : []
    };
  };

  const sanitizeUrl = (value: string) => value.trim().replace(/[`'"]/g, '');

  const getFileName = (file: UploadedFile) =>
    file.originalname || file.original_name || file.fileName || file.name || 'Uploaded file';

  const getFileUrl = (file: UploadedFile) => {
    const raw = file.fileUrl || file.file_url || file.url || '';
    return raw ? sanitizeUrl(raw) : '';
  };

  const getFileType = (file: UploadedFile) => file.mimeType || file.mimetype || file.mime_type || 'unknown';

  const isImageFile = (file: UploadedFile) => {
    const fileType = getFileType(file).toLowerCase();
    const fileName = getFileName(file).toLowerCase();
    return fileType.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(fileName);
  };

  const isPdfFile = (file: UploadedFile) => {
    const fileType = getFileType(file).toLowerCase();
    const fileName = getFileName(file).toLowerCase();
    return fileType.includes('pdf') || fileName.endsWith('.pdf');
  };

  const isDocFile = (file: UploadedFile) => {
    const fileType = getFileType(file).toLowerCase();
    const fileName = getFileName(file).toLowerCase();
    return (
      fileType.includes('msword') ||
      fileType.includes('officedocument.wordprocessingml.document') ||
      /\.(doc|docx)$/.test(fileName)
    );
  };

  const getDocumentViewerUrl = (url: string) => `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;

  const openFilePreview = (file: UploadedFile) => {
    const fileUrl = getFileUrl(file);
    if (!fileUrl) return;
    setActivePreview({ file, url: fileUrl });
  };

  const getFileDate = (file: UploadedFile) => {
    const value = file.createdAt || file.created_at || file.updatedAt || file.updated_at;
    if (!value) return 'Unknown date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleString();
  };

  const getFormattedSize = (size?: number) => {
    if (!size || Number.isNaN(size)) return 'Unknown size';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fetchUploads = async () => {
    const token = getToken();
    if (!token) {
      setUploadsError('Missing auth token. Please sign in again.');
      setUploads(emptyUploads);
      return;
    }

    setLoadingUploads(true);
    setUploadsError('');
    try {
      const response = await fetch(`${API_BASE_URL}/uploads`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const body = await response.json().catch(() => ({}));
      console.log('Settings uploads GET response:', body);
      if (!response.ok) {
        throw new Error(body?.message || body?.error || 'Failed to load uploads');
      }

      setUploads(normalizeUploads(body));
    } catch (error) {
      setUploadsError((error as Error).message);
      setUploads(emptyUploads);
    } finally {
      setLoadingUploads(false);
    }
  };

  useEffect(() => {
    if (activeCategory === 'profile') {
      fetchUploads();
    }
  }, [activeCategory]);

  const handleProfileChange = (key: keyof ProfileFormState, value: string) => {
    setProfileForm(prev => ({ ...prev, [key]: value }));
    setProfileError('');
    setProfileSuccess('');
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      await updateUser({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        bio: profileForm.bio.trim(),
        role: profileForm.role.trim() as any
      });
      setProfileSuccess('Profile details updated successfully.');
    } catch (error) {
      setProfileError((error as Error).message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const uploadFile = async (uploadType: UploadType, file: File) => {
    const token = getToken();
    if (!token) {
      setUploadState(prev => ({
        ...prev,
        [uploadType]: { uploading: false, success: '', error: 'Missing auth token. Please sign in again.' }
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      [uploadType]: { uploading: true, success: '', error: '' }
    }));

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/uploads/${uploadType}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const body = await response.json().catch(() => ({}));
      console.log(`Settings uploads ${uploadType} POST response:`, body);
      if (!response.ok) {
        throw new Error(body?.message || body?.error || `Failed to upload ${uploadType}`);
      }

      setUploadState(prev => ({
        ...prev,
        [uploadType]: { uploading: false, success: `${file.name} uploaded`, error: '' }
      }));
      await fetchUploads();
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        [uploadType]: { uploading: false, success: '', error: (error as Error).message }
      }));
    }
  };

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    uploadType: UploadType
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(uploadType, file);
    event.target.value = '';
  };

  const profileImageUrl = uploads.pic[0] ? getFileUrl(uploads.pic[0]) : user?.avatar;

  return (
    <>
    <div className="max-w-7xl mx-auto pb-12">
      <div className="relative overflow-hidden rounded-xl mb-8 bg-gradient-to-r from-gray-900 via-slate-800 to-zinc-900">
        <div className="absolute inset-0 bg-ai-dots opacity-20"></div>
        <div className="p-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white flex items-center">
              <Ri.RiSettings4Line className="mr-3 text-slate-300" />
              {t('settings.title', 'Settings')}
            </h1>
            <p className="text-slate-300 mt-2 max-w-2xl">
              Manage your profile, upload signature and documents, and keep account preferences in sync.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-sm text-slate-300">Uploaded Files</div>
              <div className="text-2xl font-bold text-white">{totalUploadedFiles}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-sm text-slate-300">Profile Completeness</div>
              <div className="text-2xl font-bold text-white">
                {profileForm.name && profileForm.email ? 'High' : 'Medium'}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-sm text-slate-300">API Endpoint</div>
              <div className="text-sm md:text-base font-semibold text-white">{`${API_BASE_URL}/uploads`}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div className="lg:col-span-1" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4 text-secondary-900 dark:text-white px-2">Settings</h2>
            <div className="space-y-2">
              {settingsCategories.map(category => (
                <button
                  key={category.key}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition-colors ${
                    activeCategory === category.key ? 'bg-primary-500/10 text-primary-500' : 'hover:bg-dark-800/50'
                  }`}
                  onClick={() => setActiveCategory(category.key)}
                >
                  <div
                    className={`mr-3 text-xl ${
                      activeCategory === category.key ? 'text-primary-500' : 'text-secondary-400'
                    }`}
                  >
                    {category.icon}
                  </div>
                  <div>
                    <div className="font-medium">{category.title}</div>
                    <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">{category.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div className="lg:col-span-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-6">
            {activeCategory === 'profile' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-secondary-900 dark:text-white flex items-center">
                    <Ri.RiUserSettingsLine className="mr-2 text-primary-500" />
                    Profile Settings
                  </h2>
                  <Button variant="outline" leftIcon={<Ri.RiRefreshLine />} onClick={fetchUploads} isLoading={loadingUploads}>
                    Refresh Files
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="rounded-xl border border-secondary-200 dark:border-dark-700 p-5">
                      <div className="w-28 h-28 rounded-full overflow-hidden mx-auto bg-secondary-100 dark:bg-dark-700">
                        {profileImageUrl ? (
                          <img src={profileImageUrl} alt={user?.name || 'Profile'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-secondary-400 text-4xl">
                            <Ri.RiUserLine />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-300 text-center mt-4">
                        Upload profile image via /api/uploads/pic
                      </p>
                      <input
                        type="file"
                        accept={uploadAcceptMap.pic}
                        onChange={event => handleFileInputChange(event, 'pic')}
                        className="w-full mt-3 text-sm text-secondary-700 dark:text-secondary-200 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary-500/10 file:text-primary-500"
                      />
                      {uploadState.pic.uploading && <p className="text-xs mt-2 text-secondary-500">Uploading profile picture...</p>}
                      {uploadState.pic.success && <p className="text-xs mt-2 text-success">{uploadState.pic.success}</p>}
                      {uploadState.pic.error && <p className="text-xs mt-2 text-error">{uploadState.pic.error}</p>}
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-dark-700 bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
                          value={profileForm.name}
                          onChange={event => handleProfileChange('name', event.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-dark-700 bg-secondary-50 dark:bg-dark-700 cursor-not-allowed"
                          value={profileForm.email}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                          Job Title
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-dark-700 bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
                          value={profileForm.role}
                          onChange={event => handleProfileChange('role', event.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-dark-700 bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
                          value={profileForm.phone}
                          onChange={event => handleProfileChange('phone', event.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Bio</label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-dark-700 bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
                        value={profileForm.bio}
                        onChange={event => handleProfileChange('bio', event.target.value)}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button variant="primary" leftIcon={<Ri.RiSaveLine />} onClick={handleSaveProfile} isLoading={profileSaving}>
                        Save Changes
                      </Button>
                    </div>
                    {profileSuccess && <p className="text-sm text-success">{profileSuccess}</p>}
                    {profileError && <p className="text-sm text-error">{profileError}</p>}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4 flex items-center">
                    <Ri.RiUploadCloud2Line className="mr-2 text-primary-500" />
                    File Upload Center
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uploadSectionTypes.map(uploadType => (
                      <div key={uploadType} className="rounded-lg border border-secondary-200 dark:border-dark-700 p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-base font-medium text-secondary-900 dark:text-white capitalize">{uploadType}</div>
                          <div className="text-xs px-2 py-1 rounded-md bg-primary-500/10 text-primary-500">
                            {`POST /uploads/${uploadType}`}
                          </div>
                        </div>
                        <p className="text-sm text-secondary-600 dark:text-secondary-300 mt-2">{uploadDescriptionMap[uploadType]}</p>
                        <input
                          type="file"
                          accept={uploadAcceptMap[uploadType]}
                          onChange={event => handleFileInputChange(event, uploadType)}
                          className="w-full mt-3 text-sm text-secondary-700 dark:text-secondary-200 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary-500/10 file:text-primary-500"
                        />
                        {uploadState[uploadType].uploading && (
                          <p className="text-xs mt-2 text-secondary-500">{`Uploading ${uploadType}...`}</p>
                        )}
                        {uploadState[uploadType].success && (
                          <p className="text-xs mt-2 text-success">{uploadState[uploadType].success}</p>
                        )}
                        {uploadState[uploadType].error && (
                          <p className="text-xs mt-2 text-error">{uploadState[uploadType].error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4 flex items-center">
                    <Ri.RiFolderOpenLine className="mr-2 text-primary-500" />
                    Uploaded Files by Type
                  </h3>
                  {loadingUploads && <p className="text-sm text-secondary-500">Loading files...</p>}
                  {uploadsError && <p className="text-sm text-error">{uploadsError}</p>}
                  {!loadingUploads && !uploadsError && (
                    <div className="space-y-4">
                      {uploadSectionTypes.map(uploadType => (
                        <div key={uploadType} className="rounded-lg border border-secondary-200 dark:border-dark-700">
                          <div className="px-4 py-3 border-b border-secondary-200 dark:border-dark-700 flex items-center justify-between">
                            <div className="font-medium capitalize text-secondary-900 dark:text-white">{uploadType}</div>
                            <div className="text-xs text-secondary-500">{`${uploads[uploadType].length} files`}</div>
                          </div>
                          <div className="p-4">
                            {uploads[uploadType].length === 0 && (
                              <p className="text-sm text-secondary-500">{`No ${uploadType} files uploaded yet.`}</p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {uploads[uploadType].map((file, index) => {
                                const fileUrl = getFileUrl(file);
                                return (
                                  <div
                                    key={file.id || `${uploadType}-${index}`}
                                    className="rounded-lg border border-secondary-200 dark:border-dark-700 p-3"
                                  >
                                    <button
                                      type="button"
                                      className="w-full text-left"
                                      onClick={() => openFilePreview(file)}
                                      disabled={!fileUrl}
                                    >
                                      <div className="w-full h-28 rounded-md overflow-hidden border border-secondary-200 dark:border-dark-700 bg-secondary-50 dark:bg-dark-800 flex items-center justify-center">
                                        {fileUrl && isImageFile(file) && (
                                          <img src={fileUrl} alt={getFileName(file)} className="w-full h-full object-cover" />
                                        )}
                                        {isPdfFile(file) && (
                                          <div className="flex flex-col items-center justify-center text-secondary-600 dark:text-secondary-300">
                                            <Ri.RiFilePdf2Line className="text-3xl text-red-500" />
                                            <span className="text-xs mt-1">PDF Preview</span>
                                          </div>
                                        )}
                                        {isDocFile(file) && (
                                          <div className="flex flex-col items-center justify-center text-secondary-600 dark:text-secondary-300">
                                            <Ri.RiFileWord2Line className="text-3xl text-blue-500" />
                                            <span className="text-xs mt-1">DOC Preview</span>
                                          </div>
                                        )}
                                        {!isImageFile(file) && !isPdfFile(file) && !isDocFile(file) && (
                                          <div className="flex flex-col items-center justify-center text-secondary-600 dark:text-secondary-300">
                                            <Ri.RiFileLine className="text-3xl" />
                                            <span className="text-xs mt-1">File Preview</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="mt-2">
                                        <div className="font-medium text-secondary-900 dark:text-white truncate text-sm">
                                          {getFileName(file)}
                                        </div>
                                        <div className="text-secondary-500 text-xs truncate">
                                          {`${getFileType(file)} • ${getFormattedSize(file.size)} • ${getFileDate(file)}`}
                                        </div>
                                      </div>
                                    </button>
                                    <div className="mt-2 flex items-center justify-between">
                                      {fileUrl ? (
                                        <button
                                          type="button"
                                          onClick={() => openFilePreview(file)}
                                          className="text-primary-500 hover:text-primary-400 flex items-center gap-1 text-xs"
                                        >
                                          <Ri.RiEyeLine />
                                          View Full
                                        </button>
                                      ) : (
                                        <div className="text-error text-xs flex items-center gap-1">
                                          <Ri.RiErrorWarningLine />
                                          URL Missing
                                        </div>
                                      )}
                                      {fileUrl && (
                                        <a
                                          href={fileUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-secondary-600 dark:text-secondary-300 hover:text-primary-500 flex items-center gap-1 text-xs"
                                        >
                                          <Ri.RiExternalLinkLine />
                                          Open Tab
                                        </a>
                                      )}
                                    </div>
                                    <div className="sr-only">
                                        {getFileName(file)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeCategory === 'appearance' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-secondary-900 dark:text-white">Appearance</h2>
                <div className="flex items-center space-x-2">
                  <button
                    className={`px-4 py-2 rounded-lg text-sm flex items-center ${
                      !darkMode
                        ? 'bg-primary-500/10 text-primary-500 font-medium'
                        : 'text-secondary-600 dark:text-secondary-400 hover:bg-dark-800/50'
                    }`}
                    onClick={() => {
                      if (darkMode) toggleDarkMode();
                    }}
                  >
                    {!darkMode && <Ri.RiCheckLine className="mr-1" />}
                    Light
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm flex items-center ${
                      darkMode
                        ? 'bg-primary-500/10 text-primary-500 font-medium'
                        : 'text-secondary-600 dark:text-secondary-400 hover:bg-dark-800/50'
                    }`}
                    onClick={() => {
                      if (!darkMode) toggleDarkMode();
                    }}
                  >
                    {darkMode && <Ri.RiCheckLine className="mr-1" />}
                    Dark
                  </button>
                </div>
              </div>
            )}

            {activeCategory === 'language' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-secondary-900 dark:text-white">Language</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      className={`px-4 py-3 rounded-lg flex items-center ${
                        language === lang.code
                          ? 'bg-primary-500/10 text-primary-500 font-medium'
                          : 'hover:bg-secondary-100 dark:hover:bg-dark-800/50'
                      }`}
                      onClick={() => changeLanguage(lang.code)}
                    >
                      <div className="w-6 h-6 mr-3 flex-shrink-0">
                        <img src={lang.flag} alt={lang.name} className="w-full h-full object-cover rounded-sm" />
                      </div>
                      <div>{lang.name}</div>
                      {language === lang.code && (
                        <div className="ml-auto">
                          <Ri.RiCheckLine />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeCategory === 'privacy' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-secondary-900 dark:text-white flex items-center">
                  <Ri.RiShieldLine className="mr-2 text-primary-500" />
                  Privacy & Security
                </h2>
                <div className="rounded-lg border border-secondary-200 dark:border-dark-700 p-4">
                  <div className="text-sm text-secondary-600 dark:text-secondary-300">
                    Your uploads endpoints require Bearer token authentication and are called with the stored JWT token.
                  </div>
                  <div className="mt-3 text-sm text-secondary-700 dark:text-secondary-200">
                    <div>{`GET ${API_BASE_URL}/uploads`}</div>
                    <div>{`POST ${API_BASE_URL}/uploads/signature`}</div>
                    <div>{`POST ${API_BASE_URL}/uploads/attachment`}</div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
    {activePreview ? (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
        <div className="w-full max-w-5xl bg-white dark:bg-dark-900 rounded-xl border border-secondary-200 dark:border-dark-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-secondary-200 dark:border-dark-700 flex items-center justify-between">
            <div className="min-w-0">
              <div className="font-semibold text-secondary-900 dark:text-white truncate">{getFileName(activePreview.file)}</div>
              <div className="text-xs text-secondary-500 truncate">{`${getFileType(activePreview.file)} • ${getFormattedSize(activePreview.file.size)}`}</div>
            </div>
            <button
              type="button"
              onClick={() => setActivePreview(null)}
              className="p-2 rounded-md hover:bg-secondary-100 dark:hover:bg-dark-800"
            >
              <Ri.RiCloseLine className="text-lg text-secondary-600 dark:text-secondary-300" />
            </button>
          </div>
          <div className="p-4">
            {isImageFile(activePreview.file) && (
              <div className="w-full h-[70vh] bg-secondary-50 dark:bg-dark-800 rounded-lg overflow-hidden border border-secondary-200 dark:border-dark-700">
                <img src={activePreview.url} alt={getFileName(activePreview.file)} className="w-full h-full object-contain" />
              </div>
            )}
            {isPdfFile(activePreview.file) && (
              <iframe
                title="full-pdf-preview"
                src={`${activePreview.url}#view=FitH`}
                className="w-full h-[70vh] rounded-lg border border-secondary-200 dark:border-dark-700"
              />
            )}
            {isDocFile(activePreview.file) && (
              <iframe
                title="full-doc-preview"
                src={getDocumentViewerUrl(activePreview.url)}
                className="w-full h-[70vh] rounded-lg border border-secondary-200 dark:border-dark-700"
              />
            )}
            {!isImageFile(activePreview.file) && !isPdfFile(activePreview.file) && !isDocFile(activePreview.file) && (
              <div className="h-[40vh] rounded-lg border border-dashed border-secondary-300 dark:border-dark-600 flex items-center justify-center">
                <a
                  href={activePreview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-500 hover:text-primary-400 flex items-center gap-2"
                >
                  <Ri.RiExternalLinkLine />
                  Open file in new tab
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
};

export default SettingsPage;
