import { Document, Page, Text, View, StyleSheet, Svg, Path, Line, Rect, Circle, Image } from "@react-pdf/renderer";
import PDFSlateRenderer from "../../components/PDFSlateRenderer";
import signatureImg from "/image/signature.jpeg"

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 9,
        fontFamily: "Helvetica",
        color: "#1f2937"
    },

    /* HEADER */
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: 'center',
        marginBottom: 30
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    invoiceNumber: {
        fontSize: 10,
        color: "#6b7280",
        marginTop: 4
    },
    status: {
        fontSize: 8,
        fontWeight: "bold",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },

    /* INFO SECTION */
    infoSection: {
        marginBottom: 30,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20
    },
    sectionTitle: {
        fontWeight: "bold",
        marginBottom: 8,
        fontSize: 10
    },
    company: {
        width: "60%"
    },
    client: {
        width: "35%",
        textAlign: 'right',
        alignItems: 'flex-end'
    },
    companyName: {
        fontWeight: "bold",
        color: "#2563eb",
        fontSize: 10,
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 3
    },

    /* GRID ADDITIONAL INFO */
    additionalInfo: {
        borderTop: '1 solid #edf2f7',
        borderBottom: '1 solid #edf2f7',
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    gridItem: {
        flex: 1,
    },
    gridLabel: {
        fontSize: 8,
        color: '#6b7280',
        marginBottom: 4,
    },
    gridValue: {
        fontSize: 9,
        fontWeight: 'bold',
    },

    /* TABLE */
    itemTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 25,
        marginBottom: 10,
    },
    table: {
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#d1d5db',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#000000',
    },
    tableHeaderCell: {
        padding: 8,
        fontWeight: 'bold',
        fontSize: 8,
        color: '#ffffff',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderColor: '#ffffff', // Garis putih di header
    },
    tableRow: {
        flexDirection: 'row',
    },
    tableCell: {
        padding: 8,
        fontSize: 8,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderColor: '#d1d5db',
    },

    /* SUMMARY */
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
    },
    summaryBox: {
        width: 180,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 3,
    },
    summaryLabel: {
        color: '#6b7280',
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1 solid #edf2f7',
    },
    totalLabel: {
        fontSize: 10,
        fontWeight: 'bold',
    },

    /* TERMS */
    termsConditions: {
        marginTop: 40,
        borderBottom: '1 solid #edf2f7',
        padding: 10,
        backgroundColor: '#fafafa'
    },
    tcTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 8,
        paddingBottom: 4,
    },
    signatureContainer: {
        marginTop: 20,
        alignSelf: 'flex-end',
        width: '30%',
        alignItems: 'center',
    },
    signatureText: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    signatureImage: {
        width: 100,
        height: 40,
        marginBottom: 5,
    },
    signatureName: {
        fontSize: 10,
        fontWeight: 'bold',
    }
});

const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
};

const formatCurrency = (value) =>
    `Rp ${Number(value).toLocaleString("id-ID", { minimumFractionDigits: 2 })}`;

const getStatusStyle = (status) => {
    switch (status) {
        case 'Draft':
            return { color: '#6b7280', backgroundColor: '#f9fafb' };
        case 'Issued':
            return { color: '#f59e0b', backgroundColor: '#fffbeb' };
        case 'Partially Paid':
            return { color: '#3b82f6', backgroundColor: '#eff6ff' };
        case 'Paid':
            return { color: '#10b981', backgroundColor: '#f0fdf4' };
        case 'Overdue':
            return { color: '#ef4444', backgroundColor: '#fef2f2' };
        default:
            return { color: '#6b7280', backgroundColor: '#f9fafb' };
    }
};

