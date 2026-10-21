import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Search,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { Card } from '../../components/ui/Card.js';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export function FaqPage() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('faq-1');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const faqs: FaqItem[] = [
    {
      id: 'faq-1',
      category: 'BOOKINGS_ESCROW',
      question: 'How does the VoyageVista Escrow SafeGuarantee work?',
      answer:
        'When you book an expedition, your initial 20% deposit and subsequent balances are held in an isolated escrow bank trust. Funds are only remitted to local operators and lodges once your departure is verified and active, shielding you completely from operator insolvency or unfulfilled itineraries.',
    },
    {
      id: 'faq-2',
      category: 'BOOKINGS_ESCROW',
      question: 'When is the remaining balance due for my tour package?',
      answer:
        'The remaining balance is due exactly 45 days prior to your expedition start date. You will receive an automated email reminder 14 days before this milestone with options to pay via credit card, bank wire, or Apple Pay.',
    },
    {
      id: 'faq-3',
      category: 'CANCELLATIONS',
      question: 'What is your cancellation policy if my plans change?',
      answer:
        'All standard tour departures are eligible for a 100% full refund up to 30 days prior to the start date. For cancellations made between 29 and 15 days, we provide a 70% refund or 100% future trip credit. Cancellations within 14 days are subject to operator commitment fees, though emergency rebooking credits may be approved by our concierge.',
    },
    {
      id: 'faq-4',
      category: 'GROUP_GUIDES',
      question: 'What is the maximum group size for guided expeditions?',
      answer:
        'We enforce strict group caps of 8 to 12 travelers depending on the terrain. For high-alpine treks and wilderness safaris, group sizes are limited to 6 to 8 participants with a 1:4 guide-to-traveler ratio.',
    },
    {
      id: 'faq-5',
      category: 'GROUP_GUIDES',
      question: 'What certifications do your tour guides hold?',
      answer:
        'Our alpine guides hold certified UIAGM/IFMGA international mountain guide licenses. Our cultural and historical guides hold government-issued master guide licenses and university degrees in history, botany, or regional anthropology.',
    },
    {
      id: 'faq-6',
      category: 'VISAS_HEALTH',
      question: 'Do you arrange traveler visas and international medical insurance?',
      answer:
        'While travelers are responsible for holding valid passports with at least 6 months remaining validity, our concierge provides complimentary visa guidance and official booking confirmation vouchers necessary for embassy applications.',
    },
  ];

  const categories = [
    { id: 'ALL', label: 'All Questions' },
    { id: 'BOOKINGS_ESCROW', label: 'Escrow & Payments' },
    { id: 'CANCELLATIONS', label: 'Cancellations & Refunds' },
    { id: 'GROUP_GUIDES', label: 'Party Sizes & Guides' },
    { id: 'VISAS_HEALTH', label: 'Visas & Documentation' },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCat = activeCategory === 'ALL' || faq.category === activeCategory;
    const matchesSearch =
      !search ||
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="brand">KNOWLEDGE BASE</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Clear answers about escrow payments, small-party group standards, cancellation guarantees, and travel logistics.
        </p>

        <div className="max-w-lg mx-auto pt-4">
          <Input
            placeholder="Search keywords (e.g. refund, deposit, guide)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeCategory === cat.id
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No matching questions found.</p>
            <p className="text-xs text-slate-500">Try adjusting your search terms or view all categories.</p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-800/40 focus-visible:ring-2 focus-visible:ring-brand-400"
                  aria-expanded={isExpanded}
                >
                  <span className="font-bold text-sm sm:text-base text-slate-100">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-teal-400 shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-950/40">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Still Have Questions CTA */}
      <Card className="p-8 text-center space-y-4">
        <h3 className="text-lg font-bold text-slate-100">
          Still Have Unanswered Questions?
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Our global travel curators are available around the clock to assist with bespoke itinerary requirements.
        </p>
        <Link to="/contact">
          <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Contact Concierge
          </Button>
        </Link>
      </Card>
    </div>
  );
}
