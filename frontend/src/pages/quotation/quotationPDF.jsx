import { Document, Page, Text, View, StyleSheet, Svg, Path, Rect, Line, Image } from '@react-pdf/renderer';
import PDFSlateRenderer from '../../components/PDFSlateRenderer';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 9,
        fontFamily: 'Helvetica',
        color: '#1f2937',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'black',
        letterSpacing: 1,
    },
    quotationNumber: {
        fontSize: 9,
        color: '#6b7280',
        marginTop: 2,
    },
    statusBadge: {
        padding: '4 12',
        borderRadius: 12,
        fontSize: 8,
        fontWeight: 'bold',
    },
    // Divider horizontal tipis
    divider: {
        borderBottom: '1 solid #E5E7EB',
        marginVertical: 15,
    },
    sectionBorder: {
        borderBottom: '1 solid #E5E7EB',
        paddingBottom: 15,
        marginBottom: 15,
    },
    sectionInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    addressBlock: {
        width: '40%',
    },
    addressTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    companyName: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 4,
    },
    clientName: {
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    iconTextRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 3,
    },
    addressText: {
        color: '#4b5563',
        fontSize: 9,
    },
    projectGrid: {
        flexDirection: 'row',
        marginBottom: 20,
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
    tableTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    table: {
        marginTop: 10,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#d1d5db',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#000000',
        minHeight: 25,
        alignItems: 'center',
    },
    tableCellHeader: {
        fontSize: 8,
        padding: 6,
        fontSize: 8,
        padding: 6,
        color: '#ffffff',
        fontWeight: 'bold',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderColor: '#ffffff', // GARIS PUTIH DI HEADER
        height: '100%',
    },
    tableHeaderText: {
        color: '#ffffff',
        fontSize: 8,
        fontWeight: 'bold',
        paddingHorizontal: 4,
    },
    tableRow: {
        flexDirection: 'row',
        borderColor: '#d1d5db',
        minHeight: 25,
        alignItems: 'center',
        borderTop: 1,
        borderTopColor: '#d1d5db',
    },
    tableCell: {
        fontSize: 8,
        padding: 6,
        borderLeftWidth: 1,
        borderColor: '#d1d5db',
        height: '100%',
    },
    paymentTermsSection: {
        marginTop: 25,
        padding: 10,
        gap: 4,
        borderBottom: '1 solid #E5E7EB',
    },
    paymentTermRow: {
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        borderBottom: '1 solid #E5E7EB',
        backgroundColor: '#fafafa',
    },
    summaryContainer: {
        marginTop: 20,
        alignSelf: 'flex-end',
        width: '30%',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    summaryLabel: {
        color: '#6b7280',
        fontSize: 8,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 8,
        borderTop: '1 solid #E5E7EB',
    },
    totalLabel: {
        fontSize: 11,
        fontWeight: 'black',
    },
    totalAmount: {
        fontSize: 11,
        fontWeight: 'black',
    },
    termsContainer: {
        marginTop: 20,
        padding: 10,
        borderRadius: 8,
        borderTop: '1 solid #E5E7EB',
        backgroundColor: '#fafafa'
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

const QuotationPDF = ({ quotation, items, terms }) => {
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return `Rp ${Number(amount).toLocaleString("id-ID", { minimumFractionDigits: 2 })}`;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return { backgroundColor: '#dcfce7', color: '#10b981' };
            case 'Sent': return { backgroundColor: '#dbeafe', color: '#3b82f6' };
            case 'Rejected': return { backgroundColor: '#fee2e2', color: '#ef4444' };
            default: return { backgroundColor: '#f3f4f6', color: '#374151' };
        }
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* 1. Header: Title & Status */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.title}>QUOTATION</Text>
                        <Text style={styles.quotationNumber}>#{quotation.quotation_number}</Text>
                    </View>
                    <View style={[styles.statusBadge, getStatusStyle(quotation.status)]}>
                        <Text>{quotation.status}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* 2. Addresses: From & Quotation To */}
                <View style={[styles.sectionInfo, styles.sectionBorder]}>
                    {/* From Section */}
                    <View style={styles.addressBlock}>
                        <Text style={styles.addressTitle}>From</Text>
                        <View style={styles.iconTextRow}>
                            <Svg width={10} height={10} viewBox="0 0 24 24" style={{ marginRight: 4, marginTop: 1 }}>
                                <Path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" fill="#9ca3af" />
                            </Svg>
                            <Text style={styles.companyName}>PT Bandung Teknologi Semesta</Text>
                        </View>
                        <View style={styles.iconTextRow}>
                            <Svg width={10} height={10} viewBox="0 0 24 24" style={{ marginRight: 4, marginTop: 1 }}>
                                <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#9ca3af" />
                            </Svg>
                            <Text style={styles.addressText}>
                                Jl. Nata Kusumah VII, No.J66, RT.01/RW.07, Bandung Regency, West Java 40225
                            </Text>
                        </View>
                        <View style={styles.iconTextRow}>
                            <Svg width={10} height={10} viewBox="0 0 24 24" style={{ marginRight: 4, marginTop: 1 }}>
                                <Path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#9ca3af" />
                            </Svg>
                            <Text style={styles.addressText}>Phone: 083821868088</Text>
                        </View>
                        <View style={styles.iconTextRow}>
                            <Svg width={10} height={10} viewBox="0 0 24 24" style={{ marginRight: 4, marginTop: 1 }}>
                                <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#9ca3af" />
                            </Svg>
                            <Text style={styles.addressText}>Prepared by: Lizuardi Danar Pratisna</Text>
                        </View>
                    </View>

                    {/* To Section */}
                    <View style={[styles.addressBlock, { alignItems: 'flex-end' }]}>
                        <Text style={styles.addressTitle}>Quotation To</Text>
                        <View style={styles.iconTextRow}>
                            <Svg width={10} height={10} viewBox="0 0 24 24" style={{ marginRight: 4, marginTop: 1 }}>
                                <Path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" fill="#9ca3af" />
                            </Svg>
                            <Text style={styles.clientName}>{quotation.company_name}</Text>
                        </View>
                        {/* <View style={styles.iconTextRow}>
                            <Svg width={10} height={10} viewBox="0 0 24 24" style={{ marginRight: 4, marginTop: 1 }}>
                                <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#9ca3af" />
                            </Svg>
                            <Text style={styles.addressText}>{quotation.pic_name}</Text>
                        </View>
                        <View style={styles.iconTextRow}>
                            <Svg width={10} height={10} viewBox="0 0 24 24" style={{ marginRight: 4, marginTop: 1 }}>
                                <Path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#9ca3af" />
                            </Svg>
                            <Text style={styles.addressText}>{quotation.contact}</Text>
                        </View> */}
                        <View style={styles.iconTextRow}>
                            <Svg width={10} height={10} viewBox="0 0 24 24" style={{ marginRight: 4, marginTop: 1 }}>
                                <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#9ca3af" />
                            </Svg>
                            <Text style={styles.addressText}>{quotation.address}</Text>
                        </View>
                    </View>
                </View>

                {/* 3. Project Details Grid */}
                <View style={[styles.projectGrid, styles.sectionBorder]}>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Project</Text>
                        <Text style={styles.gridValue}>{quotation.project_title}</Text>
                    </View>
                    <View style={[styles.gridItem, { textAlign: 'center' }]}>
                        <Text style={styles.gridLabel}>Qotation Date</Text>
                        <Text style={styles.gridValue}>{formatDate(quotation.estimate_date)}</Text>
                    </View>
                    <View style={[styles.gridItem, { textAlign: 'right' }]}>
                        <Text style={styles.gridLabel}>Expiry Date</Text>
                        <Text style={styles.gridValue}>{formatDate(quotation.expiry_date)}</Text>
                    </View>
                    {/* <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Start Date</Text>
                        <Text style={styles.gridValue}>{formatDate(quotation.start_date)}</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>End Date</Text>
                        <Text style={styles.gridValue}>{formatDate(quotation.deadline)}</Text>
                    </View> */}
                </View>

                {/* Items Table */}
                <View style={[styles.table, styles.sectionBorder]}>
                    <Text style={styles.tableTitle}>Items</Text>
                    {/* Header Section */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCellHeader, { width: '55%' }]}>Item</Text>
                        <Text style={[styles.tableCellHeader, { width: '8%', textAlign: 'center' }]}>Unit</Text>
                        <Text style={[styles.tableCellHeader, { width: '8%', textAlign: 'center' }]}>Qty</Text>
                        <Text style={[styles.tableCellHeader, { width: '14.5%', textAlign: 'right' }]}>Price</Text>
                        <Text style={[styles.tableCellHeader, { width: '14.5%', textAlign: 'right' }]}>Total</Text>
                    </View>

                    {/* Body Section */}
                    {items.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={[styles.tableCell, { width: '55%' }]}>
                                <Text style={{ fontSize: 8 }}>{item.item_name}</Text>
                                {item.description && item.description.trim() && item.description !== "-" && (
                                    <Text style={{ fontSize: 6, color: '#6b7280', marginTop: 2 }}>{item.description}</Text>
                                )}
                            </View>
                            <Text style={[styles.tableCell, { width: '8%', textAlign: 'center' }]}>{item.unit}</Text>
                            <Text style={[styles.tableCell, { width: '8%', textAlign: 'center' }]}>{item.qty}</Text>
                            <Text style={[styles.tableCell, { width: '14.5%', textAlign: 'right' }]}>
                                {Number(item.price).toLocaleString("id-ID")}
                            </Text>
                            <Text style={[styles.tableCell, { width: '14.5%', textAlign: 'right', fontWeight: 'bold' }]}>
                                {Number(item.total).toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* 5. Payment Terms */}
                <View style={styles.paymentTermsSection}>
                    <Text style={styles.addressTitle}>Payment Terms</Text>
                    {terms.map((term, index) => (
                        <View key={index} style={styles.paymentTermRow}>
                            <View>
                                <Text style={{ fontWeight: 'bold' }}>Term {term.term_number}</Text>
                                <Text style={{ fontSize: 7, color: '#9ca3af', marginTop: 2 }}>Due: {formatDate(term.term_estimate)}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontWeight: 'bold' }}>{formatCurrency(term.nominal).replace('Rp', 'Rp ')}</Text>
                                <Text style={{ fontSize: 7, color: '#9ca3af', marginTop: 2 }}>{term.term_percentage}.00%</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* 6. Summary */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal:</Text>
                        <Text>Rp {Number(quotation.subtotal).toLocaleString("id-ID", { minimumFractionDigits: 2 })}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Discount:</Text>
                        <Text>
                            {quotation.discount_type === 'percent'
                                ? `${Math.round((Number(quotation.discount) / Number(quotation.subtotal)) * 100)}% (Rp ${Number(quotation.discount).toLocaleString("id-ID", { minimumFractionDigits: 2 })})`
                                : `Rp ${Number(quotation.discount).toLocaleString("id-ID", { minimumFractionDigits: 2 })}`}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tax:</Text>
                        <Text>
                            {quotation.tax_type === 'percent'
                                ? `${Math.round((Number(quotation.tax) / (Number(quotation.subtotal) - Number(quotation.discount))) * 100)}% (Rp ${Number(quotation.tax).toLocaleString("id-ID", { minimumFractionDigits: 2 })})`
                                : `Rp ${Number(quotation.tax).toLocaleString("id-ID", { minimumFractionDigits: 2 })}`}
                        </Text>
                    </View>
                    {terms.map((term, index) => (
                        <View key={index} style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Term {term.term_number}:</Text>
                            <Text>Rp {Number(term.nominal).toLocaleString("id-ID", { minimumFractionDigits: 2 })}</Text>
                        </View>
                    ))}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total:</Text>
                        <Text style={styles.totalAmount}>{formatCurrency(quotation.total)}</Text>
                    </View>
                </View>

                {/* Signature */}
                <View style={styles.signatureContainer}>
                    <Text style={styles.signatureText}>Sincerely,</Text>
                    <Image style={styles.signatureImage} src="/image/signature.jpeg" />
                    <Text style={styles.signatureName}>Lizuardi Danar Pratisna</Text>
                </View>

                {/* 7. Terms & Conditions */}
                {quotation.term_condition && (
                    <View style={styles.termsContainer}>
                        <Text style={[styles.addressTitle, { marginBottom: 10 }]}>Terms & Conditions</Text>
                        <PDFSlateRenderer value={quotation.term_condition} />
                    </View>
                )}
            </Page>
        </Document>
    );
};

export default QuotationPDF;