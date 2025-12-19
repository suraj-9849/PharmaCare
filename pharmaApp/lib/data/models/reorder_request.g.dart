// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reorder_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ReorderRequest _$ReorderRequestFromJson(Map<String, dynamic> json) =>
    ReorderRequest(
      id: json['id'] as String,
      drugId: json['drugId'] as String,
      requestedBy: json['requestedBy'] as String,
      requestedQty: (json['requestedQty'] as num).toInt(),
      currentStock: (json['currentStock'] as num).toInt(),
      reorderLevel: (json['reorderLevel'] as num).toInt(),
      status: json['status'] as String,
      priority: json['priority'] as String,
      notes: json['notes'] as String?,
      approvedBy: json['approvedBy'] as String?,
      approvedAt: json['approvedAt'] == null
          ? null
          : DateTime.parse(json['approvedAt'] as String),
      orderedAt: json['orderedAt'] == null
          ? null
          : DateTime.parse(json['orderedAt'] as String),
      receivedAt: json['receivedAt'] == null
          ? null
          : DateTime.parse(json['receivedAt'] as String),
      supplierId: json['supplierId'] as String?,
      estimatedCost: (json['estimatedCost'] as num?)?.toDouble(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      drug: json['drug'] == null
          ? null
          : Drug.fromJson(json['drug'] as Map<String, dynamic>),
      supplier: json['supplier'] == null
          ? null
          : Supplier.fromJson(json['supplier'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$ReorderRequestToJson(ReorderRequest instance) =>
    <String, dynamic>{
      'id': instance.id,
      'drugId': instance.drugId,
      'requestedBy': instance.requestedBy,
      'requestedQty': instance.requestedQty,
      'currentStock': instance.currentStock,
      'reorderLevel': instance.reorderLevel,
      'status': instance.status,
      'priority': instance.priority,
      'notes': instance.notes,
      'approvedBy': instance.approvedBy,
      'approvedAt': instance.approvedAt?.toIso8601String(),
      'orderedAt': instance.orderedAt?.toIso8601String(),
      'receivedAt': instance.receivedAt?.toIso8601String(),
      'supplierId': instance.supplierId,
      'estimatedCost': instance.estimatedCost,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'drug': instance.drug,
      'supplier': instance.supplier,
    };
