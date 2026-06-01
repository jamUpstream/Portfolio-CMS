import { useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, Image, Link as LinkIcon, Loader2, Plus, Trash2, Upload } from 'lucide-react';
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

export default function MultiUploadField({ label, value, onChange, bucket, maxFiles = 5 }) {
  const [uploadingIndex, setUploadingIndex] = useState(-1);
  const [lastFileName, setLastFileName] = useState('');

  const files = Array.isArray(value) ? value : [];

  function setFileAt(index, nextValue) {
    const next = [...files];
    next[index] = nextValue;
    onChange(next.map((item) => String(item || '').trim()).filter(Boolean).slice(0, maxFiles));
  }

  function removeFileAt(index) {
    const next = files.filter((_, itemIndex) => itemIndex !== index);
    onChange(next);
  }

  function addSlot() {
    if (files.length >= maxFiles) return;
    onChange([...files, '']);
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    const index = Number(event.target.dataset.index ?? -1);
    if (!file || index < 0) return;

    setUploadingIndex(index);
    setLastFileName(file.name);

    try {
      const result = await api.upload(file, bucket);
      const next = [...files];
      next[index] = result.url;
      onChange(next.map((item) => String(item || '').trim()).filter(Boolean).slice(0, maxFiles));
      toast.success(`${label} image uploaded`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploadingIndex(-1);
      event.target.value = '';
    }
  }

  return (
    <div className="field upload-field">
      <span>{label}</span>
      <div className="multi-upload-list">
        {files.map((item, index) => (
          <div className="upload-control" key={`${item}-${index}`}>
            <div className="upload-preview">
              {isImageUrl(item) ? (
                <img src={item} alt={`${label} ${index + 1}`} />
              ) : item ? (
                <a href={item} target="_blank" rel="noreferrer" aria-label={`Open ${label} ${index + 1}`}>
                  <FileText className="h-6 w-6" />
                </a>
              ) : (
                <Image className="h-6 w-6" />
              )}
            </div>
            <div className="upload-body">
              <input
                className="input"
                value={item || ''}
                onChange={(event) => setFileAt(index, event.target.value)}
                placeholder="https://..."
              />
              <div className="upload-actions">
                <button
                  className="button secondary upload-button"
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = acceptForBucket(bucket) || '';
                    input.dataset.index = String(index);
                    input.onchange = handleUpload;
                    input.click();
                  }}
                  disabled={uploadingIndex === index}
                >
                  {uploadingIndex === index ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploadingIndex === index ? 'Uploading...' : 'Choose file'}
                </button>
                {item ? (
                  <a className="icon-button" href={item} target="_blank" rel="noreferrer" aria-label={`Open ${label} ${index + 1}`}>
                    <LinkIcon className="h-4 w-4" />
                  </a>
                ) : null}
                <button className="icon-button danger" type="button" onClick={() => removeFileAt(index)} aria-label={`Remove ${label} ${index + 1}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
                <span className="upload-file-name">{uploadingIndex === index ? lastFileName : `Image ${index + 1}`}</span>
              </div>
            </div>
          </div>
        ))}
        {files.length < maxFiles ? (
          <button className="button secondary compact-button" type="button" onClick={addSlot}>
            <Plus className="h-4 w-4" /> Add image ({files.length}/{maxFiles})
          </button>
        ) : (
          <small className="field-hint">Maximum of {maxFiles} images reached.</small>
        )}
      </div>
    </div>
  );
}
