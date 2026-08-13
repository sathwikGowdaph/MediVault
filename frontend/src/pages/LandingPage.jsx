import { Link } from 'react-router-dom';
import {
  Activity, ShieldCheck, FileText, HeartPulse, ArrowRight, Stethoscope,
  QrCode, Users, BellRing, Brain, ChevronDown, CheckCircle2, Star
} from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Secure Medical Profiles',
    description: 'Store allergies, medications, blood group, and emergency contacts in one encrypted, protected place.'
  },
  {
    icon: FileText,
    title: 'Medical Records Vault',
    description: 'Upload prescriptions, lab reports, X-rays, MRI scans, and insurance documents with AI-powered analysis.'
  },
  {
    icon: QrCode,
    title: 'QR Emergency Access',
    description: 'Generate a secure, revocable QR code so healthcare providers can access critical info instantly.'
  },
  {
    icon: Users,
    title: 'Family Management',
    description: 'Grant trusted family members controlled access to your medical information and profiles.'
  },
  {
    icon: BellRing,
    title: 'Smart Reminders',
    description: 'Set medicine, appointment, and document expiry reminders to stay ahead of your health.'
  },
  {
    icon: Brain,
    title: 'AI Medical Analysis',
    description: 'AI-powered OCR extracts medicines, allergies, and conditions from your uploaded documents automatically.'
  }
];

const steps = [
  { step: '01', title: 'Create your account', description: 'Register in seconds with your email. No credit card required.' },
  { step: '02', title: 'Build your medical profile', description: 'Add your blood group, allergies, medications, and emergency contacts.' },
  { step: '03', title: 'Upload your records', description: 'Upload prescriptions, lab reports, and medical images securely.' },
  { step: '04', title: 'Generate your emergency QR', description: 'Create a secure QR code first responders can scan for critical info.' }
];

const testimonials = [
  {
    name: 'Dr. Priya Sharma',
    role: 'Emergency Physician',
    text: 'MediVault QR codes have saved critical minutes during emergencies. Having patient allergies and medications instantly available changes outcomes.'
  },
  {
    name: 'Ramesh Gupta',
    role: 'Patient',
    text: 'My entire medical history is now organized and accessible. I feel prepared knowing my family can access everything if something happens.'
  },
  {
    name: 'Anjali Mehta',
    role: 'Family Caregiver',
    text: 'Managing my parents\' medical records across multiple hospitals used to be a nightmare. MediVault made it simple and stress-free.'
  }
];

const faqs = [
  { q: 'Is my medical data secure?', a: 'Yes. All data is stored with encryption, served through authenticated APIs, and never shared without your consent.' },
  { q: 'Who can see my QR emergency profile?', a: 'Only people with the QR link can access your emergency summary. You can revoke access at any time.' },
  { q: 'Can I manage family members\' records?', a: 'Yes. Patients can grant family members access with specific permissions they control.' },
  { q: 'Does the AI replace medical advice?', a: 'No. AI summaries are informational tools. Always consult a qualified healthcare professional.' },
  { q: 'What file types can I upload?', a: 'PDF documents, JPEG, PNG, and WebP images. Maximum 10MB per file.' }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white">
              <Activity size={18} />
            </div>
            <div>
              <div className="font-semibold text-slate-900">MediVault</div>
              <div className="hidden text-xs text-slate-500 sm:block">Emergency medical records</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-sm text-brand-700">
              <ShieldCheck size={14} /> Trusted emergency readiness
            </div>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Keep critical medical information ready for emergencies.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-600">
              MediVault helps patients securely manage records, family access, and QR-based emergency profiles in one place — so life-saving information is always available.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-700 transition-colors">
                Create free account <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="rounded-full border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                Sign in
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-500">
              {['No credit card required', 'Secure & encrypted', 'Free to start'].map(item => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-brand-500" /> {item}
                </div>
              ))}
            </div>
          </div>

          {/* Hero card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-brand-100 p-3 text-brand-700"><Stethoscope size={20} /></div>
              <div>
                <h2 className="font-semibold">Emergency readiness summary</h2>
                <p className="text-sm text-slate-500">Prepared for fast access when it matters most.</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {[
                { label: 'Blood Group', value: 'A+', urgent: true },
                { label: 'Allergies', value: 'Penicillin, Sulfa drugs', urgent: true },
                { label: 'Current Medications', value: 'Metformin 500mg, Amlodipine 5mg' },
                { label: 'Emergency Contact', value: 'Priya Sharma — +91 98765 43210' }
              ].map(item => (
                <div key={item.label} className={`flex items-start justify-between rounded-2xl px-4 py-3 ${item.urgent ? 'bg-red-50 border border-red-100' : 'bg-slate-50'}`}>
                  <span className="text-sm font-medium text-slate-600">{item.label}</span>
                  <span className={`text-sm font-semibold ${item.urgent ? 'text-red-700' : 'text-slate-800'}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3">
              <QrCode size={18} className="text-brand-600" />
              <span className="text-sm text-brand-700 font-medium">QR emergency access ready • Scan to view</span>
            </div>
          </div>
        </section>

        {/* Problem statement */}
        <section className="bg-slate-900 py-16 text-white">
          <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
            <h2 className="text-3xl font-semibold sm:text-4xl">Medical emergencies don't wait for records to load.</h2>
            <p className="mt-4 text-lg text-slate-300">
              Critical minutes are lost when doctors can't access patient allergies, medications, or emergency contacts. MediVault puts that information exactly where it needs to be — instantly accessible.
            </p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-slate-900">Everything you need to be emergency-ready</h2>
            <p className="mt-3 text-lg text-slate-600">Comprehensive tools for patients, families, and healthcare providers.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4 inline-flex rounded-2xl bg-brand-50 p-3 text-brand-600">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-slate-900">Get ready in four steps</h2>
              <p className="mt-3 text-lg text-slate-600">Set up your complete emergency profile in under 10 minutes.</p>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <div key={step.step} className="relative text-center">
                  {i < steps.length - 1 && (
                    <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-slate-200 lg:block" />
                  )}
                  <div className="relative z-10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 border-2 border-brand-200 text-xl font-bold text-brand-700">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-slate-900">Trusted by patients and providers</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex gap-1 text-amber-400 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">"{t.text}"</p>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="font-semibold text-slate-900">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-slate-900">Frequently asked questions</h2>
            </div>
            <div className="mt-10 space-y-4">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-2xl border border-slate-200 bg-slate-50">
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-medium text-slate-900 list-none">
                    {faq.q}
                    <ChevronDown size={18} className="text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="rounded-3xl bg-brand-500 p-12 text-center text-white">
            <h2 className="text-3xl font-semibold sm:text-4xl">Be ready before emergencies happen.</h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-100">
              Join thousands of patients who have secured their medical records and emergency profiles with MediVault.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-slate-50 transition-colors">
                Create free account <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="rounded-full border border-white/30 px-6 py-3 font-medium text-white hover:bg-white/10 transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white">
                <Activity size={16} />
              </div>
              <span className="font-semibold text-slate-900">MediVault</span>
            </div>
            <p className="text-sm text-slate-500">© {new Date().getFullYear()} MediVault. Emergency Medical Records Management.</p>
            <div className="flex gap-4 text-sm text-slate-500">
              <Link to="/login" className="hover:text-brand-600 transition-colors">Sign in</Link>
              <Link to="/register" className="hover:text-brand-600 transition-colors">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
