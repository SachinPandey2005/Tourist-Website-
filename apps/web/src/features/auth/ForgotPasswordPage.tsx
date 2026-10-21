import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { apiClient, ApiClientError } from '../../lib/api/client.js';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await apiClient.post('/api/auth/forgot-password', { email });
      setIsSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to send reset link. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-bold text-slate-100">Reset Password</h2>
        <p className="text-xs text-slate-400">
          Enter your registered email and we'll dispatch an expiring recovery link.
        </p>
      </div>

      {isSubmitted ? (
        <div className="p-5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-center space-y-3 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-100">Recovery Dispatched</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              If an account is associated with <span className="text-teal-300 font-medium">{email}</span>, a 15-minute secure reset token has been dispatched.
            </p>
          </div>
          <Link to="/login" className="inline-block pt-2">
            <Button variant="outline" size="sm">
              Return to Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Input
            label="Account Email"
            type="email"
            placeholder="traveler@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-2"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Send Reset Link
          </Button>
        </form>
      )}

      <div className="pt-4 text-center border-t border-slate-800/80">
        <Link to="/login" className="text-xs font-semibold text-teal-400 hover:text-teal-300">
          Remember your password? Sign In
        </Link>
      </div>
    </div>
  );
}
