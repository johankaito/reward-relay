export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[var(--surface-muted)] text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Terms of Service</h1>
            <p className="text-slate-400">Last updated: {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-lg text-slate-300">
              These Terms of Service govern your use of Reward Relay. By accessing or using our service, you agree to be bound by these terms. Please read them carefully.
            </p>
          </div>

          {/* Important Disclaimers */}
          <div className="rounded-2xl border-2 border-yellow-500/30 bg-yellow-500/10 p-6">
            <h2 className="mb-3 text-xl font-semibold text-yellow-200">Important Disclaimers</h2>
            <div className="space-y-3 text-slate-200">
              <p>
                <strong>Not Financial Advice:</strong> Reward Relay is a credit card tracking tool only. We do not provide financial advice, recommendations, or endorsements of any financial products. The information provided is general in nature and does not take into account your personal financial situation, needs, or objectives.
              </p>
              <p>
                <strong>No AFSL:</strong> We do not hold an Australian Financial Services Licence (AFSL) and are not authorised to provide financial product advice. You should seek independent professional advice before making any financial decisions.
              </p>
              <p>
                <strong>Your Responsibility:</strong> All decisions about credit card applications, cancellations, and management are entirely your own responsibility. We are not liable for any financial outcomes resulting from your use of our service.
              </p>
            </div>
          </div>

          {/* Table of Contents */}
          <nav className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] p-6">
            <h2 className="mb-4 text-xl font-semibold">Contents</h2>
            <ol className="space-y-2 text-sm text-slate-300">
              <li><a href="#acceptance" className="hover:text-white transition">1. Acceptance of Terms</a></li>
              <li><a href="#description" className="hover:text-white transition">2. Service Description</a></li>
              <li><a href="#eligibility" className="hover:text-white transition">3. Eligibility</a></li>
              <li><a href="#account" className="hover:text-white transition">4. User Accounts</a></li>
              <li><a href="#subscription" className="hover:text-white transition">5. Subscription and Fees</a></li>
              <li><a href="#usage" className="hover:text-white transition">6. Acceptable Use</a></li>
              <li><a href="#intellectual" className="hover:text-white transition">7. Intellectual Property</a></li>
              <li><a href="#warranties" className="hover:text-white transition">8. Warranties and Disclaimers</a></li>
              <li><a href="#liability" className="hover:text-white transition">9. Limitation of Liability</a></li>
              <li><a href="#indemnity" className="hover:text-white transition">10. Indemnity</a></li>
              <li><a href="#termination" className="hover:text-white transition">11. Termination</a></li>
              <li><a href="#consumer" className="hover:text-white transition">12. Australian Consumer Law</a></li>
              <li><a href="#dispute" className="hover:text-white transition">13. Dispute Resolution</a></li>
              <li><a href="#modifications" className="hover:text-white transition">14. Modifications</a></li>
              <li><a href="#governing" className="hover:text-white transition">15. Governing Law</a></li>
              <li><a href="#contact-terms" className="hover:text-white transition">16. Contact Information</a></li>
            </ol>
          </nav>

          {/* Content Sections */}
          <section id="acceptance" className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-slate-300">
              By creating an account, accessing, or using Reward Relay, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you must not use our service.
            </p>
          </section>

          <section id="description" className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Service Description</h2>
            <p className="text-slate-300">
              Reward Relay is a credit card portfolio tracking and management tool designed for Australian credit card churners. Our service provides:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Credit card portfolio tracking (card names, dates, fees)</li>
              <li>Annual fee reminders via email</li>
              <li>Sign-up bonus tracking and optimization suggestions</li>
              <li>Churning timeline visualization</li>
              <li>Historical data storage and analysis</li>
            </ul>
            <div className="mt-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4 text-sm text-slate-400">
              <strong>What We Don't Do:</strong> We do not access your actual credit card accounts, process payments on your behalf, store credit card numbers or CVVs, provide financial advice, or guarantee any financial outcomes.
            </div>
          </section>

          <section id="eligibility" className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Eligibility</h2>
            <p className="text-slate-300">
              To use Reward Relay, you must:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Reside in or be present in Australia</li>
              <li>Provide accurate and complete registration information</li>
              <li>Not be prohibited from using our service under Australian law</li>
            </ul>
          </section>

          <section id="account" className="space-y-4">
            <h2 className="text-2xl font-semibold">4. User Accounts</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Account Creation</h3>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-300">
                  <li>You must provide accurate, current, and complete information</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You must not share your account with others</li>
                  <li>One account per person</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-200">Account Security</h3>
                <p className="text-slate-300">
                  You are solely responsible for all activities that occur under your account. You must notify us immediately at <a href="mailto:support@rewardrelay.com.au" className="text-[var(--accent-strong)] hover:underline">support@rewardrelay.com.au</a> if you become aware of any unauthorized access or use of your account.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-200">Data Accuracy</h3>
                <p className="text-slate-300">
                  You are responsible for ensuring that all information you enter into Reward Relay (card details, dates, fees) is accurate. We are not responsible for incorrect recommendations or reminders based on inaccurate data you provide.
                </p>
              </div>
            </div>
          </section>

          <section id="subscription" className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Subscription and Fees</h2>

            <div>
              <h3 className="text-lg font-semibold text-slate-200">Current Status: Free Beta</h3>
              <p className="text-slate-300">
                Reward Relay is currently offered free of charge during our private beta period. We reserve the right to introduce subscription fees in the future.
              </p>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold text-slate-200">Future Pricing</h3>
              <p className="text-slate-300">
                If we introduce subscription fees, we will:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-300">
                <li>Provide at least 30 days' advance notice via email</li>
                <li>Clearly communicate all pricing, billing cycles, and terms</li>
                <li>Offer an opt-out period before any charges begin</li>
                <li>Comply with all Australian Consumer Law requirements for subscription services</li>
              </ul>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold text-slate-200">Cancellation Rights</h3>
              <p className="text-slate-300">
                You may cancel your account at any time by contacting <a href="mailto:support@rewardrelay.com.au" className="text-[var(--accent-strong)] hover:underline">support@rewardrelay.com.au</a>. If subscription fees are introduced, you will have the right to cancel before any charges are applied.
              </p>
            </div>
          </section>

          <section id="usage" className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Acceptable Use</h2>
            <p className="text-slate-300">You agree not to:</p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Use the service for any illegal purpose or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Upload viruses, malware, or other malicious code</li>
              <li>Scrape, copy, or reverse engineer any part of our service</li>
              <li>Use automated tools (bots, scripts) to access or interact with the service without permission</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Impersonate any person or entity</li>
              <li>Share false or misleading information about credit card products</li>
            </ul>
          </section>

          <section id="intellectual" className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Intellectual Property</h2>
            <p className="text-slate-300">
              All content, features, functionality, and intellectual property rights in Reward Relay (including software, code, designs, text, graphics, logos) are owned by us or our licensors and are protected by Australian and international copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mt-4 text-slate-300">
              <strong>Your Data:</strong> You retain all rights to the personal information and data you enter into Reward Relay. By using our service, you grant us a limited license to use, store, and process your data solely for the purpose of providing the service to you.
            </p>
          </section>

          <section id="warranties" className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Warranties and Disclaimers</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Service Provided "As Is"</h3>
                <p className="text-slate-300">
                  Reward Relay is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied, except as required by the Australian Consumer Law.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-200">No Warranty of Accuracy</h3>
                <p className="text-slate-300">
                  We do not warrant that:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-300">
                  <li>The service will be uninterrupted, timely, secure, or error-free</li>
                  <li>Information or recommendations provided are accurate, complete, or current</li>
                  <li>Any errors or defects will be corrected</li>
                  <li>The service will meet your specific requirements</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-200">Credit Card Product Information</h3>
                <p className="text-slate-300">
                  While we strive to provide accurate information about credit card products, annual fees, and sign-up bonuses, this information may become outdated. You are responsible for verifying all details with the relevant financial institutions before making any decisions.
                </p>
              </div>
            </div>
          </section>

          <section id="liability" className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Limitation of Liability</h2>
            <p className="text-slate-300">
              To the maximum extent permitted by law, Reward Relay and its officers, directors, employees, and agents will not be liable for:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or use</li>
              <li>Financial losses arising from credit card applications or churning decisions</li>
              <li>Missed reminders or incorrect churning recommendations</li>
              <li>Credit score impacts from your churning activities</li>
            </ul>
            <p className="mt-4 text-sm text-slate-400">
              <strong>Note:</strong> Nothing in these terms excludes, restricts, or modifies any consumer rights under the Australian Consumer Law that cannot be excluded, restricted, or modified by agreement.
            </p>
          </section>

          <section id="indemnity" className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Indemnity</h2>
            <p className="text-slate-300">
              You agree to indemnify, defend, and hold harmless Reward Relay and its officers, directors, employees, contractors, and agents from any claims, losses, damages, liabilities, costs, and expenses (including reasonable legal fees) arising from:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Your use or misuse of the service</li>
              <li>Your violation of these Terms of Service</li>
              <li>Your violation of any rights of third parties</li>
              <li>Any financial decisions you make based on information from our service</li>
            </ul>
          </section>

          <section id="termination" className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Termination</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Termination by You</h3>
                <p className="text-slate-300">
                  You may terminate your account at any time by contacting us at <a href="mailto:support@rewardrelay.com.au" className="text-[var(--accent-strong)] hover:underline">support@rewardrelay.com.au</a>. Upon termination, we will delete your personal information in accordance with our Privacy Policy.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-200">Termination by Us</h3>
                <p className="text-slate-300">
                  We may suspend or terminate your access to the service immediately, without prior notice, if:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-300">
                  <li>You breach these Terms of Service</li>
                  <li>We are required to do so by law</li>
                  <li>Your account is inactive for more than 12 months</li>
                  <li>We decide to discontinue the service (with reasonable notice)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-200">Effect of Termination</h3>
                <p className="text-slate-300">
                  Upon termination, your right to use the service will immediately cease. We may delete your data in accordance with our data retention policies, though some information may be retained as required by law.
                </p>
              </div>
            </div>
          </section>

          <section id="consumer" className="space-y-4">
            <h2 className="text-2xl font-semibold">12. Australian Consumer Law</h2>
            <p className="text-slate-300">
              Our services come with guarantees that cannot be excluded under the Australian Consumer Law (ACL). For major failures with the service, you are entitled to:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Cancel your service contract and receive a refund for any unused portion (if applicable)</li>
              <li>Compensation for the drop in value below the price paid</li>
            </ul>
            <p className="mt-4 text-slate-300">
              You are also entitled to have the service rectified within a reasonable time. If this is not done, you are entitled to a refund.
            </p>
            <div className="mt-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4 text-sm">
              <p className="font-semibold text-slate-200">Consumer Guarantees:</p>
              <p className="mt-2 text-slate-300">
                Services provided by Reward Relay are guaranteed to be:
              </p>
              <ul className="mt-2 list-disc pl-6 text-slate-300">
                <li>Provided with due care and skill</li>
                <li>Fit for any purpose you specify</li>
                <li>Delivered within a reasonable time</li>
              </ul>
            </div>
          </section>

          <section id="dispute" className="space-y-4">
            <h2 className="text-2xl font-semibold">13. Dispute Resolution</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Informal Resolution</h3>
                <p className="text-slate-300">
                  If you have a complaint or dispute, please first contact us at <a href="mailto:support@rewardrelay.com.au" className="text-[var(--accent-strong)] hover:underline">support@rewardrelay.com.au</a>. We will make reasonable efforts to resolve the issue within 30 days.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-200">External Dispute Resolution</h3>
                <p className="text-slate-300">
                  If we cannot resolve your complaint internally, you may refer the matter to:
                </p>
                <div className="mt-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4 text-sm">
                  <p className="font-semibold text-slate-200">Australian Financial Complaints Authority (AFCA)</p>
                  <p className="mt-2 text-slate-300">
                    Note: AFCA typically handles financial service disputes. For general consumer complaints:
                  </p>
                  <ul className="mt-2 list-disc pl-6 text-slate-300">
                    <li>NSW Fair Trading: <a href="https://www.fairtrading.nsw.gov.au" className="text-[var(--accent-strong)] hover:underline">www.fairtrading.nsw.gov.au</a></li>
                    <li>ACCC: <a href="https://www.accc.gov.au" className="text-[var(--accent-strong)] hover:underline">www.accc.gov.au</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section id="modifications" className="space-y-4">
            <h2 className="text-2xl font-semibold">14. Modifications to Terms</h2>
            <p className="text-slate-300">
              We may modify these Terms of Service from time to time. If we make material changes, we will:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Notify you via email at least 30 days before changes take effect</li>
              <li>Post a notice on our website</li>
              <li>Update the "Last updated" date at the top of these terms</li>
            </ul>
            <p className="mt-4 text-slate-300">
              Your continued use of Reward Relay after changes become effective constitutes acceptance of the revised Terms of Service. If you do not agree to the changes, you must stop using the service and may request account deletion.
            </p>
          </section>

          <section id="governing" className="space-y-4">
            <h2 className="text-2xl font-semibold">15. Governing Law</h2>
            <p className="text-slate-300">
              These Terms of Service are governed by the laws of New South Wales, Australia. Any disputes will be subject to the exclusive jurisdiction of the courts of New South Wales.
            </p>
            <p className="mt-4 text-slate-300">
              Nothing in these terms affects your rights as a consumer under the Australian Consumer Law or other applicable consumer protection legislation.
            </p>
          </section>

          <section id="contact-terms" className="space-y-4">
            <h2 className="text-2xl font-semibold">16. Contact Information</h2>
            <p className="text-slate-300">
              For questions about these Terms of Service, please contact us:
            </p>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-6">
              <p className="font-semibold text-slate-200">Reward Relay</p>
              <p className="mt-2 text-slate-300">
                Email: <a href="mailto:support@rewardrelay.com.au" className="text-[var(--accent-strong)] hover:underline">support@rewardrelay.com.au</a><br />
                Location: New South Wales, Australia
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-[var(--border-default)] pt-8">
            <p className="text-center text-sm text-slate-400">
              These Terms of Service were drafted based on Australian law requirements. They should be reviewed by a qualified lawyer before relying on them for legal compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
