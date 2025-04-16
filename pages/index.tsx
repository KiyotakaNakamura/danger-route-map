import { useState } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';

const center = { lat: 32.8031, lng: 130.7079 }; // 熊本駅を中心に設定（例）
const containerStyle = { width: '100%', height: '500px' };
const libraries: ('geometry')[] = ['geometry'];

const dangerPoints = [
  { id: 1, lat: 32.786934469864164, lng: 130.70891539313695 },
  { id: 2, lat: 32.786874167856624, lng: 130.70987178180764 }
,
];

export default function DangerAvoidMap() {
  const [map, setMap] = useState(null);
  const [directions, setDirections] = useState(null);
  const origin = { lat: 32.789139073201945, lng: 130.71619414051773 }; // A地点（仮）
  const destination = { lat: 32.784195979371965, lng: 130.70525417068092 }; // B地点（仮）

  const calculateRoute = () => {
    if (!window.google || !window.google.maps || !window.google.maps.TravelMode) {
      console.warn('Google Maps not loaded, skipping route calculation.');
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true
      },
      (result, status) => {
        console.log('Directions status:', status);
        if (status === 'OK' && result.routes) {
          console.log('Directions response object:', result);
          console.log('📦 ルート数:', result.routes.length);
          result.routes.forEach((route, index) => {
              console.log(`🛣 ルート ${index + 1}:`, route);
              console.log(`📏 距離: ${route.legs[0]?.distance?.text}, 時間: ${route.legs[0]?.duration?.text}`);
              console.log('🧭 経路全体のポイント数:', route.overview_path.length);
            });

          const filteredRoute = result.routes.find(route => {
            return !route.overview_path.some(point => {
              return dangerPoints.some(danger => {
                const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
                  new window.google.maps.LatLng(point.lat(), point.lng()),
                  new window.google.maps.LatLng(danger.lat, danger.lng)
                );
                return distance < 20;
              });
            });
          });

          if (!filteredRoute) {
            alert('⚠️ 危険地点を避けるルートが見つかりませんでした。通常ルートを表示します。');
          }

          setDirections(filteredRoute ? { ...result, routes: [filteredRoute] } : result);
        } else {
          console.error('Directions API failed:', status);
        }
      }
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: 16 }}>通学路危険回避マップ</h1>
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
        onLoad={() => {
          console.log('✅ LoadScript onLoad: Google Maps 読み込み完了');
          const isReady =
            typeof window !== 'undefined' &&
            window.google &&
            window.google.maps &&
            window.google.maps.TravelMode;

          if (isReady) {
            calculateRoute();
          } else {
            console.warn('Google Maps API not ready yet!');
          }
        }}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          onLoad={map => setMap(map)}
        >
          {dangerPoints.map(point => (
            <Marker
              key={point.id}
              position={{ lat: point.lat, lng: point.lng }}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
              }}
            />
          ))}
          {directions && (
            <DirectionsRenderer directions={directions} />
          )}
        </GoogleMap>
      </LoadScript>
      <button style={{ marginTop: 16 }} onClick={calculateRoute}>
        ルート再計算
      </button>
    </div>
  );
}
