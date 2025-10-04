import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>
          
          <div className="space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. User Content & Ownership</h2>
              <p className="mb-4">
                By uploading or submitting any design, image, or file ("Content") to Forma's platform, you represent and warrant that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You are the sole owner of the Content, or</li>
                <li>You have obtained all necessary rights, licenses, or permissions to use and share the Content.</li>
              </ul>
              <p className="mt-4">
                You retain ownership of your Content, but by submitting it to Forma, you grant us a non-exclusive, royalty-free, worldwide license to display, reproduce, and sell products derived from the Content on our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Intellectual Property Rights</h2>
              <p className="mb-4">
                You agree not to upload Content that infringes upon the intellectual property rights of others (including copyright, trademark, or design rights).
              </p>
              <p>
                Forma does not pre-screen user uploads. If you believe your IP has been infringed, please contact us at legal@forma.com with details, and we will review and take appropriate action.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Responsibility & Liability</h2>
              <p className="mb-4">
                You acknowledge and agree that you are solely responsible for any Content you upload.
              </p>
              <p>
                Forma will not be held liable for any claims, damages, or disputes arising from Content uploaded by users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Indemnification</h2>
              <p className="mb-4">
                You agree to indemnify, defend, and hold harmless Forma, its affiliates, employees, and partners from any claim, liability, damage, cost, or expense (including legal fees) arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your uploaded Content, or</li>
                <li>Any violation of these Terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Content Removal & Enforcement</h2>
              <p className="mb-4">Forma reserves the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Remove or disable access to any Content suspected of infringing IP rights.</li>
                <li>Suspend or terminate accounts involved in repeated IP violations.</li>
                <li>Comply with applicable notice-and-takedown obligations under intellectual property laws.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Designer Attribution & Commissions</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Forma may attribute designs to specific designers for storytelling and commercial purposes.</li>
                <li>Designers earn commissions based on sales of products derived from their designs.</li>
                <li>Attribution does not imply ownership transfer of underlying intellectual property unless explicitly agreed in writing.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Pricing & Commission Structure</h2>
              <p className="mb-4">
                For each product approved on our platform, Forma sets a base price. Designers may choose to set their own price above this base price.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Designers receive 100% of the amount above the base price (designer markup).</li>
                <li>Designers earn commission on the base price according to the following tiers:</li>
              </ul>
              <div className="mt-4 ml-6 space-y-2">
                <p>• Starter Tier (0-10 sales): 5% commission</p>
                <p>• Bronze Tier (11-25 sales): 8% commission</p>
                <p>• Silver Tier (26-50 sales): 12% commission</p>
                <p>• Gold Tier (51-100 sales): 15% commission</p>
                <p>• Platinum Tier (100+ sales): 20% commission</p>
              </div>
              <p className="mt-4">
                Commission rates are calculated based on the total number of sales made by the designer across all their products.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Payment Terms</h2>
              <p className="mb-4">
                Payments to designers are processed monthly for all sales completed in the previous calendar month. Designers must maintain valid payment information in their account settings.
              </p>
              <p>
                A minimum balance of $50 is required for payout. Balances below this threshold will roll over to the following month.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Account Termination</h2>
              <p className="mb-4">
                Forma reserves the right to suspend or terminate designer accounts that violate these Terms & Conditions, engage in fraudulent activity, or fail to maintain quality standards.
              </p>
              <p>
                Designers may terminate their account at any time. Upon termination, pending payments will be processed according to the standard payment schedule.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Modifications to Terms</h2>
              <p className="mb-4">
                Forma reserves the right to modify these Terms & Conditions at any time. Designers will be notified of significant changes via email.
              </p>
              <p>
                Continued use of the platform after modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Governing Law</h2>
              <p>
                These Terms & Conditions are governed by and construed in accordance with applicable laws. Any disputes arising from these terms shall be resolved through binding arbitration.
              </p>
            </section>

            <section className="pt-8 border-t">
              <p className="text-sm">
                Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-sm mt-4">
                For questions regarding these Terms & Conditions, please contact us at legal@forma.com
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;