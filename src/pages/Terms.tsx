import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Terms & Conditions</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                For any questions or support regarding these Terms & Conditions, please contact:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">Shubham Malpani</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href="tel:+919619383240" className="hover:underline">+91 96193 83240</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href="mailto:shubham.malpani@cyanique.com" className="hover:underline">
                        shubham.malpani@cyanique.com
                      </a>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">Tejal Agawane</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href="tel:+918779518787" className="hover:underline">+91 87795 18787</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href="mailto:tejal.agawane@cyanique.com" className="hover:underline">
                        tejal.agawane@cyanique.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By creating an account, browsing products, or making purchases on Parametric Furniture, you acknowledge 
                that you have read, understood, and agree to be bound by these Terms & Conditions and our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. User Content & Ownership</h2>
              <p className="text-muted-foreground mb-4">
                By uploading or submitting any design, image, or file ("Content") to our platform, you represent and warrant that:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>You are the sole owner of the Content, or</li>
                <li>You have obtained all necessary rights, licenses, or permissions to use and share the Content</li>
              </ul>
              <p className="text-muted-foreground">
                You retain ownership of your Content, but by submitting it to Parametric Furniture, you grant us a non-exclusive, 
                royalty-free, worldwide license to display, reproduce, and sell products derived from the Content on our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Designer Terms</h2>
              
              <h3 className="text-xl font-semibold mb-3">3.1 Designer Application</h3>
              <p className="text-muted-foreground mb-4">
                To become a designer on our platform, you must submit an application with accurate information. 
                We reserve the right to approve or reject applications at our discretion.
              </p>

              <h3 className="text-xl font-semibold mb-3">3.2 Product Submission</h3>
              <p className="text-muted-foreground mb-4">
                Designers must ensure that:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>All submitted designs are original or properly licensed</li>
                <li>Products meet our quality and sustainability standards</li>
                <li>Product descriptions and specifications are accurate</li>
                <li>Images are high-quality and represent the actual product</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">3.3 Intellectual Property</h3>
              <p className="text-muted-foreground mb-4">
                You agree not to upload Content that infringes upon the intellectual property rights of others. 
                Parametric Furniture does not pre-screen user uploads. If you believe your IP has been infringed, 
                please contact us and we will review and take appropriate action.
              </p>

              <h3 className="text-xl font-semibold mb-3">3.4 Pricing and Earnings</h3>
              <p className="text-muted-foreground mb-4">
                Designers set their own selling prices above the Manufacturing Base Price (MBP) calculated by our platform. Designers earn 70% of the markup (difference between their selling price and MBP). The platform retains 30% of the markup to cover operations, customer support, and infrastructure. In cases where dynamic pricing reduces a product to the Manufacturing Base Price due to low sales, designers will earn 5-8% commission on base price sales.
              </p>

              <h3 className="text-xl font-semibold mb-3">3.5 Payments</h3>
              <p className="text-muted-foreground">
                Designer earnings are calculated after each sale. You must provide valid bank details for payment 
                processing. Minimum payout threshold applies as specified in your dashboard.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Customer Terms</h2>
              
              <h3 className="text-xl font-semibold mb-3">4.1 Orders and Payment</h3>
              <p className="text-muted-foreground mb-4">
                By placing an order, you agree to pay the listed price plus applicable taxes and shipping fees. 
                All payments are processed securely through our payment partners.
              </p>

              <h3 className="text-xl font-semibold mb-3">4.2 Shipping and Delivery</h3>
              <p className="text-muted-foreground mb-4">
                Delivery times are estimates and may vary. We work with designers and manufacturers to fulfill 
                orders in a timely manner. Custom furniture typically requires 21-45 days for production and delivery.
              </p>

              <h3 className="text-xl font-semibold mb-3">4.3 Returns and Refunds</h3>
              <p className="text-muted-foreground">
                Due to the custom nature of our products, returns are only accepted for damaged or defective items. 
                Please inspect your order upon delivery and contact us within 7 days if there are any issues.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. User Accounts</h2>
              <p className="text-muted-foreground mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Providing accurate and current information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Prohibited Activities</h2>
              <p className="text-muted-foreground mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Use the platform for any illegal purpose</li>
                <li>Submit false, misleading, or fraudulent information</li>
                <li>Infringe on intellectual property rights</li>
                <li>Attempt to manipulate pricing or reviews</li>
                <li>Interfere with the platform's operation or security</li>
                <li>Scrape or collect data without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Responsibility & Liability</h2>
              <p className="text-muted-foreground mb-4">
                You acknowledge and agree that you are solely responsible for any Content you upload.
              </p>
              <p className="text-muted-foreground">
                Parametric Furniture will not be held liable for any claims, damages, or disputes arising from Content 
                uploaded by users. To the maximum extent permitted by law, we shall not be liable for any indirect, 
                incidental, special, or consequential damages arising from your use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Indemnification</h2>
              <p className="text-muted-foreground mb-4">
                You agree to indemnify, defend, and hold harmless Parametric Furniture, its affiliates, employees, 
                and partners from any claim, liability, damage, cost, or expense (including legal fees) arising from:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Your uploaded Content</li>
                <li>Any violation of these Terms</li>
                <li>Your use of the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Content Removal & Enforcement</h2>
              <p className="text-muted-foreground mb-4">Parametric Furniture reserves the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Remove or disable access to any Content suspected of infringing IP rights</li>
                <li>Suspend or terminate accounts involved in repeated violations</li>
                <li>Comply with applicable legal obligations</li>
                <li>Modify, suspend, or discontinue any aspect of our platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Dispute Resolution</h2>
              <p className="text-muted-foreground">
                Any disputes arising from these terms shall be resolved through good faith negotiation. If resolution 
                cannot be reached, disputes shall be subject to the applicable laws and jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these Terms & Conditions from time to time. We will notify you of significant changes 
                by posting a notice on the platform or sending an email. Continued use after changes constitutes 
                acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                For questions, concerns, or support regarding these Terms & Conditions:
              </p>
              <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                <div>
                  <p className="font-semibold">Shubham Malpani</p>
                  <p className="text-sm text-muted-foreground">Phone: +91 90825 82002</p>
                  <p className="text-sm text-muted-foreground">Email: shubham.malpani@cyanique.com</p>
                </div>
                <div className="border-t pt-3">
                  <p className="font-semibold">Tejal Agawane</p>
                  <p className="text-sm text-muted-foreground">Phone: +91 87795 18787</p>
                  <p className="text-sm text-muted-foreground">Email: tejal.agawane@cyanique.com</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