const InvoicePDF = ({ invoice, items, terms }) => (
    <Document>
        <Page size="A4" style={styles.page}>

            {/* HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Invoice</Text>
                    <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
                    {terms && terms.length > 0 && (
                        <Text style={styles.invoiceNumber}>Term {terms[0].term_number}</Text>
                    )}
                </View>
                <View style={[styles.status, getStatusStyle(invoice.status)]}>
                    <Text>{invoice.status}</Text>
                </View>
            </View>

            {/* INFO SECTION */}
            <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                    <View style={styles.company}>
                        <Text style={styles.sectionTitle}>From</Text>
                        <View style={styles.infoItem}>
                            <Svg width={10} height={10} viewBox="0 0 24 24" style={{ marginRight: 4, marginTop: 1 }}>
                                <Path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" fill="#9ca3af" />
                            </Svg>
                            <Text style={styles.companyName}>PT Bandung Teknologi Semesta</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Svg width={10} height={10} viewBox="0 0 24 24" style={{ marginRight: 4, marginTop: 1 }}>
                                <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#9ca3af" />
                            </Svg>
                            <View style={{ color: '#4b5563', lineHeight: 1.4, fontSize: 8 }}>
                                <Text>Jl. Nata Kusumah VII, No.J66,</Text>
                                <Text>RT.01/RW.07, Bandung Regency, West Java 40225</Text>
                            </View>

                        </View>
                        <View style={styles.infoItem}>
                            <Svg width={10} height={10} viewBox="0 0 24 24" style={{ marginRight: 4, marginTop: 1 }}>
                                <Path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#9ca3af" />
                            </Svg>
                            <Text style={{ color: '#4b5563', fontSize: 8 }}>Phone: 083821868088</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Svg width={10} height={10} viewBox="0 0 24 24" style={{ marginRight: 4, marginTop: 1 }}>
                                <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#9ca3af" />
                            </Svg>
                            <Text style={{ color: '#4b5563', fontSize: 8 }}>Prepared by: Lizuardi Danar Pratisna</Text>
                        </View>
                    </View>

                    <View style={styles.client}>
                        <Text style={styles.sectionTitle}>Invoice To</Text>
                        <View style={styles.infoItem}>
                            <Svg width={10} height={10} viewBox="0 0 24 24" style={{ marginRight: 4, marginTop: 1 }}>
                                <Path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" fill="#9ca3af" />
                            </Svg>
                            <Text style={{ fontWeight: "bold", fontSize: 10 }}>{invoice.company_name}</Text>
                        </View>

                        {/* <Text>{invoice.pic_name}</Text>
                        <Text>{invoice.contact}</Text> 
                        */}
                        <View style={styles.infoItem}>
                            <Svg width={10} height={10} viewBox="0 0 24 24" style={{ marginRight: 4, marginTop: 1 }}>
                                <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#9ca3af" />
                            </Svg>
                            <Text style={{ color: '#4b5563', marginTop: 4 }}>{invoice.address}</Text>
                        </View>
                    </View>
                </View>

                {/* ADDITIONAL INFO GRID */}
                <View style={styles.additionalInfo}>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Project</Text>
                        <Text style={styles.gridValue}>{invoice.project_title || "-"}</Text>
                    </View>

                    {/* <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Start Date</Text>
                        <Text style={styles.gridValue}>{formatDate(invoice.start_date)}</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>End Date</Text>
                        <Text style={styles.gridValue}>{formatDate(invoice.end_date)}</Text>
                    </View> 
                    */}

                    <View style={[styles.gridItem, { textAlign: 'center' }]}>
                        <Text style={styles.gridLabel}>Invoice Date</Text>
                        <Text style={styles.gridValue}>{formatDate(invoice.issue_date)}</Text>
                    </View>
                    <View style={[styles.gridItem, { textAlign: 'right' }]}>
                        <Text style={styles.gridLabel}>Overdue Date</Text>
                        <Text style={styles.gridValue}>{formatDate(invoice.due_date)}</Text>
                    </View>
                </View>
            </View>

            {/* TABLE */}
            <Text style={styles.itemTitle}>Items</Text>
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { width: '55%' }]}>Item</Text>
                    <Text style={[styles.tableHeaderCell, { width: '10%', textAlign: 'center' }]}>Unit</Text>
                    <Text style={[styles.tableHeaderCell, { width: '10%', textAlign: 'center' }]}>Qty</Text>
                    <Text style={[styles.tableHeaderCell, { width: '12.5%', textAlign: 'right' }]}>Price</Text>
                    <Text style={[styles.tableHeaderCell, { width: '12.5%', textAlign: 'right' }]}>Total</Text>
                </View>

                {items.map((item, i) => (
                    <View key={i} style={styles.tableRow}>
                        <View style={[styles.tableCell, { width: '55%' }]}>
                            <Text style={{ fontSize: 8 }}>{item.item_name}</Text>
                            {item.description && item.description.trim() && item.description !== "-" && (
                                <Text style={{ fontSize: 6, color: '#6b7280', marginTop: 2 }}>{item.description}</Text>
                            )}
                        </View>
                        <Text style={[styles.tableCell, { width: '10%', textAlign: 'center' }]}>{item.unit}</Text>
                        <Text style={[styles.tableCell, { width: '10%', textAlign: 'center' }]}>{item.qty}</Text>
                        <Text style={[styles.tableCell, { width: '12.5%', textAlign: 'right' }]}>{formatCurrency(item.price)}</Text>
                        <Text style={[styles.tableCell, { width: '12.5%', textAlign: 'right', fontWeight: 'bold' }]}>
                            {formatCurrency(item.total || (item.price * item.qty))}
                        </Text>
                    </View>
                ))}
            </View>

            {/* SUMMARY */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryBox}>
                    <View style={styles.summaryRow}>
                        <Text>Subtotal:</Text>
                        <Text>{formatCurrency(invoice.subtotal)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Discount:</Text>
                        <Text>
                            {invoice.discount_type === 'percent'
                                ? `${Math.round((Number(invoice.discount) / Number(invoice.subtotal)) * 100)}% (Rp ${Number(invoice.discount).toLocaleString("id-ID", { minimumFractionDigits: 2 })})`
                                : `Rp ${Number(invoice.discount).toLocaleString("id-ID", { minimumFractionDigits: 2 })}`}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tax:</Text>
                        <Text>
                            {invoice.tax_type === 'percent'
                                ? `${Math.round((Number(invoice.tax) / (Number(invoice.subtotal) - Number(invoice.discount))) * 100)}% (Rp ${Number(invoice.tax).toLocaleString("id-ID", { minimumFractionDigits: 2 })})`
                                : `Rp ${Number(invoice.tax).toLocaleString("id-ID", { minimumFractionDigits: 2 })}`}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Term {terms?.[0]?.term_number || 1}:</Text>
                        <Text>- {formatCurrency(terms?.[0]?.nominal || 0)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total:</Text>
                        <Text style={styles.totalLabel}>{formatCurrency(terms?.[0]?.nominal || 0)}</Text>
                    </View>
                </View>
            </View>

            {/* Signature */}
            <View style={styles.signatureContainer}>
                <Text style={styles.signatureText}>Sincerely,</Text>
                <Image style={styles.signatureImage} src={signatureImg} />
                <Text style={styles.signatureName}>Lizuardi Danar Pratisna</Text>
            </View>

            {/* TERMS & CONDITIONS */}
            {invoice.term_condition && (
                <View style={styles.termsConditions}>
                    <Text style={styles.tcTitle}>Terms & Conditions</Text>
                    <View style={{ fontSize: 8, color: '#4b5563' }}>
                        <PDFSlateRenderer value={invoice.term_condition} />
                    </View>
                </View>
            )}

        </Page>
    </Document >
);

export default InvoicePDF;
