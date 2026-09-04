import AuthForm from '@/components/auth/auth-form';
import AuthVisual from '@/components/auth/auth-visual';

export default function LoginPage() { return <main className="flex min-h-screen flex-col bg-[#fafbff] lg:flex-row"><AuthForm mode="login" /><AuthVisual /></main>; }
