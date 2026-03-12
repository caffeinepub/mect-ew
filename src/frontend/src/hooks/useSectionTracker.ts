import { useEffect, useRef } from "react";
import { useInternetIdentity } from "./useInternetIdentity";
import { useIsCallerAdmin } from "./useQueries";

export interface SectionVisit {
  section: string;
  country: string;
  countryCode: string;
  timestamp: number;
  duration: number;
}

const STORAGE_KEY = "mectew_section_visits";
const MAX_RECORDS = 500;

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

export function getSectionVisits(): SectionVisit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSectionVisit(visit: SectionVisit) {
  const visits = getSectionVisits();
  visits.push(visit);
  const trimmed = visits.slice(-MAX_RECORDS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function useSectionTracker(sectionName: string) {
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const enterTimeRef = useRef<number>(Date.now());

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (isAdmin) return;

    enterTimeRef.current = Date.now();
    let countryInfo = cachedCountry;

    getVisitorCountry().then((info) => {
      countryInfo = info;
    });

    return () => {
      const duration = Math.round((Date.now() - enterTimeRef.current) / 1000);
      if (duration < 2) return;

      const visit: SectionVisit = {
        section: sectionName,
        country: countryInfo?.country || "Desconocido",
        countryCode: countryInfo?.countryCode || "XX",
        timestamp: Date.now(),
        duration,
      };
      saveSectionVisit(visit);
    };
  }, [sectionName, isAdmin, identity]);
}
