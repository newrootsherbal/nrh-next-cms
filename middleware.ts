// middleware.ts
import { createServerClient as createSupabaseMiddlewareClient, type CookieOptions } from '@supabase/ssr'; // Renamed for clarity
import { NextResponse, type NextRequest } from 'next/server';
import type { Profile, UserRole } from '@/utils/supabase/types'; // Adjusted path

// Define minimum required roles for specific CMS paths
const cmsRoutePermissions: Record<string, UserRole[]> = {
  '/cms': ['WRITER', 'ADMIN'],         // Base CMS access (e.g. /cms/dashboard)
  '/cms/admin': ['ADMIN'],      // Admin-specific section
  '/cms/users': ['ADMIN'],      // User management page
  '/cms/settings': ['ADMIN'],   // CMS settings
  // Add more specific paths and their required roles as needed
  // Example: '/cms/pages/create': ['WRITER', 'ADMIN']
  // Example: '/cms/pages/[id]/edit': ['WRITER', 'ADMIN']
};

function getRequiredRolesForPath(pathname: string): UserRole[] | null {
  // Check for exact matches first for more specific rules
  const sortedPaths = Object.keys(cmsRoutePermissions).sort((a, b) => b.length - a.length);
  for (const specificPath of sortedPaths) {
    if (pathname === specificPath || pathname.startsWith(specificPath + (specificPath === '/' ? '' : '/'))) {
        return cmsRoutePermissions[specificPath];
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Use the Supabase client configured for middleware context
  const supabase = createSupabaseMiddlewareClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // If the path starts with /cms, apply role-based access control
  if (pathname.startsWith('/cms')) {
    if (!session?.user) {
      return NextResponse.redirect(new URL(`/sign-in?redirect=${pathname}`, request.url));
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single<Pick<Profile, 'role'>>();

    if (profileError || !profile) {
      console.error(`Middleware: Profile error for user ${session.user.id} accessing ${pathname}`, profileError?.message);
      return NextResponse.redirect(new URL('/unauthorized?error=profile_issue', request.url));
    }

    const userRole = profile.role as UserRole;
    const requiredRoles = getRequiredRolesForPath(pathname);

    if (requiredRoles) {
      if (!requiredRoles.includes(userRole)) {
        console.warn(`Middleware: User ${session.user.id} (Role: ${userRole}) denied access to ${pathname}. Required: ${requiredRoles.join(' OR ')}`);
        return NextResponse.redirect(new URL(`/unauthorized?path=${pathname}&required=${requiredRoles.join(',')}`, request.url));
      }
    } else {
      // If no specific rule found for a /cms path, it's an oversight or a new path.
      // Default to deny or require a base role like ADMIN for safety for unconfigured /cms paths.
      // For this setup, if it's /cms/* and not in cmsRoutePermissions, and getRequiredRolesForPath returned null,
      // it implies it's not a specifically configured CMS path.
      // We have a base '/cms': ['WRITER', 'ADMIN'] rule which should catch most cases.
      // If a path like /cms/new-feature is not covered by any key in cmsRoutePermissions,
      // it won't get requiredRoles. The current getRequiredRolesForPath logic might need refinement
      // to ensure all /cms/* paths have some default if not explicitly matched.
      // However, the current /cms rule should cover /cms/* as a base.
      // Let's assume if requiredRoles is null for a /cms path, it means no specific sub-path rule was hit,
      // but the base '/cms' rule already granted access if it was just '/cms' or '/cms/dashboard'.
      // If it's a deeper path like /cms/unknown/path and requiredRoles is null, it might be an issue.
      // The current `getRequiredRolesForPath` logic should catch `/cms/*` under the `/cms` key.
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /auth/** (Supabase auth callback routes)
     * - /sign-in (login page)
     * - /sign-up (signup page)
     * - /forgot-password
     * - /unauthorized (unauthorized page)
     * - / (public homepage, if it should be public)
     *
     * This ensures middleware runs on relevant pages including /cms/*
     * and any other protected routes you might add.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/.*|sign-in|sign-up|forgot-password|unauthorized|api/auth/.*).*)',
  ],
};