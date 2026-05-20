import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="screen-center px-6 text-center">
      <h1 className="font-heading text-5xl">404</h1>
      <p className="mt-3 text-muted">That page does not exist.</p>
      <Link className="button mt-6" to="/">
        Return home
      </Link>
    </main>
  );
}
