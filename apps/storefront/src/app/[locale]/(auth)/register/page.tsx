import AuthForm from '@/components/auth/auth-form';
import AuthVisual from '@/components/auth/auth-visual';

export default function RegisterPage() { return <main className="flex min-h-screen flex-col bg-[#fafbff] lg:flex-row"><AuthForm mode="register" /><AuthVisual /></main>; }
