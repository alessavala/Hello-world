"use client";

import { useEffect, useRef } from "react";
import { ApiError } from "@/lib/api";
import { translateApiError } from "@/lib/error-messages";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
    FB?: {
      init: (config: { appId: string; xfbml: boolean; version: string }) => void;
      login: (callback: (response: { authResponse?: { accessToken: string } }) => void, options: { scope: string }) => void;
    };
  }
}

let googleScriptPromise: Promise<void> | null = null;
function loadGoogleScript(): Promise<void> {
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("google script failed to load"));
      document.body.appendChild(script);
    });
  }
  return googleScriptPromise;
}

let facebookScriptPromise: Promise<void> | null = null;
function loadFacebookScript(): Promise<void> {
  if (!facebookScriptPromise) {
    facebookScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/es_LA/sdk.js";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("facebook script failed to load"));
      document.body.appendChild(script);
    });
  }
  return facebookScriptPromise;
}

interface Props {
  // Only used the first time this provider is linked to a brand-new
  // account (existing accounts ignore it and just log in).
  role?: UserRole;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function SocialLoginButtons({ role, onSuccess, onError }: Props) {
  const { loginWithGoogle, loginWithFacebook } = useAuth();
  const googleContainerRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef(role);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleContainerRef.current) return;
    // Runs once on mount to load the SDK and render its native button; the
    // callback below always reads the latest role via roleRef, so it never
    // goes stale even though this effect itself doesn't re-run.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time external script load + widget render, nothing here is render-derivable
    loadGoogleScript()
      .then(() => {
        if (!window.google || !googleContainerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            loginWithGoogle(response.credential, roleRef.current)
              .then(onSuccess)
              .catch((err) => onError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos iniciar sesión con Google."));
          },
        });
        window.google.accounts.id.renderButton(googleContainerRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          width: 320,
          text: "continue_with",
        });
      })
      .catch(() => onError("No pudimos cargar el botón de Google."));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only, see comment above
  }, []);

  useEffect(() => {
    if (!FACEBOOK_APP_ID) return;
    loadFacebookScript()
      .then(() => {
        window.FB?.init({ appId: FACEBOOK_APP_ID, xfbml: false, version: "v19.0" });
      })
      .catch(() => onError("No pudimos cargar el botón de Facebook."));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only, see comment above
  }, []);

  function handleFacebookClick() {
    if (!window.FB) return;
    window.FB.login((response) => {
      if (!response.authResponse?.accessToken) return; // user cancelled - nothing to report
      loginWithFacebook(response.authResponse.accessToken, roleRef.current)
        .then(onSuccess)
        .catch((err) => onError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos iniciar sesión con Facebook."));
    }, { scope: "email" });
  }

  if (!GOOGLE_CLIENT_ID && !FACEBOOK_APP_ID) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        o continuá con
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="flex flex-col items-center gap-2">
        {GOOGLE_CLIENT_ID && <div ref={googleContainerRef} />}
        {FACEBOOK_APP_ID && (
          <button
            type="button"
            onClick={handleFacebookClick}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold hover:bg-brand-pill/60"
          >
            Continuar con Facebook
          </button>
        )}
      </div>
    </div>
  );
}
