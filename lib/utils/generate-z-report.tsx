import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Registrar fuentes (opcional, usa las por defecto de PDF)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
  ],
});

// Estilos del PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 3,
  },
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: '#666',
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    padding: 5,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#e0e0e0',
    padding: 5,
    fontSize: 9,
  },
  tableCell: {
    flex: 1,
  },
  tableCellRight: {
    flex: 1,
    textAlign: 'right',
  },
  summaryBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    border: 1,
    borderColor: '#ccc',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
    paddingTop: 5,
    borderTop: 2,
    borderTopColor: '#000',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTop: 1,
    borderTopColor: '#ccc',
    paddingTop: 5,
  },
  positive: {
    color: '#22c55e',
  },
  negative: {
    color: '#ef4444',
  },
});

interface ReportData {
  cashRegister: {
    id: string;
    openedAt: string;
    closedAt: string;
    openingCash: number;
    expectedCash: number;
    actualCash: number;
    difference: number;
    totalSales: number;
    salesCount: number;
    notes: string | null;
  };
  sales: Array<{
    id: string;
    documentNumber: string;
    customerName: string;
    customerRut: string;
    paymentMethod: string;
    cardType: 'DEBIT' | 'CREDIT' | null;
    cardCommissionAmount: number;
    subtotal: number;
    costOfSales: number;
    finalProfit: number;
    finalMarginPercent: number;
    taxAmount: number;
    discount: number;
    total: number;
    issuedAt: string;
    items: Array<{
      name: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
  }>;
  paymentSummary: Record<string, { count: number; total: number }>;
  taxSummary: {
    subtotal: number;
    taxAmount: number;
    discount: number;
    costOfSalesTotal: number;
    cardCommissionTotal: number;
    finalProfitTotal: number;
    finalMarginPercent: number;
    total: number;
  };
  topProducts: Array<{
    productId: string | null;
    productName: string;
    sku: string;
    quantity: number;
    revenue: number;
  }>;
  organization: {
    name: string;
    rut: string | null;
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
};

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
    MULTI: 'Mixto',
  };
  return labels[method] || method;
};

