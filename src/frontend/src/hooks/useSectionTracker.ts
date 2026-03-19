import { useEffect, useRef } from "react";
import { useActor } from "./useActor";
import { useIsCallerAdmin } from "./useQueries";

export interface SectionVisit {
  section: string;
  country: string;
  countryCode: string;
  timestamp: number;
  duration: number;
}

let cachedCountry: { country: string; countryCode: string } | null = null;
let fetchingCountry = false;
const countryCallbacks: ((info: {
  country: string;
  countryCode: string;
}) => void)[] = [];

async function getVisitorCountry(): Promise<{
  country: string;
  countryCode: string;
}> {
  if (cachedCountry) return cachedCountry;

  return new Promise((resolve) => {
    countryCallbacks.push(resolve);

    if (!fetchingCountry) {
      fetchingCountry = true;

      // Try primary API, fallback to secondary
      const tryFetch = (
        url: string,
      ): Promise<{ country: string; countryCode: string }> =>
        fetch(url, { signal: AbortSignal.timeout(5000) })
          .then((res) => res.json())
          .then((data) => ({
            country: data.country_name || data.country || "Desconocido",
            countryCode: data.country_code || data.countryCode || "XX",
          }));

      tryFetch("https://ipapi.co/json/")
        .catch(() => tryFetch("https://api.country.is/"))
        .catch(() => ({ country: "Desconocido", countryCode: "XX" }))
        .then((info) => {
          cachedCountry = info;
          for (const cb of countryCallbacks) cb(info);
          countryCallbacks.length = 0;
        })
        .finally(() => {
          fetchingCountry = false;
        });
    }
  });
}

// Track which sections have already been recorded in this session to avoid duplicates
const recordedSections = new Set<string>();

export function useSectionTracker(sectionName: string) {
  const { data: isAdmin } = useIsCallerAdmin();
  const { actor } = useActor();
  const actorRef = useRef(actor);
  const isAdminRef = useRef(isAdmin);
  const enterTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  useEffect(() => {
    isAdminRef.current = isAdmin;
  }, [isAdmin]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — re-run when section or admin status changes
  useEffect(() => {
    // Skip tracking for admins
    if (isAdmin === true) return;

    enterTimeRef.current = Date.now();
    const sessionKey = sectionName;

    // Prefetch country immediately when page loads
    getVisitorCountry().catch(() => {});

    // Record visit after 4 seconds of being on the page.
    // This approach (entry-based) is more reliable than exit-based:
    // it captures visits even when the user closes the tab or navigates
    // to an external URL.
    const recordTimer = setTimeout(async () => {
      // Double-check admin status hasn't changed
      if (isAdminRef.current === true) return;
      // Avoid double-recording the same section in one session
      if (recordedSections.has(sessionKey)) return;

      const currentActor = actorRef.current;
      if (!currentActor) return;

      try {
        const countryInfo = await getVisitorCountry();
        const duration = Math.round((Date.now() - enterTimeRef.current) / 1000);
        await currentActor.recordSectionVisit(
          sectionName,
          { code: countryInfo.countryCode, name: countryInfo.country },
          BigInt(Math.max(duration, 4)),
        );
        recordedSections.add(sessionKey);
      } catch (err) {
        console.warn("Failed to record section visit:", err);
      }
    }, 4000);

    // Also attempt to record on page visibility hide (tab close / background)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Only record if not already recorded and enough time passed
        if (recordedSections.has(sessionKey)) return;
        if (isAdminRef.current === true) return;
        const elapsed = Math.round((Date.now() - enterTimeRef.current) / 1000);
        if (elapsed < 2) return;
        const currentActor = actorRef.current;
        if (!currentActor) return;

        // Use sendBeacon-style approach via cached country
        if (cachedCountry) {
          recordedSections.add(sessionKey); // mark immediately to avoid duplicate
          currentActor
            .recordSectionVisit(
              sectionName,
              { code: cachedCountry.countryCode, name: cachedCountry.country },
              BigInt(elapsed),
            )
            .catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(recordTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Allow re-recording if user navigates back to the same section later
      recordedSections.delete(sessionKey);
    };
  }, [sectionName, isAdmin]);
}
