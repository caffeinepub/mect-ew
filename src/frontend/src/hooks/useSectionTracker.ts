import { useEffect, useRef } from "react";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";
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
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => {
          cachedCountry = {
            country: data.country_name || "Desconocido",
            countryCode: data.country_code || "XX",
          };
        })
        .catch(() => {
          cachedCountry = { country: "Desconocido", countryCode: "XX" };
        })
        .finally(() => {
          const info = cachedCountry!;
          for (const cb of countryCallbacks) cb(info);
          countryCallbacks.length = 0;
        });
    }
  });
}

export function useSectionTracker(sectionName: string) {
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const { actor } = useActor();
  const enterTimeRef = useRef<number>(Date.now());
  const actorRef = useRef(actor);
  const isAdminRef = useRef(isAdmin);

  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  useEffect(() => {
    isAdminRef.current = isAdmin;
  }, [isAdmin]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (isAdmin) return;

    enterTimeRef.current = Date.now();

    // Pre-fetch country so it's ready when user leaves
    getVisitorCountry().catch(() => {});

    return () => {
      if (isAdminRef.current) return;

      const duration = Math.round((Date.now() - enterTimeRef.current) / 1000);
      if (duration < 2) return;

      const currentActor = actorRef.current;

      getVisitorCountry().then((countryInfo) => {
        if (!currentActor) return;
        currentActor
          .recordSectionVisit(
            sectionName,
            { code: countryInfo.countryCode, name: countryInfo.country },
            BigInt(duration),
          )
          .catch((err) => {
            console.warn("Failed to record section visit:", err);
          });
      });
    };
  }, [sectionName, isAdmin, identity]);
}
