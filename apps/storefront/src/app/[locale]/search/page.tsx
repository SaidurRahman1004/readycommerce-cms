import {Suspense} from 'react';
import SearchResults from '@/components/store/search-results';

export default function SearchPage() { return <Suspense fallback={<main className="min-h-screen bg-[#fafbff]" />}><SearchResults /></Suspense>; }
