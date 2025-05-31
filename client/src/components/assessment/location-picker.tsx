import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationPickerProps {
  value?: { lat: number; lng: number; address: string } | null;
  onChange: (location: { lat: number; lng: number; address: string } | null) => void;
  placeholder?: string;
  className?: string;
}

export function LocationPicker({ value, onChange, placeholder = "Search for a location...", className }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => console.error('Failed to load Google Maps API');
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    // Default location (Accra, Ghana)
    const defaultLocation = { lat: 5.6037, lng: -0.1870 };
    const initialLocation = value || defaultLocation;

    // Initialize map
    const map = new google.maps.Map(mapRef.current, {
      center: initialLocation,
      zoom: value ? 15 : 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;

    // Add marker if location is selected
    if (value) {
      const marker = new google.maps.Marker({
        position: value,
        map: map,
        draggable: true,
        title: value.address,
      });

      markerRef.current = marker;

      // Handle marker drag
      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        if (position) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: position }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              onChange({
                lat: position.lat(),
                lng: position.lng(),
                address: results[0].formatted_address,
              });
            }
          });
        }
      });
    }

    // Handle map clicks
    map.addListener('click', (event: google.maps.MapMouseEvent) => {
      const position = event.latLng;
      if (position) {
        // Remove existing marker
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        // Add new marker
        const marker = new google.maps.Marker({
          position: position,
          map: map,
          draggable: true,
        });

        markerRef.current = marker;

        // Geocode the position
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: position }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const address = results[0].formatted_address;
            marker.setTitle(address);
            onChange({
              lat: position.lat(),
              lng: position.lng(),
              address: address,
            });
          }
        });

        // Handle marker drag
        marker.addListener('dragend', () => {
          const newPosition = marker.getPosition();
          if (newPosition) {
            geocoder.geocode({ location: newPosition }, (results, status) => {
              if (status === 'OK' && results?.[0]) {
                onChange({
                  lat: newPosition.lat(),
                  lng: newPosition.lng(),
                  address: results[0].formatted_address,
                });
              }
            });
          }
        });
      }
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [isLoaded, value, onChange]);

  // Initialize autocomplete
  useEffect(() => {
    if (!isLoaded || !searchInputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
      types: ['(cities)'],
      fields: ['place_id', 'geometry', 'name', 'formatted_address'],
    });

    autocompleteRef.current = autocomplete;

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address || place.name || '',
        };

        // Update map center
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(location);
          mapInstanceRef.current.setZoom(15);
        }

        // Remove existing marker
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        // Add new marker
        if (mapInstanceRef.current) {
          const marker = new google.maps.Marker({
            position: location,
            map: mapInstanceRef.current,
            draggable: true,
            title: location.address,
          });

          markerRef.current = marker;

          // Handle marker drag
          marker.addListener('dragend', () => {
            const position = marker.getPosition();
            if (position) {
              const geocoder = new google.maps.Geocoder();
              geocoder.geocode({ location: position }, (results, status) => {
                if (status === 'OK' && results?.[0]) {
                  onChange({
                    lat: position.lat(),
                    lng: position.lng(),
                    address: results[0].formatted_address,
                  });
                }
              });
            }
          });
        }

        onChange(location);
        setSearchQuery('');
      }
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onChange]);

  const clearLocation = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    onChange(null);
    setSearchQuery('');
  };

  if (!isLoaded) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>Loading map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected Location Display */}
      {value && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">{value.address}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLocation}
            className="text-green-600 hover:text-green-700"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Map Container */}
      <Card>
        <CardContent className="p-0">
          <div
            ref={mapRef}
            className="w-full h-64 rounded-lg"
            style={{ minHeight: '256px' }}
          />
        </CardContent>
      </Card>

      {/* Instructions */}
      <p className="text-xs text-gray-500 text-center">
        Search for a location above or click on the map to select a point
      </p>
    </div>
  );
}