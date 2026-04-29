import { Outlet } from 'react-router';

import logoSvg from '@documenso/assets/logo.svg';

export default function Layout() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 md:p-12 lg:p-24">
      <div className="mb-8">
        <img src={logoSvg} alt="Aplyio" className="h-12" />
      </div>
      <div className="relative flex w-full items-center justify-center">
        <Outlet />
      </div>
    </main>
  );
}
