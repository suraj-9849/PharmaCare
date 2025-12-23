// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'invoice.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

InvoiceExtraction _$InvoiceExtractionFromJson(Map<String, dynamic> json) =>
    InvoiceExtraction(
      invoiceNumber: json['invoiceNumber'] as String,
      supplierName: json['supplierName'] as String,
      invoiceDate: DateTime.parse(json['invoiceDate'] as String),
      items: (json['items'] as List<dynamic>)
          .map((e) => InvoiceItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalAmount: (json['totalAmount'] as num).toDouble(),
    );

Map<String, dynamic> _$InvoiceExtractionToJson(InvoiceExtraction instance) =>
    <String, dynamic>{
      'invoiceNumber': instance.invoiceNumber,
      'supplierName': instance.supplierName,
      'invoiceDate': instance.invoiceDate.toIso8601String(),
      'items': instance.items,
      'totalAmount': instance.totalAmount,
    };

InvoiceItem _$InvoiceItemFromJson(Map<String, dynamic> json) => InvoiceItem(
      drugName: json['drugName'] as String,
      batchNumber: json['batchNumber'] as String?,
      quantity: (json['quantity'] as num).toInt(),
      unitPrice: (json['unitPrice'] as num).toDouble(),
      totalPrice: (json['totalPrice'] as num).toDouble(),
      expiryDate: json['expiryDate'] == null
          ? null
          : DateTime.parse(json['expiryDate'] as String),
    );

Map<String, dynamic> _$InvoiceItemToJson(InvoiceItem instance) =>
    <String, dynamic>{
      'drugName': instance.drugName,
      'batchNumber': instance.batchNumber,
      'quantity': instance.quantity,
      'unitPrice': instance.unitPrice,
      'totalPrice': instance.totalPrice,
      'expiryDate': instance.expiryDate?.toIso8601String(),
    };
