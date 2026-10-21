import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Send, Check } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-[1px]">
                <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
                  <Compass className="w-5 h-5 text-teal-400" />
                </div>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                VoyageVista
              </span>
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Curating authentic, sustainable, and unforgettable global travel experiences. From Kyoto’s ancient shrines to the high Swiss Alps, discover the world with expert guides and transparent reservations.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Verified tours & secure escrow reservations</span>
            </div>
          </div>

          {/* Catalog Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/destinations" className="hover:text-teal-300 transition-colors">
                  Destinations
                </Link>
              </li>
              <li>
                <Link to="/tours" className="hover:text-teal-300 transition-colors">
                  Tour Packages
                </Link>
              </li>
              <li>
                <Link to="/hotels" className="hover:text-teal-300 transition-colors">
                  Accommodations
                </Link>
              </li>
              <li>
                <Link to="/activities" className="hover:text-teal-300 transition-colors">
                  Local Activities
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Company Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Company & Help
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/about" className="hover:text-teal-300 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-teal-300 transition-colors">
                  Contact Specialist
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-teal-300 transition-colors">
                  FAQ & Policies
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-teal-300 transition-colors">
                  Universal Search
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-teal-300 transition-colors">
                  Traveler Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Expedition Bulletin
            </h4>
            <p className="text-xs text-slate-400">
              Receive private seasonal departures and curated travel itineraries directly.
            </p>
            {subscribed ? (
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Thank you for subscribing!</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <Input
                  type="email"
                  placeholder="your.email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="primary" size="sm" className="w-full" rightIcon={<Send className="w-3.5 h-3.5" />}>
                  Subscribe
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} VoyageVista Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Cookie Preferences</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
