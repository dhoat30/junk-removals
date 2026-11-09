"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./LocationsCovered.module.scss";
import Container from "@mui/material/Container";
import { Chip, Typography } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";

const DEFAULT_CENTER = [-37.787, 175.2793];
const DEFAULT_ZOOM = 10;
const MAP_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

const LOCATION_COORDINATES = {
  "Hamilton Central": [-37.787, 175.2793],
  "Hamilton East": [-37.7917, 175.3017],
  Frankton: [-37.7969, 175.2675],
  Hillcrest: [-37.8007, 175.3172],
  Chartwell: [-37.7532, 175.2813],
  Flagstaff: [-37.7278, 175.2508],
  Rototuna: [-37.7261, 175.2806],
  "Te Rapa": [-37.7519, 175.2366],
  Dinsdale: [-37.7967, 175.2429],
  Glenview: [-37.8177, 175.2862],
  Melville: [-37.8125, 175.2751],
  Nawton: [-37.7766, 175.2368],
  Cambridge: [-37.8918, 175.4707],
  "Te Awamutu": [-38.0094, 175.3252],
  Morrinsville: [-37.6567, 175.5286],
  Ngaruawahia: [-37.6678, 175.1482],
  Huntly: [-37.5577, 175.1591],
  Matamata: [-37.8106, 175.7765],
  Raglan: [-37.8014, 174.8722],
  Tamahere: [-37.829, 175.3545],
  Horotiu: [-37.7067, 175.199],
  Ohaupo: [-37.9189, 175.3066],
};

const FALLBACK_TITLE = "<h2>Moving Services Across Hamilton & Waikato</h2>";
const FALLBACK_DESCRIPTION =
  "Hamilton Express Movers helps with house moves, apartment moves, office relocations, and furniture deliveries across Hamilton and nearby Waikato towns.";
const FALLBACK_LOCATIONS = [
  "Hamilton Central",
  "Hamilton East",
  "Frankton",
  "Hillcrest",
  "Chartwell",
  "Flagstaff",
  "Rototuna",
  "Te Rapa",
  "Dinsdale",
  "Glenview",
  "Melville",
  "Nawton",
  "Cambridge",
  "Te Awamutu",
  "Morrinsville",
  "Ngaruawahia",
  "Huntly",
  "Matamata",
];

function getLocationLabel(location) {
  if (typeof location === "string") return location;
  return location?.label || location?.location || location?.title || "";
}

function stripHtml(html = "") {
  return String(html).replace(/<[^>]*>/g, "").trim();
}

export default function LocationsCovered({
  title,
  description,
  locations,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [activeLocation, setActiveLocation] = useState("");
  const [mapError, setMapError] = useState("");

  const locationLabels = useMemo(() => {
    const labels = ((locations && locations.length ? locations : FALLBACK_LOCATIONS) || [])
      .map(getLocationLabel)
      .map((label) => label.trim())
      .filter(Boolean);

    return [...new Set(labels)];
  }, [locations]);

  const resolvedTitle = title || FALLBACK_TITLE;
  const resolvedDescription = description || FALLBACK_DESCRIPTION;
  const titleText = stripHtml(resolvedTitle);
  const hasHtmlTitle =
    typeof resolvedTitle === "string" && /<\/?[a-z][\s\S]*>/i.test(resolvedTitle);
  const hasHtmlDescription =
    typeof resolvedDescription === "string" &&
    /<\/?[a-z][\s\S]*>/i.test(resolvedDescription);

  useEffect(() => {
    let cancelled = false;
    let map;

    async function initMap() {
      try {
        const leaflet = await import("leaflet");
        if (cancelled || !mapRef.current) return;

        map = leaflet.map(mapRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          zoomControl: true,
          scrollWheelZoom: false,
        });

        leaflet
          .tileLayer(MAP_TILE_URL, {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19,
          })
          .addTo(map);

        const markerIcon = leaflet.divIcon({
          className: styles.marker,
          html: "<span></span>",
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        mapInstanceRef.current = map;

        if (!locationLabels.length) return;

        const nextMarkers = [];
        const bounds = [];

        locationLabels.forEach((label) => {
          const coordinates = LOCATION_COORDINATES[label];
          if (!coordinates) return;

          const marker = leaflet
            .marker(coordinates, {
              icon: markerIcon,
              title: label,
            })
            .addTo(map)
            .bindPopup(label);

          marker.on("click", () => {
            setActiveLocation(label);
            map.flyTo(coordinates, 13, { duration: 0.55 });
          });

          bounds.push(coordinates);
          nextMarkers.push(marker);
        });

        markersRef.current = nextMarkers;

        if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [36, 36] });
        } else if (bounds.length === 1) {
          map.setView(bounds[0], 13);
        }
      } catch {
        setMapError("Map failed to load.");
      }
    }

    initMap();

    return () => {
      cancelled = true;
      markersRef.current = [];
      if (map) {
        map.remove();
      }
    };
  }, [locationLabels]);

  const handleLocationClick = (label) => {
    setActiveLocation(label);
    const marker = markersRef.current.find(
      (item) => item.options?.title === label
    );
    const map = mapInstanceRef.current;

    if (!marker || !map) return;

    map.flyTo(marker.getLatLng(), 13, { duration: 0.55 });
    marker.openPopup();
  };

  return (
    <section className={`${styles.section}`} id="locations-covered">
      <Container maxWidth="lg" className={styles.container}>
        <div className={`${styles.contentWrapper}`}>
          {hasHtmlTitle ? (
            <div
              className={`${styles.title} heading-2 `}
              dangerouslySetInnerHTML={{ __html: resolvedTitle }}
            />
          ) : (
            <Typography variant="h3" component="h2" className={styles.title}>
              {resolvedTitle}
            </Typography>
          )}

          {hasHtmlDescription ? (
            <div
              className={`body1 mt-16`}
              dangerouslySetInnerHTML={{ __html: resolvedDescription }}
            />
          ) : (
            <Typography
              variant="body1"
              component="p"
              className={`${styles.description} mt-16`}
            >
              {resolvedDescription}
            </Typography>
          )}

          <ul className={`${styles.locationsWrapper} mt-16`}>
            {locationLabels.map((label) => (
              <li key={label}>
                <Chip
                  icon={<LocationOnIcon fontSize="small" />}
                  label={label}
                  onClick={() => handleLocationClick(label)}
                  className={`${styles.locationChip} ${
                    activeLocation === label ? styles.active : ""
                  }`}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.mapPanel}>
          <div
            ref={mapRef}
            className={styles.map}
            aria-label={`${titleText || "Areas covered"} map`}
          />
          {mapError && (
            <Typography variant="body2" className={styles.mapError}>
              {mapError}
            </Typography>
          )}
        </div>
      </Container>
    </section>
  );
}
