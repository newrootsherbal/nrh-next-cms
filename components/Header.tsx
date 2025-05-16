// components/Header.tsx
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { getProfileWithRoleServerSide } from '@/utils/supabase/server';
import type { UserRole, NavigationItem } from '@/utils/supabase/types';
import HeaderAuth from '@/components/header-auth';
import LanguageSwitcher from './LanguageSwitcher';
import { getNavigationMenu } from '@/app/cms/navigation/actions'; // Import the new function
import { headers } from 'next/headers'; // To get current language

const DEFAULT_LOCALE_FOR_HEADER = 'en'; // Define a default locale

export default async function Header() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userRole: UserRole | null = null;
  if (user) {
    const profile = await getProfileWithRoleServerSide(user.id);
    userRole = profile?.role ?? null;
  }

  const canAccessCms = userRole === 'ADMIN' || userRole === 'WRITER';

  // Fetch navigation items
  const heads = await headers();
  const currentLocale = heads.get('x-user-locale') || DEFAULT_LOCALE_FOR_HEADER;
  let headerNavItems: NavigationItem[] = [];
  try {
    headerNavItems = await getNavigationMenu('HEADER', currentLocale);
  } catch (error) {
    console.error("Error fetching header navigation:", error);
    // Gracefully handle error, e.g. by leaving headerNavItems empty
  }
  
  // Simple function to render navigation items (can be expanded for hierarchy)
  const renderNavItems = (items: NavigationItem[]) => {
    return items.map(item => (
      <Link key={item.id} href={item.url} className="hover:underline px-3 py-2">
        {item.label}
      </Link>
    ));
  };

  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-7xl flex justify-between items-center p-3 text-sm">
        <div className="flex items-center">
          <Link href="/" className="hover:underline font-semibold">Home</Link>
          {/* Render dynamic navigation items */}
          {headerNavItems.length > 0 && (
            <div className="ml-6 flex items-baseline space-x-4">
              {renderNavItems(headerNavItems.filter(item => !item.parent_id))}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {canAccessCms && (
              <Link href="/cms/dashboard" className="hover:underline">CMS Dashboard</Link>
          )}
          <HeaderAuth />
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}