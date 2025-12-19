import 'package:json_annotation/json_annotation.dart';

part 'invoice.g.dart';

@JsonSerializable()
class InvoiceExtraction {
  final String invoiceNumber;
  final String supplierName;
  final DateTime invoiceDate;
  final List<InvoiceItem> items;
  final double totalAmount;

  InvoiceExtraction({
    required this.invoiceNumber,
    required this.supplierName,
    required this.invoiceDate,
    required this.items,
    required this.totalAmount,
  });

  factory InvoiceExtraction.fromJson(Map<String, dynamic> json) =>
      _$InvoiceExtractionFromJson(json);
  Map<String, dynamic> toJson() => _$InvoiceExtractionToJson(this);
}

@JsonSerializable()
class InvoiceItem {
  final String drugName;
  final String? batchNumber;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final DateTime? expiryDate;

  InvoiceItem({
    required this.drugName,
    this.batchNumber,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.expiryDate,
  });

  factory InvoiceItem.fromJson(Map<String, dynamic> json) =>
      _$InvoiceItemFromJson(json);
  Map<String, dynamic> toJson() => _$InvoiceItemToJson(this);
}