export const ZReportDocument: React.FC<{ data: ReportData }> = ({ data }) => {
  const { cashRegister, sales, paymentSummary, taxSummary, topProducts, organization } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>REPORTE Z - CIERRE DE CAJA</Text>
          <Text style={styles.subtitle}>{organization.name}</Text>
          {organization.rut && (
            <Text style={styles.subtitle}>RUT: {organization.rut}</Text>
          )}
          <Text style={styles.subtitle}>
            Fecha: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
          </Text>
        </View>

        {/* Información de Turno */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMACIÓN DEL TURNO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Apertura:</Text>
            <Text style={styles.value}>{formatDate(cashRegister.openedAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Cierre:</Text>
            <Text style={styles.value}>{formatDate(cashRegister.closedAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>ID Caja:</Text>
            <Text style={styles.value}>{cashRegister.id}</Text>
          </View>
        </View>

        {/* Resumen de Efectivo */}
        <View style={styles.summaryBox}>
          <Text style={styles.sectionTitle}>ARQUEO DE EFECTIVO</Text>
          <View style={styles.summaryRow}>
            <Text>Fondo Inicial:</Text>
            <Text>{formatCurrency(cashRegister.openingCash)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Efectivo Esperado:</Text>
            <Text>{formatCurrency(cashRegister.expectedCash)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Efectivo Contado:</Text>
            <Text>{formatCurrency(cashRegister.actualCash)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text>Diferencia:</Text>
            <Text style={cashRegister.difference >= 0 ? styles.positive : styles.negative}>
              {formatCurrency(cashRegister.difference)}
            </Text>
          </View>
          <View style={{ marginTop: 8, padding: 6, backgroundColor: '#f0f0f0', borderRadius: 3 }}>
            <Text style={{ fontSize: 7, color: '#666', textAlign: 'center' }}>
              ℹ️ El arqueo de efectivo solo considera billetes y monedas físicos.{'\n'}
              Los vouchers de tarjeta y comprobantes de transferencia se verifican contra registros bancarios.
            </Text>
          </View>
        </View>

        {/* Resumen de Ventas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESUMEN DE VENTAS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total de Ventas:</Text>
            <Text style={styles.value}>{cashRegister.salesCount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Monto Total:</Text>
            <Text style={styles.value}>{formatCurrency(cashRegister.totalSales)}</Text>
          </View>
        </View>

        {/* Rentabilidad Final */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MARGEN FINAL DE GANANCIA</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Neto Ventas:</Text>
            <Text style={styles.value}>{formatCurrency(taxSummary.subtotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Costo de Venta:</Text>
            <Text style={styles.value}>-{formatCurrency(taxSummary.costOfSalesTotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Comisiones Tarjeta:</Text>
            <Text style={styles.value}>-{formatCurrency(taxSummary.cardCommissionTotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Utilidad Final:</Text>
            <Text style={[styles.value, taxSummary.finalProfitTotal >= 0 ? styles.positive : styles.negative]}>
              {formatCurrency(taxSummary.finalProfitTotal)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Margen Final %:</Text>
            <Text style={[styles.value, taxSummary.finalMarginPercent >= 0 ? styles.positive : styles.negative]}>
              {taxSummary.finalMarginPercent.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Detalle por Método de Pago */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALLE POR MÉTODO DE PAGO</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCell}>Método</Text>
              <Text style={styles.tableCellRight}>Cantidad</Text>
              <Text style={styles.tableCellRight}>Total</Text>
            </View>
            {Object.entries(paymentSummary).map(([method, data]) => (
              <View key={method} style={styles.tableRow}>
                <Text style={styles.tableCell}>{getPaymentMethodLabel(method)}</Text>
                <Text style={styles.tableCellRight}>{data.count}</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(data.total)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Productos Más Vendidos */}
        {topProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TOP 5 PRODUCTOS MÁS VENDIDOS</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={{ flex: 2 }}>Producto</Text>
                <Text style={styles.tableCellRight}>Cantidad</Text>
                <Text style={styles.tableCellRight}>Total</Text>
              </View>
              {topProducts.map((product, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={{ flex: 2 }}>{product.productName}</Text>
                  <Text style={styles.tableCellRight}>{product.quantity}</Text>
                  <Text style={styles.tableCellRight}>{formatCurrency(product.revenue)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notas */}
        {cashRegister.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OBSERVACIONES</Text>
            <Text style={{ fontSize: 9, marginTop: 5 }}>{cashRegister.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generado por Tendo - Sistema de Gestión Comercial</Text>
          <Text>Este documento es un reporte interno y no tiene validez tributaria</Text>
        </View>
      </Page>

      {/* Segunda Página: Detalle de Ventas */}
      {sales.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>DETALLE DE VENTAS</Text>
            <Text style={styles.subtitle}>
              {formatDate(cashRegister.openedAt)} - {formatDate(cashRegister.closedAt)}
            </Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ flex: 1.1 }}>N° Doc</Text>
              <Text style={{ flex: 1.5 }}>Cliente</Text>
              <Text style={{ flex: 1 }}>Método</Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>Neto</Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>Costo</Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>Comis.</Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>Utilidad</Text>
              <Text style={{ flex: 0.8, textAlign: 'right' }}>Margen%</Text>
            </View>
            {sales.map((sale) => (
              <View key={sale.id} style={styles.tableRow}>
                <Text style={{ flex: 1.1, fontSize: 8 }}>{sale.documentNumber}</Text>
                <Text style={{ flex: 1.5, fontSize: 8 }}>{sale.customerName}</Text>
                <Text style={{ flex: 1, fontSize: 8 }}>
                  {sale.paymentMethod === 'CARD' && sale.cardType
                    ? `${getPaymentMethodLabel(sale.paymentMethod)} ${sale.cardType === 'DEBIT' ? 'D' : 'C'}`
                    : getPaymentMethodLabel(sale.paymentMethod)}
                </Text>
                <Text style={{ flex: 1, textAlign: 'right', fontSize: 8 }}>
                  {formatCurrency(sale.subtotal)}
                </Text>
                <Text style={{ flex: 1, textAlign: 'right', fontSize: 8 }}>
                  {formatCurrency(sale.costOfSales)}
                </Text>
                <Text style={{ flex: 1, textAlign: 'right', fontSize: 8 }}>
                  -{formatCurrency(sale.cardCommissionAmount || 0)}
                </Text>
                <Text style={{ flex: 1, textAlign: 'right', fontSize: 8 }}>
                  {formatCurrency(sale.finalProfit)}
                </Text>
                <Text style={{ flex: 0.8, textAlign: 'right', fontSize: 8 }}>
                  {sale.finalMarginPercent.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.summaryBox, { marginTop: 20 }]}>
            <View style={styles.summaryRow}>
              <Text>Total Neto:</Text>
              <Text>{formatCurrency(taxSummary.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Total Costo:</Text>
              <Text>{formatCurrency(taxSummary.costOfSalesTotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Total Comisión:</Text>
              <Text>{formatCurrency(taxSummary.cardCommissionTotal)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text>UTILIDAD FINAL:</Text>
              <Text style={taxSummary.finalProfitTotal >= 0 ? styles.positive : styles.negative}>
                {formatCurrency(taxSummary.finalProfitTotal)} ({taxSummary.finalMarginPercent.toFixed(1)}%)
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text>Página 2 de 2 - Detalle de Ventas</Text>
          </View>
        </Page>
      )}
    </Document>
  );
};
