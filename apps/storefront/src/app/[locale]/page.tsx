import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function Home() {
  const t = useTranslations('HomePage');
  
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 font-sans dark:bg-black text-black dark:text-white">
      <main className="flex flex-col items-center justify-center p-8 text-center max-w-2xl border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-10">{t('description')}</p>
        
        <div className="flex gap-4">
          <Link href="/" locale="en" className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-medium rounded-full hover:opacity-80 transition-opacity">
            English
          </Link>
          <Link href="/" locale="bn" className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-medium rounded-full hover:opacity-80 transition-opacity">
            বাংলা
          </Link>
        </div>
      </main>
    </div>
  );
}
