import Link from "next/link";
import { Shield, Lock, Eye, FileText, Mail, Calendar } from "lucide-react";

export const metadata = { 
  title: "Privacy Policy • TraviLink",
  description: "TraviLink Privacy Policy - How we collect, use, and protect your data in compliance with RA 10173 (Data Privacy Act of the Philippines)"
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#7A0010] rounded-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-sm text-gray-600 mt-1">
                Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed">
            TraviLink is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, and protect your information in compliance with <strong>Republic Act No. 10173</strong> (Data Privacy Act of the Philippines) and other applicable data protection laws.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {/* 1. Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#7A0010]" />
              1. Introduction
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                Manuel S. Enverga University Foundation (MSEUF) operates TraviLink, a web-based system for managing travel orders and seminar applications. This Privacy Policy applies to all users of the TraviLink system, including faculty members, staff, administrators, and other authorized personnel.
              </p>
              <p className="mt-4">
                By using TraviLink, you acknowledge that you have read, understood, and agree to the collection and use of your information as described in this Privacy Policy.
              </p>
            </div>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-[#7A0010]" />
              2. Information We Collect
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 mt-4">2.1 Personal Information</h3>
              <p>We collect the following personal information:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Identity Information:</strong> Name, employee ID, email address, phone number</li>
                <li><strong>Professional Information:</strong> Department, position, role, employment status</li>
                <li><strong>Account Information:</strong> Login credentials, authentication tokens, session data</li>
                <li><strong>Profile Information:</strong> Profile picture, signature (digital), contact details</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6">2.2 Request-Related Information</h3>
              <p>When you create travel orders or seminar applications, we collect:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Travel details (destination, dates, purpose, budget)</li>
                <li>Seminar information (title, venue, dates, expenses)</li>
                <li>Participant and requester information</li>
                <li>Supporting documents and attachments</li>
                <li>Approval workflow data and signatures</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6">2.3 Usage Information</h3>
              <p>We automatically collect certain information when you use TraviLink:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Pages visited and actions taken</li>
                <li>Date and time of access</li>
                <li>System logs and error reports</li>
              </ul>
            </div>
          </section>

          {/* 3. How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-[#7A0010]" />
              3. How We Use Your Information
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>We use your personal information for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>System Operation:</strong> To provide, maintain, and improve TraviLink services</li>
                <li><strong>Request Processing:</strong> To process, route, and manage travel orders and seminar applications</li>
                <li><strong>Workflow Management:</strong> To facilitate approval workflows and notifications</li>
                <li><strong>Communication:</strong> To send email notifications, invitations, and system updates</li>
                <li><strong>Authentication:</strong> To verify your identity and manage access to the system</li>
                <li><strong>Resource Management:</strong> To assign drivers and vehicles for approved requests</li>
                <li><strong>Reporting:</strong> To generate reports and analytics for administrative purposes</li>
                <li><strong>Compliance:</strong> To comply with legal obligations and university policies</li>
                <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security threats</li>
              </ul>
            </div>
          </section>

          {/* 4. Data Sharing and Disclosure */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Within the University:</strong> With authorized personnel who need access to process your requests (department heads, administrators, approvers)</li>
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist in system operation (hosting, email services) under strict confidentiality agreements</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                <li><strong>Protection of Rights:</strong> To protect the rights, property, or safety of the university, users, or others</li>
                <li><strong>With Your Consent:</strong> When you have explicitly given consent for specific sharing</li>
              </ul>
            </div>
          </section>

          {/* 5. Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#7A0010]" />
              5. Data Security
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>We implement appropriate technical and organizational security measures to protect your personal information:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Encryption:</strong> Data transmission is encrypted using SSL/TLS protocols</li>
                <li><strong>Authentication:</strong> Secure authentication mechanisms including password hashing and session management</li>
                <li><strong>Access Controls:</strong> Role-based access control (RBAC) and Row Level Security (RLS) policies</li>
                <li><strong>Database Security:</strong> Secure database hosting with regular backups and access logging</li>
                <li><strong>Input Validation:</strong> Protection against SQL injection, XSS, and other security vulnerabilities</li>
                <li><strong>Regular Updates:</strong> System and security updates applied regularly</li>
                <li><strong>Audit Logging:</strong> Comprehensive logging of system access and data modifications</li>
              </ul>
              <p className="mt-4">
                While we strive to protect your information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security but are committed to maintaining industry-standard security practices.
              </p>
            </div>
          </section>

          {/* 6. Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[#7A0010]" />
              6. Data Retention
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law or university policy:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Active Accounts:</strong> Personal information is retained while your account is active</li>
                <li><strong>Request Records:</strong> Travel orders and seminar applications are retained for record-keeping and audit purposes</li>
                <li><strong>Legal Requirements:</strong> Some information may be retained longer if required by law or university policy</li>
                <li><strong>Deletion:</strong> Upon account deletion or request, we will delete or anonymize your personal information, subject to legal retention requirements</li>
              </ul>
            </div>
          </section>

          {/* 7. Your Rights Under RA 10173 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights Under RA 10173</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>Under the Data Privacy Act of the Philippines (RA 10173), you have the following rights:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Right to be Informed:</strong> You have the right to know what personal information we collect and how it is used</li>
                <li><strong>Right to Access:</strong> You can request access to your personal information held by us</li>
                <li><strong>Right to Object:</strong> You can object to the processing of your personal information for certain purposes</li>
                <li><strong>Right to Erasure or Blocking:</strong> You can request deletion or blocking of your personal information under certain circumstances</li>
                <li><strong>Right to Damages:</strong> You may claim damages if you suffer due to inaccurate, incomplete, outdated, false, or unlawfully obtained personal information</li>
                <li><strong>Right to Data Portability:</strong> You can request a copy of your data in a structured, commonly used format</li>
                <li><strong>Right to File a Complaint:</strong> You can file a complaint with the National Privacy Commission (NPC) if you believe your data privacy rights have been violated</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us using the information provided in Section 9.
              </p>
            </div>
          </section>

          {/* 8. Cookies and Tracking */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies and Tracking</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>TraviLink uses essential cookies and session storage to maintain your login session and improve your experience:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Session Cookies:</strong> Required for authentication and maintaining your login state</li>
                <li><strong>Preference Cookies:</strong> Store your preferences and settings</li>
                <li><strong>Security Cookies:</strong> Help protect against unauthorized access</li>
              </ul>
              <p className="mt-4">
                You can control cookies through your browser settings, but disabling essential cookies may affect system functionality.
              </p>
            </div>
          </section>

          {/* 9. Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-[#7A0010]" />
              9. Contact Information
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>If you have questions, concerns, or wish to exercise your data privacy rights, please contact:</p>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="font-semibold text-gray-900">Data Protection Officer</p>
                <p className="text-gray-700">Manuel S. Enverga University Foundation</p>
                <p className="text-gray-700">Email: <a href="mailto:travelink@mseuf.edu.ph" className="text-[#7A0010] hover:underline">travelink@mseuf.edu.ph</a></p>
                <p className="text-gray-700">Address: Lucena City, Quezon, Philippines</p>
              </div>
              <p className="mt-4">
                For technical support or system-related inquiries, please contact us at <a href="mailto:travelink@mseuf.edu.ph" className="text-[#7A0010] hover:underline">travelink@mseuf.edu.ph</a> or your system administrator.
              </p>
            </div>
          </section>

          {/* 10. Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Posting the updated policy on this page</li>
                <li>Updating the "Last Updated" date</li>
                <li>Sending email notifications for significant changes</li>
              </ul>
              <p className="mt-4">
                Your continued use of TraviLink after such changes constitutes acceptance of the updated Privacy Policy.
              </p>
            </div>
          </section>

          {/* Footer Links */}
          <div className="border-t pt-6 mt-8 flex flex-wrap gap-4 text-sm">
            <Link href="/terms" className="text-[#7A0010] hover:underline">
              Terms of Service
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="/login" className="text-[#7A0010] hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
