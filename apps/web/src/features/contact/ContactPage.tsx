import { useState, FormEvent } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';

export function ContactPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-12">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge variant="brand">GLOBAL TRAVEL CONCIERGE</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100">
          Get in Touch with Our Specialists
        </h1>
        <p className="text-sm text-slate-400">
          Have questions about an upcoming departure, private charter, or escrow payments? Our concierge team is standing by 24/7.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="p-6 sm:p-8">
            {isSubmitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-100">
                  Inquiry Dispatched Successfully
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  Thank you, <span className="text-teal-300 font-semibold">{fullName}</span>. A dedicated destination specialist will review your request and reply to <span className="text-slate-200">{email}</span> within 4 business hours.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsSubmitted(false);
                    setFullName('');
                    setEmail('');
                    setSubject('');
                    setMessage('');
                  }}
                >
                  Send Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-100">Send an Expedition Inquiry</h2>
                  <p className="text-xs text-slate-400">
                    Fill out the form below and an expedition curator will tailor an itinerary for your party.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="jane.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Subject / Destination of Interest"
                  placeholder="e.g. Kyoto Private Autumn Expedition 2026"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Message / Special Requests
                  </label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="Tell us about your party size, preferred dates, physical difficulty preferences, and any bespoke requests..."
                    className="w-full px-4 py-2.5 text-sm rounded-xl text-slate-100 placeholder-slate-500 bg-slate-900/70 border border-slate-700/80 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 focus:outline-none transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isSubmitting}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  Submit Inquiry
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <h3 className="font-bold text-base text-slate-100 border-b border-slate-800 pb-3">
              Direct Contact Channels
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-semibold">General Concierge</span>
                  <a href="mailto:concierge@voyagevista.com" className="text-slate-200 hover:text-teal-300 transition-colors">
                    concierge@voyagevista.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-semibold">Global Toll-Free</span>
                  <span className="text-slate-200">+1 (800) 582-8782</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-semibold">Operating Hours</span>
                  <span className="text-slate-200">24 Hours / 7 Days a Week</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-semibold">Headquarters</span>
                  <span className="text-slate-200">77 King Street, Financial District, Zurich, Switzerland</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>24/7 Emergency Dispatch for active travelers</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
