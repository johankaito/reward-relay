export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[var(--surface-muted)] text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
            <p className="text-slate-400">Last updated: {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-lg text-slate-300">
              Reward Relay (we, us, our) is committed to protecting your privacy and complying with the Australian Privacy Principles (APPs) under the Privacy Act 1988 (Cth).
            </p>
          </div>

          {/* Table of Contents */}
          <nav className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] p-6">
            <h2 className="mb-4 text-xl font-semibold">Contents</h2>
            <ol className="space-y-2 text-sm text-slate-300">
              <li><a href="#collection" className="hover:text-white transition">1. Information We Collect</a></li>
              <li><a href="#use" className="hover:text-white transition">2. How We Use Your Information</a></li>
              <li><a href="#disclosure" className="hover:text-white transition">3. Disclosure of Information</a></li>
              <li><a href="#overseas" className="hover:text-white transition">4. Overseas Transfers</a></li>
              <li><a href="#security" className="hover:text-white transition">5. Security</a></li>
              <li><a href="#access" className="hover:text-white transition">6. Access and Correction</a></li>
              <li><a href="#cookies" className="hover:text-white transition">7. Cookies and Analytics</a></li>
              <li><a href="#rights" className="hover:text-white transition">8. Your Rights</a></li>
              <li><a href="#breaches" className="hover:text-white transition">9. Data Breaches</a></li>
              <li><a href="#children" className="hover:text-white transition">10. Children's Privacy</a></li>
              <li><a href="#changes" className="hover:text-white transition">11. Changes to This Policy</a></li>
              <li><a href="#contact" className="hover:text-white transition">12. Contact Us</a></li>
            </ol>
          </nav>

          {/* Content Sections */}
          <section id="collection" className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
            <p className="text-slate-300">We collect personal information to provide you with credit card tracking and churning optimization services. The types of information we collect include:</p>

            <div className="space-y-4 pl-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Account Information</h3>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-300">
                  <li>Name and email address</li>
                  <li>Password (encrypted)</li>
                  <li>Account preferences and settings</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-200">Credit Card Portfolio Information</h3>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-300">
                  <li>Credit card product names (e.g., "ANZ Rewards Black")</li>
                  <li>Application dates, approval dates, cancellation dates</li>
                  <li>Annual fee amounts and due dates</li>
                  <li>Sign-up bonus values and targets</li>
                  <li>Personal notes about cards</li>
                </ul>
                <p className="mt-2 text-sm text-slate-400">
                  <strong>Important:</strong> We do NOT collect or store actual credit card numbers, CVVs, PINs, or any data that could be used to make purchases. We only track card products you own for planning purposes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-200">Technical Information</h3>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-300">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Operating system</li>
                  <li>Usage data and interaction patterns</li>
                  <li>Session information and timestamps</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="use" className="space-y-4">
            <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
            <p className="text-slate-300">We use your personal information for the following purposes:</p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li><strong>Service Provision:</strong> To provide credit card tracking, churning recommendations, and annual fee reminders</li>
              <li><strong>Communication:</strong> To send you email reminders about annual fees, optimal churn timing, and account updates</li>
              <li><strong>Service Improvement:</strong> To analyze usage patterns and improve our platform's functionality</li>
              <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security incidents</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
              <li><strong>Customer Support:</strong> To respond to your inquiries and provide technical assistance</li>
            </ul>
          </section>

          <section id="disclosure" className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Disclosure of Information</h2>
            <p className="text-slate-300">We may share your personal information with:</p>

            <div className="space-y-4 pl-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Service Providers</h3>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-300">
                  <li><strong>Supabase:</strong> Database hosting and user authentication (US-based, data stored in Sydney, Australia)</li>
                  <li><strong>Vercel:</strong> Website hosting and content delivery (US-based)</li>
                  <li><strong>Resend:</strong> Email delivery service for reminders and notifications (US-based)</li>
                </ul>
                <p className="mt-2 text-sm text-slate-400">
                  All service providers are contractually required to protect your information and use it only for the purposes we specify.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-200">Legal Requirements</h3>
                <p className="text-slate-300">
                  We may disclose your information if required by law, court order, or government authority, or to protect our rights, property, or safety or that of others.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-200">Business Transfers</h3>
                <p className="text-slate-300">
                  If Reward Relay is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you via email of any such change.
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-400">
              <strong>We never sell your personal information to third parties.</strong>
            </p>
          </section>

          <section id="overseas" className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Overseas Transfers</h2>
            <p className="text-slate-300">
              Your personal information may be stored and processed outside Australia by our service providers. We take reasonable steps to ensure that overseas recipients comply with the Australian Privacy Principles or equivalent standards.
            </p>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4">
              <h3 className="font-semibold text-slate-200">Current Overseas Locations:</h3>
              <ul className="mt-2 list-disc pl-6 text-slate-300">
                <li><strong>Primary Data Storage:</strong> Sydney, Australia (Supabase)</li>
                <li><strong>Backup and Processing:</strong> United States (Supabase, Vercel, Resend)</li>
              </ul>
            </div>
          </section>

          <section id="security" className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Security</h2>
            <p className="text-slate-300">
              We take the security of your personal information seriously and implement industry-standard measures to protect it:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li><strong>Encryption:</strong> All data is encrypted in transit (HTTPS/TLS) and at rest</li>
              <li><strong>Authentication:</strong> Secure authentication via Supabase with password hashing</li>
              <li><strong>Access Controls:</strong> Strict access controls limit who can view your data</li>
              <li><strong>Regular Updates:</strong> We regularly update our security measures and conduct security reviews</li>
              <li><strong>Incident Response:</strong> We have procedures in place to respond to data breaches promptly</li>
            </ul>
            <p className="mt-4 text-sm text-slate-400">
              While we implement strong security measures, no system is completely secure. We encourage you to use a strong, unique password and enable any available security features.
            </p>
          </section>

          <section id="access" className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Access and Correction</h2>
            <p className="text-slate-300">
              Under the Privacy Act, you have the right to:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
              <li><strong>Correct:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Export:</strong> Download your data in a portable format (available in your account settings)</li>
              <li><strong>Delete:</strong> Request deletion of your account and personal information</li>
            </ul>
            <p className="mt-4 text-slate-300">
              To exercise these rights, email us at <a href="mailto:support@rewardrelay.com.au" className="text-[var(--accent-strong)] hover:underline">support@rewardrelay.com.au</a>. We will respond within 30 days.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              We may charge a reasonable fee for providing access to your information in certain circumstances, or refuse access where permitted by law (e.g., where providing access would unreasonably impact others' privacy).
            </p>
          </section>

          <section id="cookies" className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Cookies and Analytics</h2>
            <p className="text-slate-300">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Keep you logged in to your account</li>
              <li>Remember your preferences</li>
              <li>Understand how you use our service</li>
              <li>Improve our platform's performance</li>
            </ul>
            <p className="mt-4 text-slate-300">
              You can control cookies through your browser settings. Note that disabling cookies may affect the functionality of our service.
            </p>
          </section>

          <section id="rights" className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Your Rights</h2>
            <p className="text-slate-300">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li><strong>Right to complain:</strong> Lodge a complaint with us or the Office of the Australian Information Commissioner (OAIC)</li>
              <li><strong>Right to withdraw consent:</strong> Where we rely on your consent, you can withdraw it at any time</li>
              <li><strong>Right to object:</strong> Object to certain types of processing of your information</li>
              <li><strong>Right to data portability:</strong> Receive your data in a structured, machine-readable format</li>
            </ul>
            <div className="mt-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4">
              <p className="font-semibold text-slate-200">Office of the Australian Information Commissioner (OAIC):</p>
              <p className="text-sm text-slate-300">
                Website: <a href="https://www.oaic.gov.au" className="text-[var(--accent-strong)] hover:underline">www.oaic.gov.au</a><br />
                Phone: 1300 363 992<br />
                Email: enquiries@oaic.gov.au
              </p>
            </div>
          </section>

          <section id="breaches" className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Data Breaches</h2>
            <p className="text-slate-300">
              In accordance with the Notifiable Data Breaches (NDB) scheme under the Privacy Act, we will:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Assess any suspected data breach within 30 days</li>
              <li>Notify you and the OAIC if we determine a breach is likely to result in serious harm</li>
              <li>Take remedial action to contain the breach and prevent future occurrences</li>
              <li>Provide you with recommendations on steps you can take to reduce the risk of harm</li>
            </ul>
          </section>

          <section id="children" className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Children's Privacy</h2>
            <p className="text-slate-300">
              Reward Relay is not intended for use by individuals under 18 years of age. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at <a href="mailto:support@rewardrelay.com.au" className="text-[var(--accent-strong)] hover:underline">support@rewardrelay.com.au</a>.
            </p>
          </section>

          <section id="changes" className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Changes to This Policy</h2>
            <p className="text-slate-300">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Posting a notice on our website</li>
              <li>Sending an email to your registered email address</li>
              <li>Updating the "Last updated" date at the top of this policy</li>
            </ul>
            <p className="mt-4 text-slate-300">
              Your continued use of Reward Relay after changes become effective constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section id="contact" className="space-y-4">
            <h2 className="text-2xl font-semibold">12. Contact Us</h2>
            <p className="text-slate-300">
              If you have questions about this Privacy Policy or how we handle your personal information, please contact us:
            </p>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-6">
              <p className="font-semibold text-slate-200">Reward Relay</p>
              <p className="mt-2 text-slate-300">
                Email: <a href="mailto:support@rewardrelay.com.au" className="text-[var(--accent-strong)] hover:underline">support@rewardrelay.com.au</a><br />
                Location: New South Wales, Australia
              </p>
              <p className="mt-4 text-sm text-slate-400">
                We aim to respond to all privacy inquiries within 5 business days.
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-[var(--border-default)] pt-8">
            <p className="text-center text-sm text-slate-400">
              This Privacy Policy is provided for informational purposes and should be reviewed by a qualified lawyer before relying on it for legal compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
