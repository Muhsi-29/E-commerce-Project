import type { ReactNode } from 'react';

interface PageStateProps {
  loading?: boolean;
  icon?: ReactNode;
  title?: string;
  message?: string;
  action?: ReactNode;
}

// Full-width loading, empty and error states
export default function PageState({ loading, icon, title, message, action }: PageStateProps) {
  return (
    <div className="page-state" role={loading ? 'status' : undefined}>
      {loading ? <div className="spinner" aria-label="Loading" /> : icon}
      {title && <h2>{title}</h2>}
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}
