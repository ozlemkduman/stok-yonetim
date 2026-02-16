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
    const itemsXml = data.items
      .map(
        (item, i) => `
        <cac:InvoiceLine>
          <cbc:ID>${i + 1}</cbc:ID>
          <cbc:InvoicedQuantity>${item.quantity}</cbc:InvoicedQuantity>
          <cbc:LineExtensionAmount>${(item.quantity * item.unitPrice).toFixed(2)}</cbc:LineExtensionAmount>
          <cac:Item>
            <cbc:Name>${item.name}</cbc:Name>
          </cac:Item>
          <cac:Price>
            <cbc:PriceAmount>${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
          </cac:Price>
        </cac:InvoiceLine>`
      )
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
    <cbc:TaxAmount>${data.vatAmount.toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:TaxExclusiveAmount>${(data.totalAmount - data.vatAmount).toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount>${data.totalAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount>${data.totalAmount.toFixed(2)}</cbc:PayableAmount>
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
