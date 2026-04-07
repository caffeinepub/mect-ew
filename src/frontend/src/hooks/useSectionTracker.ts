import { useEffect, useRef } from "react";
import type { CountryInfo } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// Module-level cache so geolocation is only fetched once per session
let cachedCountry: CountryInfo | null = null;
let geoPromise: Promise<CountryInfo> | null = null;

const FALLBACK: CountryInfo = { code: "XX", name: "Desconocido" };

async function fetchWithTimeout(
  url: string,
  parse: (d: unknown) => CountryInfo | null,
  timeoutMs = 5000,
): Promise<CountryInfo | null> {
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);
    if (!res.ok) return null;
    const data = await res.json();
    return parse(data);
  } catch {
    return null;
  }
}

const GEO_APIS: Array<() => Promise<CountryInfo | null>> = [
  () =>
    fetchWithTimeout("https://ipwho.is/", (d: unknown) => {
      const data = d as Record<string, unknown>;
      if (data?.success && data?.country && data?.country_code)
        return { code: String(data.country_code), name: String(data.country) };
      return null;
    }),
  () =>
    fetchWithTimeout("https://ipapi.co/json/", (d: unknown) => {
      const data = d as Record<string, unknown>;
      if (data?.country_code && data?.country_name)
        return {
          code: String(data.country_code),
          name: String(data.country_name),
        };
      return null;
    }),
  () =>
    fetchWithTimeout("https://freeipapi.com/api/json/", (d: unknown) => {
      const data = d as Record<string, unknown>;
      if (data?.countryCode && data?.countryName)
        return {
          code: String(data.countryCode),
          name: String(data.countryName),
        };
      return null;
    }),
  () =>
    fetchWithTimeout("https://api.country.is/", (d: unknown) => {
      const data = d as Record<string, unknown>;
      if (data?.country)
        return { code: String(data.country), name: String(data.country) };
      return null;
    }),
];

/**
 * Concurrently queries all geo APIs and returns the first successful result.
 * Resolves to FALLBACK if none succeed within the timeout.
 */
function resolveCountry(): Promise<CountryInfo> {
  if (cachedCountry) return Promise.resolve(cachedCountry);

  if (!geoPromise) {
    geoPromise = new Promise<CountryInfo>((resolve) => {
      let settled = false;
      let remaining = GEO_APIS.length;

      const done = (result: CountryInfo) => {
        if (settled) return;
        settled = true;
        cachedCountry = result;
        resolve(result);
      };

      for (const api of GEO_APIS) {
        api().then((result) => {
          remaining--;
          if (result && !settled) {
            done(result);
          } else if (remaining === 0 && !settled) {
            done(FALLBACK);
          }
        });
      }

      // Hard ceiling: if none resolve in 10s, use fallback
      setTimeout(() => done(FALLBACK), 10_000);
    });
  }

  return geoPromise;
}

export function useSectionTracker(sectionName: string) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const actorRef = useRef(actor);
  const identityRef = useRef(identity);

  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);
  useEffect(() => {
    identityRef.current = identity;
  }, [identity]);

  useEffect(() => {
    // Kick off geo-fetch immediately so it has maximum time to resolve
    resolveCountry();

    const enterTime = Date.now();
    let recorded = false;

    const doRecord = async () => {
      if (recorded) return;
      // Skip admins (identity present = admin logged in)
      if (identityRef.current) return;

      const currentActor = actorRef.current;
      if (!currentActor) return;

      recorded = true;

      // Wait for geo with a 9s cap (generous — started immediately on mount)
      const country = await Promise.race([
        resolveCountry(),
        new Promise<CountryInfo>((resolve) =>
          setTimeout(() => resolve(FALLBACK), 9_000),
        ),
      ]);

      const duration = Math.max(1, Math.round((Date.now() - enterTime) / 1000));

      try {
        await currentActor.recordSectionVisit(
          sectionName,
          country,
          BigInt(duration),
        );
      } catch {
        // Silently ignore errors
      }
    };

    // Primary: record after 4 seconds on page (gives geo time to complete)
    const timer = setTimeout(doRecord, 4_000);

    // Fallback: record when user leaves (if not already recorded)
    const handleUnload = () => {
      if (recorded || identityRef.current) return;
      const currentActor = actorRef.current;
      if (!currentActor) return;
      const country = cachedCountry ?? FALLBACK;
      const duration = Math.max(1, Math.round((Date.now() - enterTime) / 1000));
      currentActor
        .recordSectionVisit(sectionName, country, BigInt(duration))
        .catch(() => {});
      recorded = true;
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") handleUnload();
    };

    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [sectionName]);
}
