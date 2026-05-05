import { Loader2 } from 'lucide-react';

/**
 * LoadingScreen component - displayed while initial data is loading
 */
export default function LoadingScreen() {
  return (
    <main className="loading-screen">
      <Loader2 className="spin" size={34} />
      <p>Loading dashboard...</p>
    </main>
  );
}
