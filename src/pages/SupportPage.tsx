import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RiArrowRightLine,
  RiBookOpenLine,
  RiBuilding2Line,
  RiCheckboxCircleLine,
  RiCustomerService2Line,
  RiFileList3Line,
  RiLockPasswordLine,
  RiMailSendLine,
  RiQuestionAnswerLine,
  RiSearchLine,
  RiShieldCheckLine,
  RiToolsLine,
} from 'react-icons/ri';
import { HomeNavbar } from '../components/landing';
import { useTheme } from '../contexts/ThemeContext';

const supportCards = [
  {
    icon: RiLockPasswordLine,
    title: 'Account access',
    copy: 'Help with login, signup, password reset, email confirmation, company approval, and workspace access.',
  },
  {
    icon: RiBuilding2Line,
    title: 'Projects and teams',
    copy: 'Guidance for project setup, role permissions, team invitations, dashboards, and project-scoped modules.',
  },
  {
    icon: RiFileList3Line,
    title: 'Forms and reports',
    copy: 'Support for inspections, site diaries, RFIs, safety records, custom forms, approvals, and exported reports.',
  },
  {
    icon: RiToolsLine,
    title: 'Digital twins and IoT',
    copy: 'Troubleshooting model uploads, viewer access, IoT dashboards, sensor data, analytics, and control workflows.',
  },
];

const faqs = [
  {
    question: 'How do I reset my password?',
    answer: 'Go to the login page, choose forgot password, and submit the email address connected to your MatrixTwin account. Follow the reset link sent to your inbox.',
  },
  {
    question: 'Why can I only see the company page?',
    answer: 'New users may need company approval before accessing projects. Once an administrator approves the account and assigns the right role, project pages become available.',
  },
  {
    question: 'Who can invite team members or change permissions?',
    answer: 'Administrators and authorized project roles can manage team access. If a menu or action is unavailable, ask your workspace administrator to review your role.',
  },
  {
    question: 'What should I include in a support request?',
    answer: 'Send your company name, project name, affected page, browser, screenshots if available, and the steps that caused the issue. This helps us reproduce the problem faster.',
  },
  {
    question: 'Can MatrixTwin help review AI outputs?',
    answer: 'Support can help troubleshoot AI features, but safety, contractual, engineering, and compliance decisions should be reviewed by qualified project personnel.',
  },
];

const SupportPage: React.FC = () => {
  const { darkMode } = useTheme();

  useEffect(() => {
    document.title = 'Support | MatrixTwin';
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
            className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-portfolio-orange/30 bg-portfolio-orange/10 px-3 py-2 text-sm font-medium text-orange-200">
                <RiCustomerService2Line className="text-lg" />
                MatrixTwin Support
              </div>
              <h1 className="mt-6 max-w-4xl font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Get help with your digital construction workspace
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-secondary-300 sm:text-lg">
                Find help for account access, project setup, forms, reports, digital twins, IoT dashboards, analytics, and team permissions. Send us the details and we will help route the issue.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="mailto:support@matrixtwin.com?subject=MatrixTwin%20Support%20Request"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-portfolio-orange px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-portfolio-orange-hover"
                >
                  <RiMailSendLine />
                  Email support
                </a>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Open workspace
                  <RiArrowRightLine />
                </Link>
              </div>
            </div>

            <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 backdrop-blur">
              <h2 className="font-display text-lg font-semibold text-white">Support checklist</h2>
              <div className="mt-4 space-y-3">
                {['Company and project name', 'Page or module affected', 'Browser and device', 'Screenshots or error text'].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-secondary-300">
                    <RiCheckboxCircleLine className="text-lg text-portfolio-orange" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-widest text-secondary-500">Response routing</div>
                <p className="mt-2 text-sm leading-6 text-secondary-300">
                  Access and security issues are prioritized before general product questions.
                </p>
              </div>
            </aside>
          </motion.div>

          <section className="relative z-10 mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {supportCards.map((card) => (
              <article key={card.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-colors hover:border-portfolio-orange/40">
                <card.icon className="text-3xl text-portfolio-orange" />
                <h2 className="mt-5 font-display text-xl font-semibold text-white">{card.title}</h2>
                <p className="mt-3 leading-7 text-secondary-300">{card.copy}</p>
              </article>
            ))}
          </section>

          <section className="relative z-10 mt-10 grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <RiSearchLine className="text-3xl text-portfolio-orange" />
              <h2 className="mt-5 font-display text-2xl font-semibold text-white">Before contacting support</h2>
              <p className="mt-3 leading-8 text-secondary-300">
                Try refreshing the page, checking your internet connection, confirming you are in the correct project, and signing out and back in. For missing modules, verify your role with an administrator.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur">
              <div className="border-b border-white/10 p-6">
                <div className="flex items-center gap-3">
                  <RiQuestionAnswerLine className="text-2xl text-portfolio-orange" />
                  <h2 className="font-display text-2xl font-semibold text-white">Frequently asked questions</h2>
                </div>
              </div>
              <div className="divide-y divide-white/10">
                {faqs.map((faq) => (
                  <article key={faq.question} className="p-6">
                    <h3 className="font-display text-lg font-semibold text-white">{faq.question}</h3>
                    <p className="mt-3 leading-7 text-secondary-300">{faq.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="relative z-10 mt-10 grid gap-4 md:grid-cols-3">
            {[
              { icon: RiBookOpenLine, title: 'Product guidance', copy: 'Use the in-app modules to review dashboards, forms, reports, models, and analytics in the context of a project.' },
              { icon: RiShieldCheckLine, title: 'Security issues', copy: 'Report suspicious access, incorrect permissions, or exposed data immediately so we can investigate.' },
              { icon: RiCustomerService2Line, title: 'Billing and enterprise', copy: 'Contact support for account, company, onboarding, enterprise setup, and commercial questions.' },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
                <item.icon className="text-2xl text-portfolio-orange" />
                <h2 className="mt-4 font-display text-lg font-semibold text-white">{item.title}</h2>
                <p className="mt-3 leading-7 text-secondary-300">{item.copy}</p>
              </div>
            ))}
          </section>

          <section className="relative z-10 mt-10 flex flex-col gap-4 rounded-lg border border-portfolio-orange/30 bg-portfolio-orange/10 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">Privacy or data request?</h2>
              <p className="mt-2 text-secondary-300">Review how MatrixTwin handles information and how to contact us about data rights.</p>
            </div>
            <Link
              to="/privacy"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-dark-950 transition-colors hover:bg-secondary-200"
            >
              Privacy policy
              <RiArrowRightLine />
            </Link>
          </section>
        </section>
      </main>
    </div>
  );
};

export default SupportPage;
