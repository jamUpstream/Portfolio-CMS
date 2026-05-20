import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { resources } from '../../lib/resources';
import Skeleton from '../../components/Skeleton';

export default function AdminDashboard() {
  const [state, setState] = useState({ loading: true, counts: {}, profile: null });

  useEffect(() => {
    Promise.all([
      api.get('/profile'),
      ...Object.keys(resources).map((key) => api.get(resources[key].path).then((rows) => [key, rows.length]))
    ]).then(([profile, ...counts]) => {
      setState({ loading: false, profile, counts: Object.fromEntries(counts) });
    });
  }, []);

  if (state.loading) return <Skeleton />;

  return (
    <section className="space-y-8">
      <div>
        <h1 className="admin-title">Dashboard</h1>
        <p className="text-muted">Profile last updated: {state.profile?.updated_at ? new Date(state.profile.updated_at).toLocaleString() : 'Not set'}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(resources).map(([key, config]) => (
          <Link className="stat-card" key={key} to={`/admin/${key}`}>
            <span>{config.label}</span>
            <strong>{state.counts[key] ?? 0}</strong>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link className="button" to="/admin/projects">Create project</Link>
        <Link className="button secondary" to="/admin/profile">Update profile</Link>
        <Link className="button secondary" to="/admin/settings">Design settings</Link>
      </div>
    </section>
  );
}
