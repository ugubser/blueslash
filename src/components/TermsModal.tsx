import React from 'react';
import { X } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="mario-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-mario-blue">Terms & Conditions</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6 text-sm text-gray-700 font-normal">
          <section>
            <h3 className="font-bold text-mario-blue mb-2">Terms of Service</h3>
            <p className="mb-4">
              Welcome to BlueSlash! By using our service, you agree to these terms. 
              BlueSlash is a household task management application that helps families 
              organize and gamify their daily tasks.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must be at least 13 years old to use this service</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You agree to use the service only for lawful purposes</li>
              <li>We reserve the right to modify or terminate the service at any time</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-mario-blue mb-2">Privacy Policy</h3>
            <p className="mb-4">
              We respect your privacy and are committed to protecting your personal data.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>We collect only necessary information to provide our service</li>
              <li>Your data is stored securely using Firebase services</li>
              <li>We do not sell or share your personal information with third parties</li>
              <li>You can request deletion of your data at any time</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-mario-blue mb-2">Cookie Policy</h3>
            <p className="mb-4">
              We use cookies and similar technologies to improve your experience.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Essential cookies are required for basic functionality</li>
              <li>Authentication cookies keep you signed in</li>
              <li>We do not use tracking or advertising cookies</li>
              <li>You can manage cookie preferences in your browser settings</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-mario-blue mb-2">Data Usage</h3>
            <p className="mb-4">
              Information we collect and how we use it:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Google account information for authentication</li>
              <li>Task and household data you create within the app</li>
              <li>Usage analytics to improve our service</li>
              <li>All data is processed in accordance with GDPR regulations</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-mario-blue mb-2">Contact</h3>
            <p>
              For questions about these terms or privacy concerns, please contact us 
              through our GitHub repository or email support.
            </p>
          </section>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="mario-button w-full"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;