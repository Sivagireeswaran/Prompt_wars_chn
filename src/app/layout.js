import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'RecovrAI — AI-Powered Recovery & Prevention Platform',
  description:
    'A multi-modal, GenAI-powered recovery and prevention platform supporting individuals navigating substance use disorders and their caregivers.',
  keywords: 'recovery, substance use, AI, mental health, crisis support, prevention',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
