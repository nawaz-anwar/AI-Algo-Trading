import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';

export function RootLayout() {
  return (
    <div className="flex min-h-screen bg-[#0F172A]">
      <Sidebar />
      <main className="flex-1 ml-60">
        <div className="w-full h-[900px] overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
