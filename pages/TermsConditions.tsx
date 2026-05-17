export default function TermsConditions() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: May 2026 • By using JoblifyHQ, you agree to these terms.</p>
      
      <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
          <p>By accessing or using JoblifyHQ (the "Platform"), you agree to be bound by these Terms. If you disagree, please discontinue use immediately.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. Platform Description</h2>
          <p>JoblifyHQ is an informational platform connecting job seekers, students, and professionals with employment opportunities, scholarships, and career content. We do not guarantee employment, funding, or selection for any listing.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. User Accounts & Conduct</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>You are responsible for maintaining account confidentiality.</li>
            <li>Prohibited actions: spam, misrepresentation, scraping, or posting fraudulent listings.</li>
            <li>We reserve the right to suspend or terminate accounts violating these terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. Listings & Accuracy</h2>
          <p>Job postings and scholarship opportunities are submitted by third parties. While we strive for accuracy, we do not verify every listing. Always research employers and institutions before sharing personal data or applying.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Paid Services & Payments</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Featured Listings & Premium:</strong> All paid features are billed via Stripe. Refunds are handled case-by-case within 7 days of purchase.</li>
            <li><strong>Employer Accounts:</strong> Subscriptions auto-renew monthly/yearly. Cancel anytime before the next billing cycle.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. Intellectual Property</h2>
          <p>Platform content, branding, and UI are owned by JoblifyHQ. User-uploaded CVs/content remain your property but grant us a license to process and display them as part of our services.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">7. Limitation of Liability</h2>
          <p>JoblifyHQ is provided "as is". We are not liable for indirect, incidental, or consequential damages arising from platform use, third-party listings, or external links.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">8. Governing Law & Changes</h2>
          <p>These terms are governed by applicable commercial law. We may update them periodically; continued use constitutes acceptance of changes.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">9. Contact</h2>
          <p>For legal or compliance inquiries: <a href="mailto:legal@joblifyhq.com" className="text-primary-600 hover:underline">legal@joblifyhq.com</a></p>
        </section>
      </div>
    </div>
  );
}
