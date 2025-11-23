import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                For any questions or concerns regarding this Privacy Policy, please contact our team:
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
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground mb-4">
                Welcome to Parametric Furniture ("we," "our," or "us"). We are committed to protecting your personal information 
                and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you visit our website and use our services.
              </p>
              <p className="text-muted-foreground">
                By using our platform, you agree to the collection and use of information in accordance with this policy. 
                If you do not agree with our policies and practices, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-3">2.1 Personal Information</h3>
              <p className="text-muted-foreground mb-4">
                We collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Register for an account (name, email address, phone number)</li>
                <li>Sign up as a designer (portfolio URL, design background, bank details for payments)</li>
                <li>Make a purchase (shipping address, payment information)</li>
                <li>Contact us for support or inquiries</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">2.2 Automatically Collected Information</h3>
              <p className="text-muted-foreground mb-4">
                When you access our platform, we automatically collect certain information including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, features used)</li>
                <li>Location information (general location based on IP address)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Provide, operate, and maintain our platform</li>
                <li>Process your transactions and manage your orders</li>
                <li>Create and manage your account</li>
                <li>Send you notifications about your orders, products, and account</li>
                <li>Process designer applications and manage designer accounts</li>
                <li>Calculate and distribute earnings to designers</li>
                <li>Improve and personalize your experience</li>
                <li>Communicate with you about updates, promotions, and support</li>
                <li>Detect, prevent, and address technical issues or fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Data Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-semibold mb-3">4.1 With Your Consent</h3>
              <p className="text-muted-foreground mb-4">
                We may share your information with third parties when you give us explicit consent to do so.
              </p>

              <h3 className="text-xl font-semibold mb-3">4.2 Service Providers</h3>
              <p className="text-muted-foreground mb-4">
                We share information with service providers who help us operate our platform, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Payment processors (for secure payment handling)</li>
                <li>Email service providers (for transactional and marketing emails)</li>
                <li>Cloud hosting services (for data storage and processing)</li>
                <li>Analytics providers (to understand platform usage)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">4.3 Designers and Customers</h3>
              <p className="text-muted-foreground mb-4">
                When you purchase a product, we share necessary information with the designer (your name and shipping details) 
                to fulfill the order. Designer profiles and products are publicly visible on our platform.
              </p>

              <h3 className="text-xl font-semibold mb-3">4.4 Legal Requirements</h3>
              <p className="text-muted-foreground">
                We may disclose your information if required to do so by law or in response to valid requests by public authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure payment processing through certified providers</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your data, 
                we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Your Privacy Rights</h2>
              <p className="text-muted-foreground mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Objection:</strong> Object to processing of your personal information</li>
                <li><strong>Restriction:</strong> Request restriction of processing your information</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent where we rely on it</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, please contact us using the information provided at the top of this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Cookies and Tracking</h2>
              <p className="text-muted-foreground mb-4">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Maintain your session and keep you logged in</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze platform usage and improve functionality</li>
                <li>Provide personalized content and recommendations</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                You can control cookies through your browser settings. However, disabling cookies may affect your ability 
                to use certain features of our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in this policy, 
                comply with legal obligations, resolve disputes, and enforce our agreements. When we no longer need your information, 
                we will securely delete or anonymize it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information 
                from children. If you become aware that a child has provided us with personal information, please contact us, 
                and we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your country of residence. 
                These countries may have different data protection laws. We ensure appropriate safeguards are in place to 
                protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
                Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy 
                periodically for any changes. Changes are effective when posted on this page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
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

export default PrivacyPolicy;
