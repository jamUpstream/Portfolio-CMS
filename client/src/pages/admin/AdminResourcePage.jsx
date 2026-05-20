import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import { api } from '../../lib/api';
import { normalizePayload, resources, toFormValues } from '../../lib/resources';
import RichTextEditor from '../../components/RichTextEditor';
import SortableTable from '../../components/SortableTable';
import UploadField from '../../components/UploadField';
import Skeleton from '../../components/Skeleton';
import ConfirmDialog from '../../components/ConfirmDialog';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminResourcePage({ resourceKey }) {
  const config = resources[resourceKey];
  const visibleColumns = useMemo(() => config.columns.filter((column) => column !== 'sort_order'), [config]);
  const formFields = useMemo(() => Object.keys(config.schema.shape).filter((name) => name !== 'sort_order'), [config]);
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDelete, setBulkDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const lastError = useRef('');
  const defaults = useMemo(() => Object.fromEntries(Object.keys(config.schema.shape).map((key) => [key, key === 'status' ? 'draft' : ''])), [config]);

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(config.schema),
    defaultValues: defaults
  });

  const watchedTitle = watch('title');
  const watchedSlug = watch('slug');

  useEffect(() => {
    if (resourceKey !== 'projects' || slugManuallyEdited) return;
    if (editing && watchedSlug) return;

    const nextSlug = slugify(watchedTitle);
    if (nextSlug !== watchedSlug) {
      setValue('slug', nextSlug, { shouldDirty: true, shouldValidate: true });
    }
  }, [editing, resourceKey, setValue, slugManuallyEdited, watchedSlug, watchedTitle]);

  useEffect(() => {
    setLoading(true);
    api.getAuth(`/admin/${resourceKey}`).then((data) => {
      setRows(data);
      setLoading(false);
      setEditing(null);
      setFormOpen(false);
      setSlugManuallyEdited(false);
      reset(defaults);
    }).catch((error) => {
      if (lastError.current !== error.message) {
        lastError.current = error.message;
        toast.error(error.message);
      }
      setLoading(false);
    });
  }, [config.path, defaults, reset]);

  function edit(row) {
    setEditing(row);
    setSlugManuallyEdited(Boolean(row?.slug));
    reset(toFormValues(row));
    setFormOpen(true);
  }

  function createNew() {
    setEditing(null);
    setSlugManuallyEdited(false);
    reset(defaults);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setSlugManuallyEdited(false);
    reset(defaults);
  }

  async function save(values) {
    const payload = normalizePayload(resourceKey, values);
    try {
      const saved = editing
        ? await api.patch(`${config.path}/${editing.id}`, payload)
        : await api.post(config.path, payload);
      setRows((current) => editing ? current.map((row) => (row.id === saved.id ? saved : row)) : [...current, saved]);
      toast.success(`${config.singular} saved`);
      closeForm();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function remove() {
    const targets = bulkDelete?.rows ?? (deleteTarget ? [deleteTarget] : []);
    if (!targets.length) return;

    setDeleting(true);
    try {
      await Promise.all(targets.map((row) => api.delete(`${config.path}/${row.id}`)));
      const targetIds = targets.map((row) => row.id);
      setRows((current) => current.filter((item) => !targetIds.includes(item.id)));
      if (editing && targetIds.includes(editing.id)) closeForm();
      toast.success(targets.length === 1 ? 'Deleted' : `${targets.length} items deleted`);
      setDeleteTarget(null);
      bulkDelete?.onDone?.();
      setBulkDelete(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  }

  async function reorder(nextRows) {
    setRows(nextRows);
    await Promise.all(nextRows.map((row, index) => api.patch(`${config.path}/${row.id}`, { sort_order: index + 1 })));
    toast.success('Order saved');
  }

  if (loading) return <Skeleton />;

  const formTitle = editing ? `Edit ${config.singular}` : `New ${config.singular}`;

  return (
    <section className="admin-resource-grid">
      <div className="min-w-0">
        <div className="admin-section-heading">
          <h1 className="admin-title">{config.label}</h1>
          <button className="button" type="button" onClick={createNew}><Plus className="h-4 w-4" /> New</button>
        </div>
        <SortableTable
          rows={rows}
          columns={visibleColumns}
          onEdit={edit}
          onDelete={setDeleteTarget}
          onBulkDelete={(selectedRows, onDone) => setBulkDelete({ rows: selectedRows, onDone })}
          onReorder={reorder}
        />
      </div>
      {formOpen ? (
        <div className="admin-form-modal-layer" role="presentation">
          <button className="admin-form-modal-backdrop" type="button" onClick={closeForm} aria-label="Close form" />
          <section className="admin-form-modal" role="dialog" aria-modal="true" aria-labelledby="admin-form-title">
            <div className="admin-form-modal-header">
              <h2 id="admin-form-title" className="font-heading text-2xl">{formTitle}</h2>
              <button className="icon-button" type="button" onClick={closeForm} aria-label="Close form">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form id="admin-resource-form" onSubmit={handleSubmit(save)} className="admin-form-modal-body space-y-4">
              {formFields.map((name) => {
                const image = config.imageFields?.find((field) => field.name === name);
                const rich = config.richFields?.includes(name);
                if (image) {
                  return (
                    <Controller
                      key={name}
                      control={control}
                      name={name}
                      render={({ field }) => <UploadField label={image.label} bucket={image.bucket} value={field.value} onChange={field.onChange} />}
                    />
                  );
                }
                if (rich) {
                  return (
                    <div className="field" key={name}>
                      <span>{name.replaceAll('_', ' ')}</span>
                      <Controller control={control} name={name} render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} />} />
                    </div>
                  );
                }
                if (name === 'featured') {
                  return <label className="check-field" key={name}><input type="checkbox" {...register(name)} /> Featured</label>;
                }
                if (name === 'status') {
                  return (
                    <label className="field" key={name}>
                      <span>Status</span>
                      <select className="input" {...register(name)}>
                        <option value="draft">draft</option>
                        <option value="published">published</option>
                      </select>
                    </label>
                  );
                }
                const inputRegistration = register(name);
                const isProjectSlug = resourceKey === 'projects' && name === 'slug';
                return (
                  <label className="field" key={name}>
                    <span>{name.replaceAll('_', ' ')}</span>
                    <input
                      className="input"
                      type="text"
                      placeholder={name.endsWith('_date') ? '2024, 2024-08, 2024-08-17, or Present' : ''}
                      {...inputRegistration}
                      onChange={(event) => {
                        inputRegistration.onChange(event);
                        if (isProjectSlug) setSlugManuallyEdited(Boolean(event.target.value.trim()));
                      }}
                    />
                    {isProjectSlug ? <small className="field-hint">Auto-generated from the project title unless you edit it.</small> : null}
                    {name.endsWith('_date') ? <small className="field-hint">Use a year, month, full date, or leave blank / type Present for ongoing.</small> : null}
                    {errors[name] ? <small className="text-red-600">{errors[name].message}</small> : null}
                  </label>
                );
              })}
            </form>
            <div className="admin-form-modal-actions">
              <button className="button secondary" type="button" onClick={closeForm}>Cancel</button>
              <button className="button" type="submit" form="admin-resource-form">Save {config.singular}</button>
            </div>
          </section>
        </div>
      ) : null}
      <ConfirmDialog
        open={Boolean(deleteTarget || bulkDelete)}
        title={bulkDelete ? `Delete ${bulkDelete.rows.length} ${config.label.toLowerCase()}?` : `Delete ${config.singular.toLowerCase()}?`}
        description={bulkDelete ? 'This action cannot be undone. All selected items will be permanently removed from your portfolio content.' : 'This action cannot be undone. The item will be permanently removed from your portfolio content.'}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onCancel={() => {
          setDeleteTarget(null);
          setBulkDelete(null);
        }}
        onConfirm={remove}
      />
    </section>
  );
}
