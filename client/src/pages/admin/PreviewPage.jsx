import { useMemo, useState } from 'react';
import { ExternalLink, Monitor, RefreshCw, Smartphone, Tablet } from 'lucide-react';

const devices = {
  desktop: {
    label: 'Desktop',
    width: 1440,
    icon: Monitor
  },
  tablet: {
    label: 'Tablet',
    width: 820,
    icon: Tablet
  },
  mobile: {
    label: 'Mobile',
    width: 390,
    icon: Smartphone
  }
};

export default function PreviewPage() {
  const [device, setDevice] = useState('desktop');
  const [reloadKey, setReloadKey] = useState(0);
  const active = devices[device];
  const previewUrl = useMemo(() => `/?preview=${reloadKey}`, [reloadKey]);

  return (
    <section className="preview-page">
      <div className="preview-header">
        <div>
          <h1 className="admin-title">Preview</h1>
          <p className="text-muted">Review the live portfolio without leaving the admin panel.</p>
        </div>
        <div className="preview-actions">
          <div className="preview-segment" aria-label="Preview device size">
            {Object.entries(devices).map(([key, item]) => {
              const Icon = item.icon;
              return (
                <button key={key} className={device === key ? 'active' : ''} type="button" onClick={() => setDevice(key)}>
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <button className="icon-button" type="button" onClick={() => setReloadKey((key) => key + 1)} aria-label="Refresh preview">
            <RefreshCw className="h-4 w-4" />
          </button>
          <a className="icon-button" href="/" target="_blank" rel="noreferrer" aria-label="Open portfolio in new tab">
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
      <div className="preview-stage">
        <div className="preview-frame-shell" style={{ width: `min(100%, ${active.width}px)` }}>
          <div className="preview-frame-bar">
            <span>{active.label}</span>
            <span>{active.width}px</span>
          </div>
          <iframe key={reloadKey} title="Portfolio preview" src={previewUrl} />
        </div>
      </div>
    </section>
  );
}
