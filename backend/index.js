const express = require("express");
const cors = require("cors");

// Admin Routes
const loginRoutes = require("./routes/loginRoutes");
const clientRoutes = require("./routes/clientRoutes");
const itemRoutes = require("./routes/itemRoutes");
const projectRoutes = require("./routes/projectRoutes");
const quotationRoutes = require("./routes/quotationRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const historyRoutes = require("./routes/historyRoutes");
const quotationStatusLogRoutes = require("./routes/quotationStatusLogRoutes");

// Client Routes
const clientDashboardRoutes = require("./routes/clientDashboardRoutes");
const clientInvoiceRoutes = require("./routes/clientInvoiceRoutes");
const clientQuotationRoutes = require("./routes/clientQuotationRoutes");
const clientPaymentHistoryRoutes = require("./routes/clientPaymentHistoryRoutes");

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors()); //
app.use(express.json());

// Admin
app.use("/api/auth", loginRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/quotation-status-logs", quotationStatusLogRoutes);

// Client
app.use("/api/dashboard/client", clientDashboardRoutes);
app.use("/api/quotation/client", clientQuotationRoutes);
app.use("/api/invoice/client", clientInvoiceRoutes);
app.use("/api/payment-history/client", clientPaymentHistoryRoutes);

/* =========================
   SERVER
========================= */
app.listen(3000, () => {
   console.log("Server running on http://localhost:3000");
});
