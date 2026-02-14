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
  const { cashRegister, sales, paymentSummary, topProducts, organization } = data;

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
              <Text style={{ flex: 1.5 }}>N° Doc</Text>
              <Text style={{ flex: 2 }}>Cliente</Text>
              <Text style={{ flex: 1.2 }}>Método</Text>
              <Text style={styles.tableCellRight}>Total</Text>
            </View>
            {sales.map((sale) => (
              <View key={sale.id} style={styles.tableRow}>
                <Text style={{ flex: 1.5, fontSize: 8 }}>{sale.documentNumber}</Text>
                <Text style={{ flex: 2, fontSize: 8 }}>{sale.customerName}</Text>
                <Text style={{ flex: 1.2, fontSize: 8 }}>
                  {getPaymentMethodLabel(sale.paymentMethod)}
                </Text>
                <Text style={[styles.tableCellRight, { fontSize: 8 }]}>
                  {formatCurrency(sale.total)}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.summaryBox, { marginTop: 20 }]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>TOTAL:</Text>
              <Text style={styles.summaryTotal}>
                {formatCurrency(cashRegister.totalSales)}
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
