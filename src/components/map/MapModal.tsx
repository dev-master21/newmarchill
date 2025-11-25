import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Navigation, Check, Loader } from 'lucide-react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCMQ8O9RQ1DTHKkir14RjZMJbFia87OgeQ';
const STORE_LOCATION = { lat: 7.987861, lng: 98.292425 };

// Кастомный стиль карты
const MAP_STYLE = [
  {"featureType": "all", "elementType": "labels.text.fill", "stylers": [{"saturation": 36}, {"color": "#000000"}, {"lightness": 40}]},
  {"featureType": "all", "elementType": "labels.text.stroke", "stylers": [{"visibility": "on"}, {"color": "#000000"}, {"lightness": 16}]},
  {"featureType": "all", "elementType": "labels.icon", "stylers": [{"visibility": "off"}]},
  {"featureType": "administrative", "elementType": "geometry.fill", "stylers": [{"color": "#000000"}, {"lightness": 20}]},
  {"featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{"color": "#000000"}, {"lightness": 17}, {"weight": 1.2}]},
  {"featureType": "landscape", "elementType": "geometry", "stylers": [{"color": "#000000"}, {"lightness": 20}]},
  {"featureType": "poi", "elementType": "geometry", "stylers": [{"color": "#000000"}, {"lightness": 21}]},
  {"featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{"color": "#004b3c"}]},
  {"featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{"color": "#00ffff"}, {"lightness": 17}, {"weight": "4.00"}]},
  {"featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{"color": "#000000"}, {"lightness": 29}, {"weight": "0.01"}]},
  {"featureType": "road.arterial", "elementType": "geometry.fill", "stylers": [{"color": "#00afaf"}, {"weight": "2.00"}]},
  {"featureType": "road.arterial", "elementType": "geometry.stroke", "stylers": [{"visibility": "off"}]},
  {"featureType": "road.local", "elementType": "geometry.fill", "stylers": [{"color": "#006464"}]},
  {"featureType": "transit", "elementType": "all", "stylers": [{"visibility": "off"}]},
  {"featureType": "water", "elementType": "geometry.fill", "stylers": [{"color": "#005050"}]}
];

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
}

const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLocation
}) => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [address, setAddress] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const mapContainerStyle = {
    width: '100%',
    height: isMobile ? '400px' : '500px',
    borderRadius: '12px'
  };

  const center = initialLocation || STORE_LOCATION;

  // Геокодирование координат в адрес
  const geocodeLocation = useCallback(async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setIsLoadingAddress(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLocation && isLoaded) {
      geocodeLocation(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation, isLoaded, geocodeLocation]);

  useEffect(() => {
    if (isOpen) {
      const style = document.createElement('style');
      style.id = 'gm-custom-styles';
      style.innerHTML = `
        .gm-style .gm-style-mtc,
        .gm-style .gm-bundled-control,
        .gm-style .gm-svpc,
        .gm-style .gm-fullscreen-control,
        .gm-style-cc,
        .gm-style .gmnoprint:not(.gm-style-cc) {
          display: none !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        const styleEl = document.getElementById('gm-custom-styles');
        if (styleEl) {
          styleEl.remove();
        }
      };
    }
  }, [isOpen]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setSelectedLocation({ lat, lng });
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelectLocation({
        ...selectedLocation,
        address: address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`
      });
      onClose();
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setSelectedLocation({ lat, lng });
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Could not get your location. Please select manually on the map.');
        }
      );
    }
  };

  const onLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Компактная иконка точки доставки - МЕНЬШЕ размером
  const deliveryIcon = {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
            <feOffset dx="0" dy="1.5" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <!-- Внешние волны пульсации -->
        <circle cx="20" cy="17" r="16" fill="#00ffff" opacity="0.3">
          <animate attributeName="r" values="16;22;16" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/>
        </circle>
        
        <circle cx="20" cy="17" r="16" fill="#00ffff" opacity="0.2">
          <animate attributeName="r" values="16;26;16" dur="2s" begin="0.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" begin="0.5s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Основной pin -->
        <g filter="url(#shadow)">
          <path d="M20 5 C13 5, 8 10, 8 16 C8 25, 20 43, 20 43 C20 43, 32 25, 32 16 C32 10, 27 5, 20 5 Z" 
                fill="#000000" stroke="#00ffff" stroke-width="2.5">
            <animateTransform attributeName="transform" type="scale" 
                            values="1;1.05;1" dur="2s" repeatCount="indefinite"
                            additive="sum" attributeType="XML"/>
          </path>
        </g>
      </svg>
    `),
    scaledSize: { width: 40, height: 50 } as google.maps.Size,
    anchor: { x: 20, y: 43 } as google.maps.Point,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-gray-900 rounded-2xl border border-white/10 overflow-hidden max-h-[95vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 flex-shrink-0">
              <div className="flex-1 mr-4">
                <h3 className="text-lg md:text-xl font-bold">Select Delivery Location</h3>
                <p className="text-xs md:text-sm text-gray-400 mt-1">
                  Tap on the map to set your delivery address
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            {/* Map */}
            <div className="p-3 md:p-6 flex-1 overflow-auto">
              <LoadScript 
                googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                onLoad={onLoad}
              >
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={isMobile ? 13 : 14}
                  onClick={handleMapClick}
                  options={{
                    styles: MAP_STYLE,
                    disableDefaultUI: true,
                    zoomControl: false,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                    gestureHandling: 'greedy',
                  }}
                >
                  {/* Только выбранная точка доставки */}
                  {isLoaded && selectedLocation && (
                    <Marker
                      position={selectedLocation}
                      icon={deliveryIcon}
                      title="Delivery Location"
                      animation={google.maps.Animation.DROP}
                    />
                  )}
                </GoogleMap>
              </LoadScript>

              {/* Address display */}
              {selectedLocation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="mt-3 md:mt-4 p-3 md:p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex items-start gap-2 md:gap-3">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium mb-1">Selected Location:</p>
                      {isLoadingAddress ? (
                        <div className="flex items-center gap-2">
                          <Loader className="w-3 h-3 md:w-4 md:h-4 animate-spin text-gray-400" />
                          <p className="text-gray-400 text-xs md:text-sm">Loading address...</p>
                        </div>
                      ) : (
                        <p className="text-gray-300 text-xs md:text-sm break-words">{address}</p>
                      )}
                      <p className="text-gray-500 text-[10px] md:text-xs mt-1">
                        {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 md:p-6 border-t border-white/10 gap-3 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGetCurrentLocation}
                className="flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm md:text-base"
              >
                <Navigation className="w-4 h-4" />
                <span>Use My Location</span>
              </motion.button>

              <div className="flex gap-2 md:gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 md:px-6 py-2.5 md:py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm md:text-base"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={selectedLocation ? { scale: 1.02 } : {}}
                  whileTap={selectedLocation ? { scale: 0.98 } : {}}
                  onClick={handleConfirm}
                  disabled={!selectedLocation}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-2 rounded-xl transition-all text-sm md:text-base ${
                    selectedLocation
                      ? 'bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_20px_rgba(35,192,219,0.5)]'
                      : 'bg-gray-700 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MapModal;