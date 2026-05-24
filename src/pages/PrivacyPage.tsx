import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RiArrowRightLine,
  RiDatabase2Line,
  RiFileShield2Line,
  RiGlobalLine,
  RiLock2Line,
  RiMailLine,
  RiShieldCheckLine,
  RiUserSettingsLine,
} from 'react-icons/ri';
import { HomeNavbar } from '../components/landing';
import { useTheme } from '../contexts/ThemeContext';

const privacySections = [
  {
    title: 'Information we collect',
    body: 'MatrixTwin collects account details, company and project information, uploaded models, files, forms, reports, comments, device data, support messages, and usage events needed to operate the platform. Some information is provided directly by users, while some is generated as teams use dashboards, digital twins, IoT features, analytics, and collaboration tools.',
  },
  {
    title: 'How we use information',
    body: 'We use information to provide secure access, manage projects, process documentation, deliver alerts, improve product reliability, personalize workflows, respond to support requests, prevent abuse, meet legal obligations, and develop safer construction technology. We do not sell personal information.',
  },
  {
    title: 'Project and construction data',
    body: 'Project data remains connected to the customer workspace that created or uploaded it. Administrators control team access, roles, permissions, and project membership. MatrixTwin personnel access customer content only when needed to provide support, maintain the service, investigate security issues, or comply with applicable law.',
  },
  {
    title: 'AI and analytics',
    body: 'MatrixTwin may process forms, uploaded documents, model metadata, chat prompts, and operational signals to generate insights, summaries, search results, and recommendations. AI outputs should be reviewed by qualified project personnel before being used for safety, contractual, engineering, or compliance decisions.',
  },
  {
    title: 'Cookies and similar technologies',
    body: 'We use cookies, local storage, and similar technologies for authentication, language preferences, security, performance, and product analytics. Browser settings may allow you to block or delete cookies, but some authenticated features may stop working correctly.',
  },
  {
    title: 'Sharing and processors',
    body: 'We share information with service providers that help us host, secure, monitor, communicate, analyze, and support MatrixTwin. These providers are required to protect information and use it only for the services they provide to us. We may also disclose information for legal, safety, fraud prevention, or business transfer purposes.',
  },
  {
    title: 'Security',
    body: 'We apply administrative, technical, and organizational safeguards including role-based access, encrypted connections, controlled infrastructure access, monitoring, and permission controls. No online service can guarantee absolute security, so customers should also manage user access carefully and protect credentials.',
  },
  {
    title: 'Retention',
    body: 'We keep information for as long as needed to provide MatrixTwin, maintain records, resolve disputes, comply with law, and support legitimate business purposes. Customers may request deletion or export of eligible account and workspace data, subject to contractual, operational, and legal requirements.',
  },
  {
    title: 'Your choices and rights',
    body: 'Depending on location, users may request access, correction, deletion, export, or restriction of personal information. Workspace administrators may also manage user profiles and project access inside MatrixTwin. Requests can be sent to our support team for review.',
  },
  {
    title: 'International use',
    body: 'MatrixTwin may process information in countries where we or our service providers operate. When information is transferred internationally, we use appropriate safeguards required by applicable data protection laws.',
  },
];

const PrivacyPage: React.FC = () => {
  const { darkMode } = useTheme();

  useEffect(() => {
    document.title = 'Privacy Policy | MatrixTwin';
  }, []);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark-950 text-white' : 'bg-secondary-50 text-secondary-950'}`}>
      <HomeNavbar />
      <main className="relative overflow-hidden pt-28 sm:pt-32">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-portfolio-orange/30 bg-portfolio-orange/10 px-3 py-2 text-sm font-medium text-orange-200">
                <RiFileShield2Line className="text-lg" />
                Last updated May 24, 2026
              </div>
              <h1 className="mt-6 max-w-4xl font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Privacy Policy
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-secondary-300 sm:text-lg">
                This policy explains how MatrixTwin collects, uses, protects, and shares information when teams use our digital construction platform, including dashboards, digital twins, forms, analytics, IoT workflows, and support services.
              </p>
            </div>

            <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-portfolio-orange p-3 text-white">
                  <RiShieldCheckLine className="text-2xl" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-white">Privacy contacts</h2>
                  <p className="text-sm text-secondary-400">Questions, access requests, and deletion requests.</p>
                </div>
              </div>
              <a
                href="mailto:support@matrixtwin.com"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-portfolio-orange px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-portfolio-orange-hover"
              >
                <RiMailLine />
                support@matrixtwin.com
              </a>
            </aside>
          </motion.div>

          <div className="relative z-10 mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: RiLock2Line, label: 'Role-based access', value: 'Workspace controls' },
              { icon: RiDatabase2Line, label: 'Customer data', value: 'Used to run MatrixTwin' },
              { icon: RiUserSettingsLine, label: 'User rights', value: 'Access and deletion requests' },
              { icon: RiGlobalLine, label: 'Global platform', value: 'Protected transfers' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                <item.icon className="text-2xl text-portfolio-orange" />
                <div className="mt-4 text-sm text-secondary-400">{item.label}</div>
                <div className="mt-1 font-display text-lg font-semibold text-white">{item.value}</div>
              </div>
            ))}
          </div>

          <section className="relative z-10 mt-10 rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur">
            <div className="grid gap-0 divide-y divide-white/10">
              {privacySections.map((section, index) => (
                <article key={section.title} className="grid gap-4 p-6 md:grid-cols-[220px_1fr] md:p-8">
                  <div>
                    <div className="font-mono text-xs uppercase tracking-widest text-portfolio-orange">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <h2 className="mt-2 font-display text-xl font-semibold text-white">{section.title}</h2>
                  </div>
                  <p className="leading-8 text-secondary-300">{section.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="relative z-10 mt-10 flex flex-col gap-4 rounded-lg border border-portfolio-orange/30 bg-portfolio-orange/10 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">Need help with a privacy request?</h2>
              <p className="mt-2 text-secondary-300">Our support team can route your request to the right MatrixTwin contact.</p>
            </div>
            <Link
              to="/support"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-dark-950 transition-colors hover:bg-secondary-200"
            >
              Visit support
              <RiArrowRightLine />
            </Link>
          </section>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPage;
