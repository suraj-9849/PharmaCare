import 'package:json_annotation/json_annotation.dart';
import 'package:pharma_care/data/models/drug.dart';

part 'reorder_request.g.dart';

@JsonSerializable()
class ReorderRequest {
  final String id;
  final String drugId;
  final String requestedBy;
  final int requestedQty;
  final int currentStock;
  final int reorderLevel;
  final String status;
  final String priority;
  final String? notes;
  final String? approvedBy;
  final DateTime? approvedAt;
  final DateTime? orderedAt;
  final DateTime? receivedAt;
  final String? supplierId;
  final double? estimatedCost;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Drug? drug;
  final Supplier? supplier;

  ReorderRequest({
    required this.id,
    required this.drugId,
    required this.requestedBy,
    required this.requestedQty,
    required this.currentStock,
    required this.reorderLevel,
    required this.status,
    required this.priority,
    this.notes,
    this.approvedBy,
    this.approvedAt,
    this.orderedAt,
    this.receivedAt,
    this.supplierId,
    this.estimatedCost,
    required this.createdAt,
    required this.updatedAt,
    this.drug,
    this.supplier,
  });

  factory ReorderRequest.fromJson(Map<String, dynamic> json) =>
      _$ReorderRequestFromJson(json);
  Map<String, dynamic> toJson() => _$ReorderRequestToJson(this);

  bool get isPending => status.toUpperCase() == 'PENDING';
  bool get isApproved => status.toUpperCase() == 'APPROVED';
  bool get isOrdered => status.toUpperCase() == 'ORDERED';
  bool get isReceived => status.toUpperCase() == 'RECEIVED';
  bool get isRejected => status.toUpperCase() == 'REJECTED';

  bool get isHighPriority => priority.toUpperCase() == 'HIGH';
  bool get isMediumPriority => priority.toUpperCase() == 'MEDIUM';
  bool get isLowPriority => priority.toUpperCase() == 'LOW';
}
