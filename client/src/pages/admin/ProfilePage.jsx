import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import RichTextEditor from '../../components/RichTextEditor';
import UploadField from '../../components/UploadField';
import Skeleton from '../../components/Skeleton';

const fields = ['name', 'tagline', 'email', 'location', 'availability_status'];
const availabilityOptions = ['Open to work', 'Freelancing', 'Available for contract', 'Not available'];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, control } = useForm();

  useEffect(() => {
    api.get('/profile').then((profile) => {
      reset(profile ?? {});
      setLoading(false);
    });
  }, [reset]);

  async function save(values) {
    try {
      const saved = await api.patch('/profile', values);
      reset(saved);
      toast.success('Profile saved');
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (loading) return <Skeleton />;

  return (
    <form onSubmit={handleSubmit(save)} className="admin-panel max-w-3xl space-y-5">
      <h1 className="admin-title">Profile</h1>
      {fields.map((field) => (
        <label className="field" key={field}>
          <span>{field.replaceAll('_', ' ')}</span>
          {field === 'availability_status' ? (
            <select className="input" {...register(field)}>
              {availabilityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          ) : (
            <input className="input" {...register(field)} />
          )}
        </label>
      ))}
      <Controller control={control} name="avatar_url" render={({ field }) => (
        <UploadField label="Avatar" bucket="avatars" value={field.value} onChange={field.onChange} />
      )} />
      <Controller control={control} name="resume_url" render={({ field }) => (
        <UploadField label="Resume" bucket="resumes" value={field.value} onChange={field.onChange} />
      )} />
      <div className="field">
        <span>Bio</span>
        <Controller control={control} name="bio" render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} />} />
      </div>
      <button className="button">Save profile</button>
    </form>
  );
}
