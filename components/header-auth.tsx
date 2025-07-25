'use client';

import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/TranslationsContext";
import { useLanguage } from "@/context/LanguageContext";

export default function AuthButton() {
  const { user, profile } = useAuth();
  const { t } = useTranslations();
  const username = profile?.username || null;

  if (!hasEnvVars) {
    return (
      <>
        <div className="flex gap-4 items-center">
          <div>
            <Badge
              variant={"default"}
              className="font-normal pointer-events-none"
            >
              {t('update_env_file_warning')}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              variant={"outline"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-in">{t('sign_in')}</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={"default"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-up">{t('sign_up')}</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }
  return user ? (
    <div className="flex items-center gap-4">
      {t('greeting', { username: username || user.email || 'User' })}
      <form action={signOutAction}>
        <Button type="submit" variant={"outline"}>
          {t('sign_out')}
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/sign-in">{t('sign_in')}</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/sign-up">{t('sign_up')}</Link>
      </Button>
    </div>
  );
}
