'use client';

import {Toaster} from 'react-hot-toast';

export default function ToastProvider() {
  return <Toaster position="top-center" toastOptions={{duration: 3500, style: {borderRadius: '14px', background: '#0f172a', color: '#fff', fontSize: '14px'}}} />;
}
