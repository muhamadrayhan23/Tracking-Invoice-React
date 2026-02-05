export const getQuotationStatusLogs = async (quotationId) => {
    const res = await fetch(`http://localhost:3000/api/quotation-status-logs/quotation/${quotationId}`);

    if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Error ${res.status}: ${errorData || 'Failed to fetch'}`);
    }

    const data = await res.json();
    return data;
};