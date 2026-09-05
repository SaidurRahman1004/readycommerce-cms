import AuthForm from '@/components/auth/auth-form';
import AuthVisual from '@/components/auth/auth-visual';

export default function RegisterPage() { return <main className="flex min-h-screen flex-col bg-[#fafbff] lg:flex-row"><div className="flex flex-1 items-center justify-center"><AuthForm mode="register" /></div><AuthVisual /></main>; }
