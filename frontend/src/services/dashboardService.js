const API_URL = "http://localhost:3000/api/dashboard";

/* =========================
   GET DASHBOARD DATA
========================= */
export const getDashboardData = async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        throw new Error("Belum login");
    }

    const res = await fetch(`${API_URL}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id
        }
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Gagal mengambil data dashboard");
    }

    return data;
};
