import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface QuotePdfItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  total: number;
}

interface QuotePdfCustomer {
  name: string;
  rut: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
}

interface QuotePdfOrganization {
  name: string;
  rut: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  email: string | null;
  phone: string | null;
}

export interface QuotePdfData {
  quoteId: string;
  docNumber: number;
  docPrefix: string | null;
  issuedAt: string;
  dueAt: string | null;
  notes: string | null;
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  customer: QuotePdfCustomer | null;
  organization: QuotePdfOrganization;
  items: QuotePdfItem[];
}

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#d1d5db',
    paddingBottom: 10,
    marginBottom: 14,
  },
  heading: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4,
  },
  muted: {
    color: '#6b7280',
    fontSize: 9,
    marginBottom: 2,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 6,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  column: {
    width: '48%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#e5e7eb',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 9,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 9,
  },
  colName: {
    width: '38%',
    paddingRight: 4,
  },
  colQty: {
    width: '10%',
    textAlign: 'right',
  },
  colUnit: {
    width: '10%',
    textAlign: 'center',
  },
  colPrice: {
    width: '21%',
    textAlign: 'right',
  },
  colTotal: {
    width: '21%',
    textAlign: 'right',
  },
  totalsBox: {
    marginTop: 12,
    marginLeft: '50%',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    padding: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalFinal: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#d1d5db',
    fontWeight: 700,
    fontSize: 11,
  },
  notes: {
    marginTop: 12,
    padding: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    fontSize: 9,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 28,
    right: 28,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
});

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy', { locale: es });
}

export function buildQuotePdfDocument(data: QuotePdfData) {
  const quoteCode = `${data.docPrefix || 'COT'}-${data.docNumber}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.heading}>Cotización {quoteCode}</Text>
          <Text style={styles.muted}>{data.organization.name}</Text>
          {data.organization.rut && <Text style={styles.muted}>RUT: {data.organization.rut}</Text>}
          {(data.organization.address || data.organization.city || data.organization.region) && (
            <Text style={styles.muted}>
              {[data.organization.address, data.organization.city, data.organization.region]
                .filter(Boolean)
                .join(', ')}
            </Text>
          )}
          {(data.organization.email || data.organization.phone) && (
            <Text style={styles.muted}>
              {[data.organization.email, data.organization.phone].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>

        <View style={[styles.section, styles.row]}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <Text>{data.customer?.name || 'Sin cliente'}</Text>
            {data.customer?.company && <Text style={styles.muted}>{data.customer.company}</Text>}
            {data.customer?.rut && <Text style={styles.muted}>RUT: {data.customer.rut}</Text>}
            {(data.customer?.email || data.customer?.phone) && (
              <Text style={styles.muted}>
                {[data.customer.email, data.customer.phone].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Datos del documento</Text>
            <Text style={styles.muted}>Emisión: {formatDate(data.issuedAt)}</Text>
            <Text style={styles.muted}>Vigencia: {formatDate(data.dueAt)}</Text>
            <Text style={styles.muted}>Referencia: {data.quoteId}</Text>
          </View>
        </View>

        <View>
          <View style={styles.tableHeader}>
            <Text style={styles.colName}>Detalle</Text>
            <Text style={styles.colQty}>Cant.</Text>
            <Text style={styles.colUnit}>Unidad</Text>
            <Text style={styles.colPrice}>Precio unit.</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {data.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.colName}>
                <Text>{item.name}</Text>
                {item.description ? <Text style={styles.muted}>{item.description}</Text> : null}
              </View>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{formatCurrency(data.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>IVA</Text>
            <Text>{formatCurrency(data.taxAmount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Descuento</Text>
            <Text>{formatCurrency(data.discount)}</Text>
          </View>
          <View style={[styles.totalRow, styles.totalFinal]}>
            <Text>Total</Text>
            <Text>{formatCurrency(data.total)}</Text>
          </View>
        </View>

        {data.notes ? (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text>{data.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Documento generado por Tendo · {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
        </Text>
      </Page>
    </Document>
  );
}