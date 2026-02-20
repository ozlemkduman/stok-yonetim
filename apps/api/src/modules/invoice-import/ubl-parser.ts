import { parseStringPromise } from 'xml2js';

export interface ParsedInvoice {
  id: string;
  issueDate: string;
  invoiceTypeCode: string;
  currencyCode: string;
}

export interface ParsedCustomer {
  name: string;
  taxNumber: string | null;
  taxOffice: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface ParsedItem {
  name: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  lineTotal: number;
  vatAmount: number;
  unit: string;
}

export interface ParsedTotals {
  lineExtensionAmount: number;
  taxInclusiveAmount: number;
  taxTotal: number;
  payableAmount: number;
}

export interface ParsedUblInvoice {
  invoice: ParsedInvoice;
  customer: ParsedCustomer;
  items: ParsedItem[];
  totals: ParsedTotals;
}

function text(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node.trim();
  if (Array.isArray(node)) return text(node[0]);
  if (node._) return node._.trim();
  if (node.$) return '';
  return String(node).trim();
}

function num(node: any): number {
  const val = parseFloat(text(node));
  return isNaN(val) ? 0 : val;
}

export async function parseUblXml(buffer: Buffer): Promise<ParsedUblInvoice> {
  const xml = buffer.toString('utf-8');
  const result = await parseStringPromise(xml, {
    explicitArray: false,
    ignoreAttrs: false,
    tagNameProcessors: [(name: string) => name.replace(/^.*:/, '')],
  });

  // The root element can be "Invoice" directly or nested
  const inv = result.Invoice || result['Invoice'] || Object.values(result)[0];
  if (!inv) {
    throw new Error('Geçerli bir UBL fatura XML dosyası bulunamadı');
  }

  // Invoice info
  const invoice: ParsedInvoice = {
    id: text(inv.ID),
    issueDate: text(inv.IssueDate),
    invoiceTypeCode: text(inv.InvoiceTypeCode) || 'SATIS',
    currencyCode: text(inv.DocumentCurrencyCode) || 'TRY',
  };

  // Customer info from AccountingCustomerParty
  const customerParty = inv.AccountingCustomerParty?.Party || inv.AccountingCustomerParty || {};
  const partyName = customerParty.PartyName?.Name || customerParty.PartyName || '';
  const partyIdScheme = customerParty.PartyIdentification;
  let taxNumber: string | null = null;

  if (partyIdScheme) {
    const ids = Array.isArray(partyIdScheme) ? partyIdScheme : [partyIdScheme];
    for (const pid of ids) {
      const idText = text(pid.ID);
      if (idText) {
        taxNumber = idText;
        break;
      }
    }
  }

  const taxScheme = customerParty.PartyTaxScheme || {};
  const taxOffice = text(taxScheme.TaxScheme?.Name || taxScheme.Name || '');

  const postalAddress = customerParty.PostalAddress || {};
  const addressParts = [
    text(postalAddress.StreetName),
    text(postalAddress.BuildingNumber),
    text(postalAddress.CitySubdivisionName),
    text(postalAddress.CityName),
    text(postalAddress.Country?.Name),
  ].filter(Boolean);

  const contact = customerParty.Contact || {};

  const customer: ParsedCustomer = {
    name: text(partyName),
    taxNumber,
    taxOffice: taxOffice || null,
    address: addressParts.length > 0 ? addressParts.join(', ') : null,
    phone: text(contact.Telephone) || null,
    email: text(contact.ElectronicMail) || null,
  };

  // Items from InvoiceLine
  const lines = inv.InvoiceLine;
  const lineArray = Array.isArray(lines) ? lines : lines ? [lines] : [];

  const items: ParsedItem[] = lineArray.map((line: any) => {
    const itemName = text(line.Item?.Name || line.Item || '');
    const quantity = num(line.InvoicedQuantity);
    const priceAmount = num(line.Price?.PriceAmount);
    const lineExtension = num(line.LineExtensionAmount);

    // VAT info
    const taxCategory = line.TaxTotal?.TaxSubtotal?.TaxCategory ||
      line.Item?.ClassifiedTaxCategory || {};
    const vatRate = num(taxCategory.Percent);
    const vatAmount = num(line.TaxTotal?.TaxAmount);

    // Unit from InvoicedQuantity attribute
    let unit = 'adet';
    const qtyAttr = line.InvoicedQuantity?.$?.unitCode || line.InvoicedQuantity?.$ ?.unitCode;
    if (qtyAttr) {
      const unitMap: Record<string, string> = {
        'C62': 'adet', 'NIU': 'adet', 'KGM': 'kg', 'LTR': 'litre',
        'MTR': 'metre', 'BX': 'kutu', 'PK': 'paket',
      };
      unit = unitMap[qtyAttr] || 'adet';
    }

    return {
      name: itemName,
      quantity,
      unitPrice: priceAmount || (quantity > 0 ? lineExtension / quantity : 0),
      vatRate,
      lineTotal: lineExtension + vatAmount,
      vatAmount,
      unit,
    };
  });

  // Totals
  const monetary = inv.LegalMonetaryTotal || {};
  const taxTotal = inv.TaxTotal || {};

  const totals: ParsedTotals = {
    lineExtensionAmount: num(monetary.LineExtensionAmount),
    taxInclusiveAmount: num(monetary.TaxInclusiveAmount),
    taxTotal: num(taxTotal.TaxAmount),
    payableAmount: num(monetary.PayableAmount),
  };

  // Fallback: compute totals from items if monetary is empty
  if (totals.lineExtensionAmount === 0 && items.length > 0) {
    totals.lineExtensionAmount = items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0);
    totals.taxTotal = items.reduce((s, i) => s + i.vatAmount, 0);
    totals.taxInclusiveAmount = totals.lineExtensionAmount + totals.taxTotal;
    totals.payableAmount = totals.taxInclusiveAmount;
  }

  return { invoice, customer, items, totals };
}
