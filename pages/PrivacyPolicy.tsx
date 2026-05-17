export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: May 2026 • Effective immediately</p>
      
      <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. Introduction</h2>
          <p>JoblifyHQ ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information when you use our platform for jobs, scholarships, and career content.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account Data:</strong> Name, email, and profile info when you register.</li>
            <li><strong>Usage Data:</strong> Pages visited, jobs viewed, filters used, and time on site.</li>
            <li><strong>Application Data:</strong> CVs, cover letters, and contact details when you apply to opportunities.</li>
            <li><strong>Device & Cookie Data:</strong> IP address, browser type, and analytics cookies (see Section 5).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>To deliver, personalize, and improve our services.</li>
            <li>To process job/scholarship applications and notify you of updates.</li>
            <li>To send newsletters, career tips, and promotional offers (opt-out available).</li>
            <li>To detect fraud, enforce terms, and comply with legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. Data Sharing & Third Parties</h2>
          <p>We do not sell your personal data. We may share information with:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Employers & Institutions:</strong> Only when you explicitly apply or consent.</li>
            <li><strong>Service Providers:</strong> Payment processors (Stripe), email services (Resend/SendGrid), and hosting (Vercel).</li>
            <li><strong>Advertising Partners:</strong> Google AdSense uses cookies to serve relevant ads. Review their <a href="https://policies.google.com/technologies/partner-sites" target="_blank" className="text-primary-600 hover:underline">privacy policy</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Cookies & Tracking</h2>
          <p>We use essential cookies for authentication and functionality, and analytical/advertising cookies for performance tracking and monetization. You can manage preferences via your browser or our cookie banner.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. Your Rights</h2>
          <p>Depending on your location, you may have the right to access, correct, delete, or export your data. Contact us at <a href="mailto:privacy@joblifyhq.com" className="text-primary-600 hover:underline">privacy@joblifyhq.com</a> to exercise these rights.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">7. Security & Retention</h2>
          <p>We implement industry-standard encryption and access controls. Data is retained only as long as necessary for service delivery or legal compliance.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">8. Contact</h2>
          <p>Questions about this policy? Reach out to <a href="mailto:support@joblifyhq.com" className="text-primary-600 hover:underline">support@joblifyhq.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
