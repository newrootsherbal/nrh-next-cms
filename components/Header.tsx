// components/Header.tsx
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server'; // Correct path
import Link from 'next/link';
import { getProfileWithRoleServerSide } from '@/utils/supabase/server'; // Import server-side helper
import { UserRole } from '@/utils/supabase/types';
import HeaderAuth from '@/components/header-auth'; // Adjust the import path as necessary

export default async function Header() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userRole: UserRole | null = null;
  if (user) {
    const profile = await getProfileWithRoleServerSide(user.id);
    userRole = profile?.role ?? null;
  }

  const canAccessCms = userRole === 'ADMIN' || userRole === 'WRITER';

  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-7xl flex justify-between items-center p-3 text-sm">
        <Link href="/" className="hover:underline">Home</Link>
        {canAccessCms && (
            <Link href="/cms/dashboard" className="hover:underline">CMS Dashboard</Link>
        )}
        <HeaderAuth />
      </div>
    </nav>
  );
}