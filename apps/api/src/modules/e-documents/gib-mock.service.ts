import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface GibSendResult {
  success: boolean;
  gibUuid: string;
  envelopeUuid: string;
  responseCode: string;
  responseMessage: string;
}

export interface GibStatusResult {
  status: 'pending' | 'approved' | 'rejected';
  responseCode: string;
  responseMessage: string;
}

@Injectable()
export class GibMockService {
  async sendDocument(documentType: string, xmlContent: string): Promise<GibSendResult> {
    await this.delay(1500);

    const gibUuid = uuidv4().toUpperCase();
    const envelopeUuid = uuidv4().toUpperCase();

    return {
      success: true,
      gibUuid,
      envelopeUuid,
      responseCode: '1000',
      responseMessage: 'Belge basariyla gonderildi',
    };
  }

  async checkStatus(gibUuid: string): Promise<GibStatusResult> {
    await this.delay(1000);

    return {
      status: 'approved',
      responseCode: '1200',
      responseMessage: 'Belge onaylandi',
    };
  }

  generateEInvoiceXml(data: {
    documentNumber: string;
    issueDate: Date;
    customerName: string;
    customerTaxNumber?: string;
    items: Array<{ name: string; quantity: number; unitPrice: number; vatRate: number }>;
    totalAmount: number;
    vatAmount: number;
  }): string {
    const money = (v: unknown): string => (Number(v) || 0).toFixed(2);
    const totalAmount = Number(data.totalAmount) || 0;
    const vatAmount = Number(data.vatAmount) || 0;

    const itemsXml = data.items
      .map((item, i) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        return `
        <cac:InvoiceLine>
          <cbc:ID>${i + 1}</cbc:ID>
          <cbc:InvoicedQuantity>${qty}</cbc:InvoicedQuantity>
          <cbc:LineExtensionAmount>${money(qty * price)}</cbc:LineExtensionAmount>
          <cac:Item>
            <cbc:Name>${item.name}</cbc:Name>
          </cac:Item>
          <cac:Price>
            <cbc:PriceAmount>${money(price)}</cbc:PriceAmount>
          </cac:Price>
        </cac:InvoiceLine>`;
      })
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>TICARIFATURA</cbc:ProfileID>
  <cbc:ID>${data.documentNumber}</cbc:ID>
  <cbc:IssueDate>${data.issueDate.toISOString().split('T')[0]}</cbc:IssueDate>
  <cbc:IssueTime>${data.issueDate.toISOString().split('T')[1].substring(0, 8)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${data.customerName}</cbc:Name>
      </cac:PartyName>
      ${data.customerTaxNumber ? `<cac:PartyTaxScheme><cbc:TaxTypeCode>${data.customerTaxNumber}</cbc:TaxTypeCode></cac:PartyTaxScheme>` : ''}
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount>${money(vatAmount)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:TaxExclusiveAmount>${money(totalAmount - vatAmount)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount>${money(totalAmount)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount>${money(totalAmount)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${itemsXml}
</Invoice>`;
  }

  generateWaybillXml(data: {
    documentNumber: string;
    issueDate: Date;
    customerName: string;
    deliveryAddress: string;
    items: Array<{ name: string; quantity: number }>;
  }): string {
    const itemsXml = data.items
      .map(
        (item, i) => `
        <cac:DespatchLine>
          <cbc:ID>${i + 1}</cbc:ID>
          <cbc:DeliveredQuantity>${item.quantity}</cbc:DeliveredQuantity>
          <cac:Item>
            <cbc:Name>${item.name}</cbc:Name>
          </cac:Item>
        </cac:DespatchLine>`
      )
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<DespatchAdvice xmlns="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2">
  <cbc:ID>${data.documentNumber}</cbc:ID>
  <cbc:IssueDate>${data.issueDate.toISOString().split('T')[0]}</cbc:IssueDate>
  <cac:DeliveryCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${data.customerName}</cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:DeliveryCustomerParty>
  <cac:Shipment>
    <cac:Delivery>
      <cac:DeliveryAddress>
        <cbc:StreetName>${data.deliveryAddress}</cbc:StreetName>
      </cac:DeliveryAddress>
    </cac:Delivery>
  </cac:Shipment>
  ${itemsXml}
</DespatchAdvice>`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
