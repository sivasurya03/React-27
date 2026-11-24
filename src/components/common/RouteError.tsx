import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { Button, ErrorState } from '@/components/ui';

export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : 'Unknown error';
  return (
    <div className="flex min-h-screen items-center justify-center bg-app p-6">
      <div className="max-w-md rounded-2xl border border-line bg-surface p-4 shadow-card">
        <ErrorState title="This page could not be displayed" message={message} />
        <div className="flex justify-center gap-2 pb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
          <Button onClick={() => navigate('/')}>Home</Button>
        </div>
      </div>
    </div>
  );
}
