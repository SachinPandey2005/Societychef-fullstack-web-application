
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="text-6xl mb-4">🚫</div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
      <p className="text-slate-500 mb-6 text-center max-w-md">
        You don't have permission to access this page. Please contact your administrator if you believe this is an error.
      </p>
      <Link 
        to="/" 
        className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
