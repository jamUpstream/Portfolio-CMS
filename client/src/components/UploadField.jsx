import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, Image, Link as LinkIcon, Loader2, Square, Trash2, Upload } from 'lucide-react';
import { api } from '../lib/api';

function isImageUrl(value) {
  return /\.(apng|avif|gif|jpe?g|png|svg|webp|ico)(\?.*)?$/i.test(value || '');
}

function acceptForBucket(bucket) {
  if (bucket === 'resumes') return '.pdf,.doc,.docx';
  if (bucket === 'og-images' || bucket === 'avatars' || bucket === 'project-covers' || bucket === 'logos' || bucket === 'certificates' || bucket === 'icons') {
    return 'image/*,.ico';
  }
  return undefined;
}

export default function UploadField({ label, value, onChange, bucket, variant = 'default' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFileName(file.name);
    try {
      const result = await api.upload(file, bucket);
      onChange(result.url);
      toast.success(`${label} uploaded`);
    } catch (error) {
      toast.error(error.message);
      setFileName('');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  function clearFile() {
    onChange('');
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  }

  const hasValue = Boolean(value);
  const imagePreview = variant !== 'favicon' && hasValue && isImageUrl(value);

  return (
    <div className="field upload-field">
      <span>{label}</span>
      <div className="upload-control">
        <div className="upload-preview">
          {imagePreview ? (
            <img src={value} alt={`${label} preview`} />
          ) : variant === 'favicon' ? (
            <Square className="h-6 w-6" />
          ) : hasValue ? (
            <a href={value} target="_blank" rel="noreferrer" aria-label={`Open ${label}`}>
              <FileText className="h-6 w-6" />
            </a>
          ) : (
            <Image className="h-6 w-6" />
          )}
        </div>
        <div className="upload-body">
          <input className="input" value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder="https://..." />
          <div className="upload-actions">
            <input ref={inputRef} className="sr-only" type="file" accept={acceptForBucket(bucket)} onChange={handleUpload} disabled={uploading} />
            <button className="button secondary upload-button" type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading...' : 'Choose file'}
            </button>
            {hasValue ? (
              <a className="icon-button" href={value} target="_blank" rel="noreferrer" aria-label={`Open ${label}`}>
                <LinkIcon className="h-4 w-4" />
              </a>
            ) : null}
            {hasValue ? (
              <button className="icon-button danger" type="button" onClick={clearFile} aria-label={`Remove ${label}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
            <span className="upload-file-name">{fileName || (hasValue ? 'File linked' : 'No file selected')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
