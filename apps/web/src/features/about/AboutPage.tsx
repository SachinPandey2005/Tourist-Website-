import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  Users,
  Leaf,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';

export function AboutPage() {
  const stats = [
    { label: 'Protected Regions & Sanctuaries', value: '38+' },
    { label: 'Travelers Safely Guided', value: '12,500+' },
    { label: 'Verified Satisfaction Rate', value: '99.4%' },
    { label: 'Certified UIAGM & Cultural Guides', value: '100%' },
  ];

  const pillars = [
    {
      icon: ShieldCheck,
      title: 'VoyageVista Escrow Guarantee',
      desc: 'Your travel funds remain securely escrowed in partner merchant vaults until you depart safely, ensuring complete peace of mind.',
    },
    {
      icon: Award,
      title: 'Rigorous Guide Vetting',
      desc: 'Every expedition leader is an accredited cultural historian or licensed alpine guide with extensive regional experience.',
    },
    {
      icon: Users,
      title: 'Intimate Small-Party Groups',
      desc: 'Strict caps of 8 to 12 travelers per expedition ensure minimal cultural disruption and deeply personal immersion.',
    },
    {
      icon: Leaf,
      title: 'Carbon-Offset & Eco Sanctuaries',
      desc: 'We fund accredited reforestation and habitat conservation initiatives for every single booking made on our platform.',
    },
  ];

  return (
    <div className="w-full pb-20 space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-800 bg-gradient-to-b from-slate-900/60 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge variant="brand">OUR PHILOSOPHY & STORY</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-3xl mx-auto">
            Crafting Reverent, Extraordinary Journeys
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Founded with a conviction that travel should be regenerative, authentic, and safe. We connect thoughtful travelers directly with master cultural custodians and wilderness stewards.
          </p>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 text-center space-y-2"
            >
              <span className="text-3xl sm:text-4xl font-extrabold text-teal-300 block">
                {s.value}
              </span>
              <span className="text-xs font-semibold text-slate-400 block">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4 Pillars Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <Badge variant="neutral">THE VOYAGEVISTA STANDARD</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
            Four Core Tenets of Every Expedition
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.title} className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">{pillar.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{pillar.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Narrative Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <Badge variant="brand">ETHICAL TOURISM</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
              Supporting Local Communities & Protecting Heritage
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              We bypass opaque tour aggregators. Over 70% of every dollar spent flows directly to resident guides, traditional family-run ryokans, and independent alpine lodges. By keeping group sizes small, we respect sacred sanctuaries and preserve cultural heritage for generations to come.
            </p>
            <div className="pt-2">
              <Link to="/destinations">
                <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Explore Destinations
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-700/80 h-72">
            <img
              src="https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80"
              alt="Kyoto tea ceremony"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
