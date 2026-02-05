import { getMe } from './authService';

const API_URL = "http://localhost:3000/api/dashboard/client";

// Get client dashboard data
export const getClientDashboardData = async () => {
    const user = getMe();
    const res = await fetch(`${API_URL}/${user.id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch client dashboard data");
    }

    return data;
};
