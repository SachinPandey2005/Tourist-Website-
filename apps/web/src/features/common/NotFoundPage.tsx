import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export function NotFoundPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <EmptyState
        icon={<Compass className="w-10 h-10 text-teal-400 animate-pulse-subtle" />}
        title="404 – Destination Off the Map"
        description="The itinerary or page you are trying to visit does not exist or has been relocated to a different route."
        action={
          <Link to="/">
            <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
              Return to Homepage
            </Button>
          </Link>
        }
      />
    </div>
  );
}
