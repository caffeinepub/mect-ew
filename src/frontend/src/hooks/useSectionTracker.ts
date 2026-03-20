import { useEffect, useRef } from "react";
import type { CountryInfo } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// Module-level cache so geolocation is only fetched once per session
let cachedCountry: CountryInfo | null = null;
let geoFetchStarted = false;
let geoResolvers: Array<(c: CountryInfo) => void> = [];

async function startGeoFetch() {
  if (geoFetchStarted) return;
  geoFetchStarted = true;

  const fallback: CountryInfo = { code: "XX", name: "Desconocido" };
  const TIMEOUT = 5000;

  const tryFetch = async (
    url: string,
    parse: (d: unknown) => CountryInfo | null,
  ): Promise<CountryInfo | null> => {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), TIMEOUT);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(tid);
      if (!res.ok) return null;
      const data = await res.json();
      return parse(data);
    } catch {
      return null;
    }
  };

  const apis = [
    () =>
      tryFetch("https://ipwho.is/", (d: unknown) => {
        const data = d as Record<string, unknown>;
        if (data?.success && data?.country && data?.country_code)
          return {
            code: String(data.country_code),
            name: String(data.country),
          };
        return null;
      }),
    () =>
      tryFetch("https://ipapi.co/json/", (d: unknown) => {
        const data = d as Record<string, unknown>;
        if (data?.country_code && data?.country_name)
          return {
            code: String(data.country_code),
            name: String(data.country_name),
          };
        return null;
      }),
    () =>
      tryFetch("https://freeipapi.com/api/json/", (d: unknown) => {
        const data = d as Record<string, unknown>;
        if (data?.countryCode && data?.countryName)
          return {
            code: String(data.countryCode),
            name: String(data.countryName),
          };
        return null;
      }),
    () =>
      tryFetch("https://api.country.is/", (d: unknown) => {
        const data = d as Record<string, unknown>;
        if (data?.country)
          return { code: String(data.country), name: String(data.country) };
        return null;
      }),
  ];

  let result: CountryInfo = fallback;
  for (const api of apis) {
    const r = await api();
    if (r) {
      result = r;
      break;
    }
  }

  cachedCountry = result;
  for (const fn of geoResolvers) {
    fn(result);
  }
  geoResolvers = [];
}

function getCountry(): Promise<CountryInfo> {
  if (cachedCountry) return Promise.resolve(cachedCountry);
  startGeoFetch();
  return new Promise((resolve) => geoResolvers.push(resolve));
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
    // Kick off geolocation immediately so it's ready when we need it
    startGeoFetch();

    const enterTime = Date.now();
    let recorded = false;

    const doRecord = async () => {
      if (recorded) return;

      // Skip admins (identity present = admin logged in)
      if (identityRef.current) return;

      const currentActor = actorRef.current;
      if (!currentActor) return;

      recorded = true;

      // Race between actual geolocation and a 3s fallback
      const country = await Promise.race([
        getCountry(),
        new Promise<CountryInfo>((resolve) =>
          setTimeout(() => resolve({ code: "XX", name: "Desconocido" }), 3000),
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

    // Primary: record after 3 seconds on page
    const timer = setTimeout(doRecord, 3000);

    // Fallback: record when user leaves (if not already recorded)
    const handleUnload = () => {
      if (recorded || identityRef.current) return;
      const currentActor = actorRef.current;
      if (!currentActor) return;
      const country = cachedCountry ?? { code: "XX", name: "Desconocido" };
      const duration = Math.max(1, Math.round((Date.now() - enterTime) / 1000));
      // Fire-and-forget on unload
      currentActor
        .recordSectionVisit(sectionName, country, BigInt(duration))
        .catch(() => {});
      recorded = true;
    };

    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") handleUnload();
    });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [sectionName]);
}
