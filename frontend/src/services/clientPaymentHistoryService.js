import { getMe } from './authService';

const API_URL = "http://localhost:3000/api/payment-history/client";

// Get payment history for the logged-in client
export const getClientPaymentHistory = async () => {
    const user = getMe();
    const res = await fetch(`${API_URL}/${user.id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch payment history");
    }

    return data;
};
