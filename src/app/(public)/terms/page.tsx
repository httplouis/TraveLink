import Link from "next/link";
import { FileText, AlertCircle, Shield, Users, Ban, CheckCircle } from "lucide-react";

export const metadata = { 
  title: "Terms of Service • TraviLink",
  description: "TraviLink Terms of Service - Guidelines and rules for using the travel order and seminar application management system"
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#7A0010] rounded-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
              <p className="text-sm text-gray-600 mt-1">
                Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed">
            These Terms of Service ("Terms") govern your access to and use of TraviLink, a web-based system for managing travel orders and seminar applications operated by Manuel S. Enverga University Foundation (MSEUF). By accessing or using TraviLink, you agree to be bound by these Terms.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-[#7A0010]" />
              1. Acceptance of Terms
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                By accessing or using TraviLink, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these Terms, you must not use TraviLink.
              </p>
              <p className="mt-4">
                These Terms apply to all users of TraviLink, including faculty members, staff, administrators, department heads, and other authorized personnel of Manuel S. Enverga University Foundation.
              </p>
            </div>
          </section>

          {/* 2. Eligibility and Account Requirements */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-[#7A0010]" />
              2. Eligibility and Account Requirements
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 mt-4">2.1 Authorized Users</h3>
              <p>TraviLink is available only to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Current faculty members and staff of Manuel S. Enverga University Foundation</li>
                <li>Authorized administrators and personnel</li>
                <li>Users with valid university email accounts (@mseuf.edu.ph)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6">2.2 Account Responsibility</h3>
              <p>You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Ensuring your account information is accurate and up-to-date</li>
                <li>Notifying the system administrator immediately of any unauthorized access</li>
                <li>Using only your own account and not sharing credentials with others</li>
              </ul>
            </div>
          </section>

          {/* 3. Acceptable Use */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#7A0010]" />
              3. Acceptable Use
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>You agree to use TraviLink only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Use the system for any illegal or unauthorized purpose</li>
                <li>Submit false, misleading, or fraudulent information</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Attempt to gain unauthorized access to the system or other users' accounts</li>
                <li>Interfere with or disrupt the system's operation or security</li>
                <li>Upload malicious code, viruses, or harmful files</li>
                <li>Use automated systems (bots, scrapers) to access the system without permission</li>
                <li>Reverse engineer, decompile, or attempt to extract source code</li>
                <li>Violate any applicable laws, regulations, or university policies</li>
                <li>Use the system to harass, abuse, or harm others</li>
              </ul>
            </div>
          </section>

          {/* 4. Request Submission and Accuracy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Request Submission and Accuracy</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 mt-4">4.1 Information Accuracy</h3>
              <p>You are responsible for ensuring that all information submitted through TraviLink is:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Accurate, complete, and truthful</li>
                <li>Up-to-date and relevant to your request</li>
                <li>Compliant with university policies and procedures</li>
                <li>Properly authorized and supported by necessary documentation</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6">4.2 Request Approval</h3>
              <p>
                Submission of a request through TraviLink does not guarantee approval. All requests are subject to review and approval by authorized personnel according to university policies and procedures. The university reserves the right to approve, reject, or request modifications to any request.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mt-6">4.3 Request Modifications</h3>
              <p>
                You may be able to modify or cancel requests that are in draft status or pending initial approval. Once a request enters the approval workflow, modifications may require returning the request for changes through the appropriate channels.
              </p>
            </div>
          </section>

          {/* 5. User Roles and Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. User Roles and Responsibilities</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 mt-4">5.1 Faculty/Staff Users</h3>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Create and submit travel orders and seminar applications</li>
                <li>Invite additional requesters when appropriate</li>
                <li>Respond to invitation requests in a timely manner</li>
                <li>Provide accurate information and supporting documents</li>
                <li>Comply with approval decisions and requirements</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6">5.2 Department Heads</h3>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Review and approve requests from department members</li>
                <li>Endorse requests involving faculty from other departments</li>
                <li>Route approved requests to appropriate administrators</li>
                <li>Return requests for changes when necessary</li>
                <li>Make decisions in accordance with university policies</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6">5.3 Administrators</h3>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Process approved requests</li>
                <li>Assign drivers and vehicles appropriately</li>
                <li>Manage system resources and configurations</li>
                <li>Ensure compliance with policies and procedures</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6">5.4 Approvers (Comptroller, HR, VP, President)</h3>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Review requests according to their authority level</li>
                <li>Make approval decisions based on policies and guidelines</li>
                <li>Provide clear feedback when returning requests</li>
                <li>Maintain confidentiality of request information</li>
              </ul>
            </div>
          </section>

          {/* 6. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                TraviLink, including its design, functionality, code, and content, is the property of Manuel S. Enverga University Foundation. All rights are reserved. You may not:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Copy, modify, or distribute the system or its components</li>
                <li>Use TraviLink for commercial purposes without authorization</li>
                <li>Remove or alter any copyright, trademark, or proprietary notices</li>
                <li>Create derivative works based on TraviLink</li>
              </ul>
              <p className="mt-4">
                Content you submit through TraviLink (requests, documents, etc.) remains your property, but you grant MSEUF the right to use, store, and process such content for system operation and administrative purposes.
              </p>
            </div>
          </section>

          {/* 7. Prohibited Activities */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Ban className="w-6 h-6 text-[#7A0010]" />
              7. Prohibited Activities
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>The following activities are strictly prohibited:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Submitting fraudulent or falsified requests</li>
                <li>Circumventing approval processes or system controls</li>
                <li>Attempting to access or modify other users' requests without authorization</li>
                <li>Using the system to violate university policies or codes of conduct</li>
                <li>Sharing account credentials with unauthorized persons</li>
                <li>Interfering with system security or performance</li>
                <li>Collecting or harvesting user information without permission</li>
                <li>Using the system for personal commercial gain</li>
              </ul>
            </div>
          </section>

          {/* 8. System Availability and Modifications */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. System Availability and Modifications</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 mt-4">8.1 Availability</h3>
              <p>
                We strive to maintain system availability but do not guarantee uninterrupted or error-free operation. The system may be unavailable due to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Scheduled maintenance</li>
                <li>Technical issues or system updates</li>
                <li>Network problems</li>
                <li>Force majeure events</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6">8.2 Modifications</h3>
              <p>
                MSEUF reserves the right to modify, suspend, or discontinue TraviLink or any part thereof at any time with or without notice. We may also modify these Terms at any time, and your continued use constitutes acceptance of modified Terms.
              </p>
            </div>
          </section>

          {/* 9. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-[#7A0010]" />
              9. Limitation of Liability
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                To the maximum extent permitted by law, Manuel S. Enverga University Foundation and its officers, employees, and agents shall not be liable for:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Any indirect, incidental, special, or consequential damages</li>
                <li>Loss of data, profits, or business opportunities</li>
                <li>System downtime or unavailability</li>
                <li>Errors or omissions in system content or functionality</li>
                <li>Unauthorized access to or alteration of your data</li>
                <li>Delays in request processing or approval</li>
              </ul>
              <p className="mt-4">
                Your use of TraviLink is at your own risk. The system is provided "as is" without warranties of any kind, express or implied.
              </p>
            </div>
          </section>

          {/* 10. Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                MSEUF reserves the right to suspend or terminate your access to TraviLink at any time, with or without cause or notice, for:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Violation of these Terms of Service</li>
                <li>Violation of university policies or codes of conduct</li>
                <li>Fraudulent or illegal activity</li>
                <li>Unauthorized access attempts</li>
                <li>End of employment or affiliation with the university</li>
              </ul>
              <p className="mt-4">
                Upon termination, your right to use TraviLink will immediately cease. You may request export of your data before termination, subject to university policies and legal requirements.
              </p>
            </div>
          </section>

          {/* 11. Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                These Terms of Service shall be governed by and construed in accordance with the laws of the Republic of the Philippines. Any disputes arising from or relating to these Terms or your use of TraviLink shall be subject to the exclusive jurisdiction of the courts of Quezon Province, Philippines.
              </p>
            </div>
          </section>

          {/* 12. Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>If you have questions about these Terms of Service, please contact:</p>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="font-semibold text-gray-900">System Administrator</p>
                <p className="text-gray-700">Manuel S. Enverga University Foundation</p>
                <p className="text-gray-700">TraviLink Support</p>
                <p className="text-gray-700">Email: <a href="mailto:travelink@mseuf.edu.ph" className="text-[#7A0010] hover:underline">travelink@mseuf.edu.ph</a></p>
                <p className="text-gray-700">Address: Lucena City, Quezon, Philippines</p>
              </div>
            </div>
          </section>

          {/* Footer Links */}
          <div className="border-t pt-6 mt-8 flex flex-wrap gap-4 text-sm">
            <Link href="/privacy" className="text-[#7A0010] hover:underline">
              Privacy Policy
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
