import { amadeus } from "@/src/api/config/amadeus";

export const getAirports = async (query: string) => {
    try {
        const response = await amadeus.referenceData.locations.get({
            keyword: query,
            subType: 'AIRPORT,CITY'
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};