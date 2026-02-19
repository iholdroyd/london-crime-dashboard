import { useEffect, useState, useMemo } from 'react';
import { MapContainer, GeoJSON, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function MapEvents({ onBackgroundClick }) {
    useMapEvents({
        click: (e) => {
            if (onBackgroundClick) onBackgroundClick();
        }
    });
    return null;
}

export default function BoroughMap({ boroughTotals, loading, onBoroughClick, selectedBorough, category }) {
    const [geoData, setGeoData] = useState(null);

    useEffect(() => {
        fetch(`${import.meta.env.BASE_URL}london-boroughs.geojson`)
            .then(r => r.json())
            .then(setGeoData)
            .catch(err => console.error('Failed to load GeoJSON:', err));
    }, []);

    // Build lookup map
    const countMap = useMemo(() => {
        const map = {};
        if (boroughTotals) {
            boroughTotals.forEach(b => {
                map[b.area_name] = b.total_count;
            });
        }
        return map;
    }, [boroughTotals]);

    // Calculate dynamic range for coloring
    const { min, max } = useMemo(() => {
        if (!boroughTotals || boroughTotals.length === 0) return { min: 0, max: 0 };
        const values = boroughTotals.map(b => b.total_count);
        return {
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }, [boroughTotals]);

    const getColor = (count) => {
        if (!count && count !== 0) return '#e5e7eb'; // No data -> gray

        if (max === min) return '#991b1b'; // Single value -> Dark Red (fallback)

        const ratio = (count - min) / (max - min);

        // ORIGINAL Logic: Green -> Yellow -> Red
        // Bias towards red for higher values
        if (ratio < 0.1) {
            // Interpolate Green (#10b981) to Yellow (#facc15)
            const localRatio = ratio / 0.1;
            const r = Math.round(16 + localRatio * (250 - 16));
            const g = Math.round(185 + localRatio * (204 - 185));
            const b = Math.round(129 + localRatio * (21 - 129));
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            // Interpolate Yellow (#facc15) to Deep Crimson (#7f1d1d)
            const localRatio = (ratio - 0.1) / 0.9;
            const r = Math.round(250 + localRatio * (127 - 250));
            const g = Math.round(204 + localRatio * (29 - 204));
            const b = Math.round(21 + localRatio * (29 - 21));
            return `rgb(${r}, ${g}, ${b})`;
        }
    };

    const style = (feature) => {
        const boroughName = feature.properties.name || feature.properties.NAME || feature.properties.LAD21NM;
        const count = countMap[boroughName] || 0;

        const isSelected = selectedBorough === boroughName;

        // City of London special style (neutral, distinct)
        if (boroughName === 'City of London') {
            return {
                fillColor: '#d1d5db',
                weight: 1,
                opacity: 1,
                color: '#9ca3af',
                fillOpacity: 1,
                // interactive: true // Default is true, needed for tooltip
            };
        }

        return {
            fillColor: getColor(count),
            weight: isSelected ? 3 : 1,
            opacity: 1,
            color: isSelected ? '#3b82f6' : 'white',
            dashArray: isSelected ? '' : '3',
            fillOpacity: 0.7
        };
    };

    const onEachFeature = (feature, layer) => {
        const boroughName = feature.properties.name || feature.properties.NAME || feature.properties.LAD21NM;
        const count = countMap[boroughName] || 0;

        if (boroughName === 'City of London') {
            layer.bindTooltip(`<strong>${boroughName}</strong><br/>No reported crimes, the Metropolitan Police do not cover the City of London`, {
                sticky: true,
                className: 'custom-tooltip'
            });
            // No click handler attached = no action on click
        } else {
            layer.bindTooltip(`<strong>${boroughName}</strong><br/>${count.toLocaleString()} offences`, {
                sticky: true
            });

            layer.on({
                click: (e) => {
                    // IMPORTANT: Stop propagation so map background click doesn't fire immediately after!
                    L.DomEvent.stopPropagation(e);
                    if (onBoroughClick) onBoroughClick(boroughName);
                }
            });
        }
    };

    return (
        <div className="chart-card" style={{ position: 'relative' }}>
            {/* Loading Overlay */}
            {loading && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    { /* <div className="loading-spinner" /> */}
                </div>
            )}

            <h3>Crime by Borough {category ? `(${category})` : ''}</h3>
            {/* CartoDB Positron basemap provides geographic context */}
            <MapContainer center={[51.505, -0.09]} zoom={10} style={{ height: '400px', width: '100%', background: '#f5f5f5' }}>
                <MapEvents onBackgroundClick={() => onBoroughClick && onBoroughClick(null)} />
                {/* CartoDB Positron - Light, minimal basemap */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    maxZoom={19}
                />
                {geoData && (
                    <GeoJSON
                        key={JSON.stringify(countMap).substring(0, 50) + (selectedBorough || '') + (category || '')}
                        data={geoData}
                        style={style}
                        onEachFeature={onEachFeature}
                    />
                )}
            </MapContainer>
        </div>
    );
}
