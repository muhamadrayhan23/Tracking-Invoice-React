export const getPaymentHistory = async () => {
    const res = await fetch("http://localhost:3000/api/history");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
};
