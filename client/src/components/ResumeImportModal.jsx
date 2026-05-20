import { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Award,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  GraduationCap,
  Plus,
  Trash2,
  Upload,
  User,
  Wrench,
  X
} from 'lucide-react';
import { api } from '../lib/api';

const emptyImport = {
  profile: {},
  experience: [],
  education: [],
  skills: [],
  certificates: []
};

const profileFields = [
  ['name', 'Name'],
  ['tagline', 'Tagline'],
  ['bio', 'Bio', 'textarea'],
  ['email', 'Email'],
  ['location', 'Location'],
  ['availability_status', 'Availability Status']
];

const arraySections = {
  experience: {
    label: 'Experience',
    icon: Briefcase,
    defaultItem: { role: '', company: '', location: '', start_date: '', end_date: '', employment_type: '', description: '' },
    fields: [
      ['role', 'Role'],
      ['company', 'Company'],
      ['location', 'Location'],
      ['start_date', 'Start Date', 'text', '2024, 2024-08, or 2024-08-17'],
      ['end_date', 'End Date', 'text', '2024, 2024-08, 2024-08-17, or Present'],
      ['employment_type', 'Employment Type'],
      ['description', 'Description', 'textarea']
    ]
  },
  education: {
    label: 'Education',
    icon: GraduationCap,
    defaultItem: { institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', description: '' },
    fields: [
      ['institution', 'Institution'],
      ['degree', 'Degree'],
      ['field_of_study', 'Field of Study'],
      ['start_date', 'Start Date', 'text', '2024, 2024-08, or 2024-08-17'],
      ['end_date', 'End Date', 'text', '2024, 2024-08, 2024-08-17, or Present'],
      ['description', 'Description', 'textarea']
    ]
  },
  skills: {
    label: 'Skills',
    icon: Wrench,
    defaultItem: { name: '', category: '', proficiency: '4' },
    fields: [
      ['name', 'Name'],
      ['category', 'Category'],
      ['proficiency', 'Proficiency', 'number']
    ]
  },
  certificates: {
    label: 'Certificates',
    icon: Award,
    defaultItem: { title: '', issuer: '', issue_date: '', expiry_date: '', credential_url: '' },
    fields: [
      ['title', 'Title'],
      ['issuer', 'Issuer'],
      ['issue_date', 'Issue Date', 'text', '2024, 2024-08, or 2024-08-17'],
      ['expiry_date', 'Expiry Date', 'text', '2024, 2024-08, 2024-08-17, or Present'],
      ['credential_url', 'Credential URL']
    ]
  }
};

const singularLabels = {
  experience: 'Experience',
  education: 'Education',
  skills: 'Skill',
  certificates: 'Certificate'
};

function stripEmpty(value) {
  return Object.fromEntries(
    Object.entries(value ?? {}).filter(([, entry]) => entry !== '' && entry != null)
  );
}

function cleanItems(items) {
  return (items ?? [])
    .map((item) => stripEmpty(item))
    .filter((item) => Object.keys(item).length > 0);
}

function profileCount(profile) {
  return Object.values(profile ?? {}).filter((value) => String(value ?? '').trim()).length;
}

function FieldControl({ label, value, onChange, type = 'text', placeholder = '' }) {
  const isTextarea = type === 'textarea';
  return (
    <label className={`resume-import-field ${isTextarea ? 'full' : ''}`}>
      <span>{label}</span>
      {isTextarea ? (
        <textarea
          className="input"
          value={value ?? ''}
          placeholder={placeholder}
          rows={5}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="input"
          type={type}
          min={type === 'number' ? 1 : undefined}
          max={type === 'number' ? 5 : undefined}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function SectionPill({ id, label, count, icon: Icon, active, onClick }) {
  return (
    <button
      className={`resume-import-tab ${active ? 'active' : ''}`}
      type="button"
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      <strong>{count}</strong>
    </button>
  );
}

export default function ResumeImportModal({ open, onClose }) {
  const fileInputRef = useRef(null);
  const sectionRefs = useRef({});
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(emptyImport);
  const [step, setStep] = useState('upload');
  const [activeSection, setActiveSection] = useState('profile');
  const [openSections, setOpenSections] = useState({
    profile: true,
    experience: true,
    education: true,
    skills: true,
    certificates: true
  });

  const counts = useMemo(() => ({
    profile: profileCount(draft.profile),
    experience: draft.experience.length,
    education: draft.education.length,
    skills: draft.skills.length,
    certificates: draft.certificates.length
  }), [draft]);

  const hasDraft = useMemo(() => (
    counts.profile + counts.experience + counts.education + counts.skills + counts.certificates > 0
  ), [counts]);

  if (!open) return null;

  function resetState() {
    setFile(null);
    setDragActive(false);
    setDraft(emptyImport);
    setStep('upload');
    setActiveSection('profile');
    setOpenSections({ profile: true, experience: true, education: true, skills: true, certificates: true });
  }

  function handleClose() {
    onClose();
    setTimeout(resetState, 200);
  }

  function chooseFile(nextFile) {
    if (!nextFile) return;
    const name = nextFile.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.txt')) {
      toast.error('Use a PDF or TXT resume file.');
      return;
    }
    setFile(nextFile);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    chooseFile(event.dataTransfer.files?.[0]);
  }

  async function importResume() {
    if (!file) {
      toast.error('Choose a PDF or TXT resume first.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.importResume(file);
      setDraft({ ...emptyImport, ...(result.extracted ?? {}) });
      setStep('review');
      setActiveSection('profile');
      setOpenSections({ profile: true, experience: true, education: true, skills: true, certificates: true });
      toast.success('Resume mapped. Review and edit before saving.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveImport() {
    setSaving(true);
    try {
      const profile = stripEmpty(draft.profile);
      const experience = cleanItems(draft.experience);
      const education = cleanItems(draft.education);
      const skills = cleanItems(draft.skills);
      const certificates = cleanItems(draft.certificates);

      if (Object.keys(profile).length) await api.patch('/profile', profile);
      await Promise.all([
        ...experience.map((item, index) => api.post('/experience', { ...item, sort_order: index + 1 })),
        ...education.map((item, index) => api.post('/education', { ...item, sort_order: index + 1 })),
        ...skills.map((item, index) => api.post('/skills', { ...item, sort_order: index + 1 })),
        ...certificates.map((item, index) => api.post('/certificates', { ...item, sort_order: index + 1 }))
      ]);

      toast.success('Resume imported successfully.');
      handleClose();
      window.location.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  function updateProfile(field, value) {
    setDraft((current) => ({
      ...current,
      profile: { ...current.profile, [field]: value }
    }));
  }

  function updateItem(section, index, field, value) {
    setDraft((current) => ({
      ...current,
      [section]: current[section].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    }));
  }

  function addItem(section) {
    setDraft((current) => ({
      ...current,
      [section]: [...current[section], { ...arraySections[section].defaultItem }]
    }));
  }

  function removeItem(section, index) {
    setDraft((current) => ({
      ...current,
      [section]: current[section].filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function jumpToSection(section) {
    setActiveSection(section);
    setOpenSections((current) => ({ ...current, [section]: true }));
    sectionRefs.current[section]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function toggleSection(section) {
    setActiveSection(section);
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  const totalItems = (counts.profile ? 1 : 0) + counts.experience + counts.education + counts.skills + counts.certificates;

  return (
    <div className="admin-form-modal-layer" role="presentation">
      <button className="admin-form-modal-backdrop" type="button" onClick={handleClose} aria-label="Close import" />
      <section className="admin-form-modal resume-import-modal" role="dialog" aria-modal="true" aria-labelledby="resume-import-title">
        <div className="admin-form-modal-header resume-import-header">
          <div className="resume-import-title-block">
            <h2 id="resume-import-title" className="font-heading">Import Resume</h2>
            <div className="resume-import-steps" aria-label="Import progress">
              <span className={`resume-step ${step === 'upload' ? 'active' : 'done'}`}>
                {step === 'review' ? <CheckCircle2 className="h-3.5 w-3.5" /> : '1'}
                Upload
              </span>
              <ChevronRight className="h-3.5 w-3.5 resume-step-arrow" />
              <span className={`resume-step ${step === 'review' ? 'active' : ''}`}>
                2 Review &amp; Save
              </span>
            </div>
          </div>
          <button className="icon-button resume-import-close" type="button" onClick={handleClose} aria-label="Close import">
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 'upload' ? (
          <>
            <div className="admin-form-modal-body resume-import-body">
              <button
                className={`resume-drop-zone ${dragActive ? 'is-dragging' : ''}`}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <FileText className="h-9 w-9" />
                <span className="resume-drop-copy">
                  <strong>{file ? file.name : 'Drop your resume here'}</strong>
                  <small>
                    {file ? `${(file.size / 1024).toFixed(1)} KB - ready to map` : 'or click to browse - accepts .pdf or .txt'}
                  </small>
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,text/plain,application/pdf"
                className="resume-drop-input"
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />

              <p className="resume-upload-hint">
                <AlertCircle className="h-4 w-4" />
                <span>AI will extract your profile, experience, education, skills, and certificates. You can edit everything before saving.</span>
              </p>
            </div>

            <div className="admin-form-modal-actions resume-import-actions">
              <button className="button secondary" type="button" onClick={handleClose}>Cancel</button>
              <button className="button" type="button" disabled={loading || !file} onClick={importResume}>
                <Upload className="h-4 w-4" />
                {loading ? 'Mapping with AI...' : 'Map with AI'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="admin-form-modal-body resume-import-body resume-review-body">
              <div className="resume-import-tabs" role="tablist" aria-label="Imported resume sections">
                <SectionPill id="profile" icon={User} label="Profile" count={counts.profile} active={activeSection === 'profile'} onClick={() => jumpToSection('profile')} />
                {Object.entries(arraySections).map(([section, config]) => (
                  <SectionPill
                    key={section}
                    id={section}
                    icon={config.icon}
                    label={config.label}
                    count={counts[section]}
                    active={activeSection === section}
                    onClick={() => jumpToSection(section)}
                  />
                ))}
              </div>

              <div className="resume-review-sections">
                <section
                  className={`resume-review-section ${openSections.profile ? 'is-open' : ''}`}
                  ref={(node) => { sectionRefs.current.profile = node; }}
                >
                  <button className="resume-review-section-header" type="button" onClick={() => toggleSection('profile')}>
                    <span><User className="h-4 w-4" /> Profile</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {openSections.profile ? (
                    <div className="resume-section-body resume-edit-grid">
                      {profileFields.map(([field, label, type]) => (
                        <FieldControl
                          key={field}
                          label={label}
                          type={type}
                          value={draft.profile[field]}
                          onChange={(value) => updateProfile(field, value)}
                        />
                      ))}
                    </div>
                  ) : null}
                </section>

                {Object.entries(arraySections).map(([section, config]) => {
                  const Icon = config.icon;
                  return (
                    <section
                      key={section}
                      className={`resume-review-section ${openSections[section] ? 'is-open' : ''}`}
                      ref={(node) => { sectionRefs.current[section] = node; }}
                    >
                      <button className="resume-review-section-header" type="button" onClick={() => toggleSection(section)}>
                        <span><Icon className="h-4 w-4" /> {config.label} ({draft[section].length})</span>
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      {openSections[section] ? (
                        <div className="resume-section-body resume-list-editor">
                          {draft[section].length === 0 ? (
                            <p className="resume-empty-hint">No imported {config.label.toLowerCase()} yet.</p>
                          ) : null}

                          {draft[section].map((item, index) => (
                            <div key={`${section}-${index}`} className="resume-list-item">
                              <div className="resume-list-item-header">
                                <span>#{index + 1}</span>
                                <button
                                  className="icon-button danger"
                                  type="button"
                                  onClick={() => removeItem(section, index)}
                                  aria-label={`Remove ${config.label} item ${index + 1}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="resume-edit-grid">
                                {config.fields.map(([field, label, type, placeholder]) => (
                                  <FieldControl
                                    key={field}
                                    label={label}
                                    type={type}
                                    placeholder={placeholder}
                                    value={item[field]}
                                    onChange={(value) => updateItem(section, index, field, value)}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}

                          <button className="button secondary compact-button resume-add-item" type="button" onClick={() => addItem(section)}>
                            <Plus className="h-4 w-4" /> Add {singularLabels[section]}
                          </button>
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            </div>

            <div className="admin-form-modal-actions resume-import-actions">
              <button className="button secondary" type="button" onClick={() => setStep('upload')}>Back</button>
              <button className="button" type="button" disabled={saving || !hasDraft} onClick={saveImport}>
                {saving ? 'Saving...' : `Save ${totalItems || 0} item${totalItems === 1 ? '' : 's'}`}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
