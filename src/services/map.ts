
export interface AddressResult {
    place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    boundingbox: string[];
    lat: string;
    lon: string;
    display_name: string;
    class: string;
    type: string;
    importance: number;
}

// Use local proxy in development to bypass CORS and add User-Agent header
// In production, we fallback to direct call (assuming domain referer is allowed or proxy is configured elsewhere)
const NOMINATIM_BASE_URL = import.meta.env.DEV
    ? '/api/nominatim'
    : 'https://nominatim.openstreetmap.org';

export const mapService = {
    searchAddress: async (query: string): Promise<AddressResult[]> => {
        if (!query || query.length < 3) return [];

        try {
            // Using URLSearchParams for proper encoding
            const params = new URLSearchParams({
                q: query,
                format: 'json',
                addressdetails: '1',
                limit: '5',
                countrycodes: 'vn', // Limit to Vietnam
                'accept-language': 'vi-VN', // Prefer Vietnamese results
                // email: 'contact@digibook.com'
            });

            // Browser fetch cannot set User-Agent header (Forbidden Header Name).
            // We rely on standard browser headers.
            const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error searching address:', error);
            return [];
        }
    },

    getAddressDetails: async (lat: number, lon: number): Promise<AddressResult | null> => {
        try {
            const params = new URLSearchParams({
                lat: lat.toString(),
                lon: lon.toString(),
                format: 'json',
                addressdetails: '1',
                'accept-language': 'vi-VN'
            });

            const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params.toString()}`, {
                method: 'GET'
            });

            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error reversing address:', error);
            return null;
        }
    }
};
