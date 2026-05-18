import { useEffect, useState } from "react";

// Niamey centre (approx.)
const BASE_LAT = 13.5116;
const BASE_LON = 2.1254;

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

export type GeoETA = {
  loading: boolean;
  etaMinutes: number | null;
  distanceKm: number | null;
  label: string;
  available: boolean;
};

export const useGeoETA = (): GeoETA => {
  const [state, setState] = useState<GeoETA>({
    loading: true,
    etaMinutes: null,
    distanceKm: null,
    label: "Moins de 45 minutes",
    available: false,
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    let done = false;
    const timeout = setTimeout(() => {
      if (!done) setState((s) => ({ ...s, loading: false }));
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        done = true;
        clearTimeout(timeout);
        const distance = haversineKm(
          pos.coords.latitude,
          pos.coords.longitude,
          BASE_LAT,
          BASE_LON
        );
        let eta = 55;
        if (distance < 3) eta = 25;
        else if (distance < 7) eta = 40;
        setState({
          loading: false,
          etaMinutes: eta,
          distanceKm: distance,
          label: `Arrivée en ≈ ${eta} min`,
          available: true,
        });
      },
      () => {
        done = true;
        clearTimeout(timeout);
        setState((s) => ({ ...s, loading: false }));
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 5000 }
    );
  }, []);

  return state;
};
