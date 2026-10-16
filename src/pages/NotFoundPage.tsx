import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import PageState from '../components/PageState.tsx';

export default function NotFoundPage() {
  return (
    <PageState
      icon={<Compass size={56} strokeWidth={1.5} />}
      title="Page not found"
      message="The page you're looking for doesn't exist or has moved."
      action={<Link to="/" className="btn btn-primary btn-inline">Go to the home page</Link>}
    />
  );
}
