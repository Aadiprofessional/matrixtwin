import React, { useEffect, useMemo, useState } from 'react';
import * as Ri from 'react-icons/ri';
import { Button } from '../ui/Button';
import { API_BASE_URL } from '../../utils/api';

type UploadType = 'signature' | 'attachment' | 'image' | 'pic';
type PickerMode = 'upload' | 'existing';

interface UploadRecord {
  id: string;
  type: UploadType;
  name: string;
  url: string;
  mimeType: string;
  size?: number;
  createdAt: string;
}

interface TemplateUploadPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, file: UploadRecord) => void;
  title?: string;
  uploadType?: UploadType;
  allowedTypes?: UploadType[];
  accept?: string;
}

const defaultAllowedTypes: UploadType[] = ['signature', 'attachment', 'image', 'pic'];

export const TemplateUploadPickerModal: React.FC<TemplateUploadPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Choose File',
  uploadType = 'image',
  allowedTypes = defaultAllowedTypes,
  accept = 'image/*'
}) => {
  const [mode, setMode] = useState<PickerMode>('upload');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [groupedFiles, setGroupedFiles] = useState<Record<UploadType, UploadRecord[]>>({
    signature: [],
    attachment: [],
    image: [],
    pic: []
  });
  const [selectedExistingId, setSelectedExistingId] = useState('');
  const [latestUploadedId, setLatestUploadedId] = useState('');

  const token = localStorage.getItem('token');

  const sanitizeUrl = (value: string) => value.trim().replace(/[`'"]/g, '');

  const normalizeRecord = (record: any, type: UploadType): UploadRecord => {
    const url = sanitizeUrl(record.file_url || record.fileUrl || record.url || '');
    return {
      id: String(record.id || url || `${type}-${Math.random().toString(36).slice(2)}`),
      type,
      name: record.original_name || record.originalname || record.fileName || record.name || 'Uploaded file',
      url,
      mimeType: record.mime_type || record.mimetype || record.mimeType || '',
      size: typeof record.size === 'number' ? record.size : undefined,
      createdAt: record.created_at || record.createdAt || record.updated_at || record.updatedAt || ''
    };
  };

  const toUploadType = (value: any): UploadType | null => {
    const typeValue = String(value || '').toLowerCase();
    if (typeValue === 'signature' || typeValue === 'attachment' || typeValue === 'image' || typeValue === 'pic') {
      return typeValue;
    }
    return null;
  };

  const loadExistingFiles = async () => {
    if (!token) {
      setError('Missing auth token. Please sign in again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/uploads`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message || body?.error || 'Failed to load uploaded files');
      }
      const payload = body?.data || body || {};
      const nextState: Record<UploadType, UploadRecord[]> = {
        signature: [],
        attachment: [],
        image: [],
        pic: []
      };

      if (Array.isArray(payload)) {
        payload.forEach(item => {
          const itemType = toUploadType(item?.type || item?.uploadType);
          if (!itemType) return;
          nextState[itemType].push(normalizeRecord(item, itemType));
        });
      } else {
        (Object.keys(nextState) as UploadType[]).forEach(type => {
          if (Array.isArray(payload[type])) {
            nextState[type] = payload[type].map((item: any) => normalizeRecord(item, type));
          }
        });

        const embeddedCollections = [payload?.uploads, payload?.files, payload?.items];
        embeddedCollections.forEach(collection => {
          if (!Array.isArray(collection)) return;
          collection.forEach(item => {
            const itemType = toUploadType(item?.type || item?.uploadType);
            if (!itemType) return;
            nextState[itemType].push(normalizeRecord(item, itemType));
          });
        });
      }
      setGroupedFiles(nextState);
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setMode('upload');
    setSelectedFile(null);
    setSelectedExistingId('');
    setSuccess('');
    setError('');
    setLatestUploadedId('');
    loadExistingFiles();
  }, [isOpen]);

  const existingFiles = useMemo(() => {
    const files = allowedTypes.flatMap(type => groupedFiles[type] || []);
    const sorted = [...files].sort((a, b) => {
      if (a.id === latestUploadedId) return -1;
      if (b.id === latestUploadedId) return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return sorted;
  }, [allowedTypes, groupedFiles, latestUploadedId]);

  const isImage = (file: UploadRecord) => file.mimeType.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name);
  const isPdf = (file: UploadRecord) => file.mimeType.includes('pdf') || /\.pdf$/i.test(file.name);
  const isDoc = (file: UploadRecord) =>
    file.mimeType.includes('msword') || file.mimeType.includes('officedocument.wordprocessingml.document') || /\.(doc|docx)$/i.test(file.name);

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!token) {
      setError('Missing auth token. Please sign in again.');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetch(`${API_BASE_URL}/uploads/${uploadType}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message || body?.error || `Failed to upload ${uploadType}`);
      }
      const uploaded = body?.data || body?.file || body || {};
      const normalizedUploaded = normalizeRecord(uploaded, uploadType);
      setLatestUploadedId(normalizedUploaded.id);
      setSelectedExistingId(normalizedUploaded.id);
      setSuccess(`${selectedFile.name} uploaded`);
      await loadExistingFiles();
      setMode('existing');
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleUseSelected = () => {
    const selected = existingFiles.find(file => file.id === selectedExistingId);
    if (!selected) return;
    onSelect(selected.url, selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white dark:bg-dark-900 rounded-xl border border-secondary-200 dark:border-dark-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-secondary-200 dark:border-dark-700 flex items-center justify-between">
          <h3 className="font-semibold text-secondary-900 dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md hover:bg-secondary-100 dark:hover:bg-dark-800"
          >
            <Ri.RiCloseLine className="text-lg text-secondary-700 dark:text-secondary-200" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-secondary-200 dark:border-dark-700 flex items-center gap-2">
          <Button
            variant={mode === 'upload' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setMode('upload')}
            leftIcon={<Ri.RiUploadCloud2Line />}
          >
            Upload New
          </Button>
          <Button
            variant={mode === 'existing' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setMode('existing')}
            leftIcon={<Ri.RiFolderOpenLine />}
          >
            Use Existing
          </Button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-auto">
          {mode === 'upload' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-secondary-200 dark:border-dark-700 p-4">
                <div className="text-sm text-secondary-700 dark:text-secondary-200 mb-3">{`Upload endpoint: ${API_BASE_URL}/uploads/${uploadType}`}</div>
                <input
                  type="file"
                  accept={accept}
                  onChange={event => setSelectedFile(event.target.files?.[0] || null)}
                  className="w-full text-sm text-secondary-700 dark:text-secondary-200 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary-500/10 file:text-primary-500"
                />
                {selectedFile && <div className="text-xs text-secondary-500 mt-2">{selectedFile.name}</div>}
                <div className="mt-3 flex justify-end">
                  <Button variant="primary" size="sm" onClick={handleUpload} isLoading={uploading} disabled={!selectedFile}>
                    Upload
                  </Button>
                </div>
              </div>
              {success && <p className="text-sm text-success">{success}</p>}
            </div>
          )}

          {mode === 'existing' && (
            <div>
              {loading && <p className="text-sm text-secondary-500">Loading files...</p>}
              {!loading && existingFiles.length === 0 && (
                <p className="text-sm text-secondary-500">No existing files found for this picker.</p>
              )}
              {!loading && existingFiles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {existingFiles.map(file => (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => setSelectedExistingId(file.id)}
                      className={`rounded-lg border p-3 text-left ${
                        selectedExistingId === file.id
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-secondary-200 dark:border-dark-700 hover:border-primary-400'
                      }`}
                    >
                      <div className="w-full h-24 rounded-md overflow-hidden border border-secondary-200 dark:border-dark-700 bg-secondary-50 dark:bg-dark-800 flex items-center justify-center">
                        {isImage(file) && <img src={file.url} alt={file.name} className="w-full h-full object-cover" />}
                        {isPdf(file) && (
                          <div className="flex flex-col items-center text-secondary-600 dark:text-secondary-300">
                            <Ri.RiFilePdf2Line className="text-2xl text-red-500" />
                            <span className="text-[11px]">PDF</span>
                          </div>
                        )}
                        {isDoc(file) && (
                          <div className="flex flex-col items-center text-secondary-600 dark:text-secondary-300">
                            <Ri.RiFileWord2Line className="text-2xl text-blue-500" />
                            <span className="text-[11px]">DOC</span>
                          </div>
                        )}
                        {!isImage(file) && !isPdf(file) && !isDoc(file) && (
                          <div className="flex flex-col items-center text-secondary-600 dark:text-secondary-300">
                            <Ri.RiFileLine className="text-2xl" />
                            <span className="text-[11px]">FILE</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-xs font-medium text-secondary-900 dark:text-white truncate">{file.name}</div>
                      <div className="text-[11px] text-secondary-500 capitalize">{file.type}</div>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <Button variant="primary" size="sm" onClick={handleUseSelected} disabled={!selectedExistingId}>
                  Use Selected
                </Button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-error mt-3">{error}</p>}
        </div>
      </div>
    </div>
  );
};
