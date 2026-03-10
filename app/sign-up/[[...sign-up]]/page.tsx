import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Start Tracking
          </h1>
          <p className="text-gray-300">
            Create your account to master your money with AI
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-2xl bg-gray-800',
              headerTitle: 'text-white',
              headerSubtitle: 'text-gray-300',
              socialButtonsBlockButton: 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600',
              formButtonPrimary: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white',
              formFieldLabel: 'text-gray-300',
              formFieldInput: 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400',
              footerActionLink: 'text-indigo-400 hover:text-indigo-300',
              identityPreviewText: 'text-white',
              formFieldInputShowPasswordButton: 'text-gray-300',
            },
          }}
        />
      </div>
    </div>
  );
}
