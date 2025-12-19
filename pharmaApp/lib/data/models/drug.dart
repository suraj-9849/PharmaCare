import 'package:json_annotation/json_annotation.dart';

part 'drug.g.dart';

@JsonSerializable()
class Drug {
  final String id;
  final String brandName;
  final String genericName;
  final String? chemicalName;
  final String? dosage;
  final String? category;
  final String? manufacturer;
  final bool? requiresPrescription;
  final int? reorderLevel;
  final String? sku;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final int? totalQuantity;
  final List<InventoryBatch>? batches;

  Drug({
    required this.id,
    required this.brandName,
    required this.genericName,
    this.chemicalName,
    this.dosage,
    this.category,
    this.manufacturer,
    this.requiresPrescription,
    this.reorderLevel,
    this.sku,
    this.createdAt,
    this.updatedAt,
    this.totalQuantity,
    this.batches,
  });

  factory Drug.fromJson(Map<String, dynamic> json) => _$DrugFromJson(json);
  Map<String, dynamic> toJson() => _$DrugToJson(this);

  String get displayName {
    if (dosage != null && dosage!.isNotEmpty) {
      return '$brandName $dosage';
    }
    return brandName;
  }

  int get currentStock {
    // If totalQuantity is provided, use it
    if (totalQuantity != null) return totalQuantity!;

    // Otherwise calculate from batches
    if (batches != null && batches!.isNotEmpty) {
      return batches!.fold<int>(0, (sum, batch) => sum + batch.quantity);
    }

    return 0;
  }

  bool get isLowStock => currentStock <= (reorderLevel ?? 0);
  bool get isOutOfStock => currentStock == 0;
  bool get isCriticalStock => currentStock <= ((reorderLevel ?? 0) * 0.5);
}

@JsonSerializable()
class InventoryBatch {
  final String id;
  final String drugId;
  final String batchNumber;
  final int quantity;
  @JsonKey(fromJson: _toDouble)
  final double purchasePrice;
  @JsonKey(fromJson: _toDouble)
  final double sellPrice;
  final DateTime expiryDate;
  final String? supplierId;
  final String? location;
  final String? shelfLocationId;
  final int? queuePosition;
  final DateTime dateAdded;
  final DateTime createdAt;
  final DateTime updatedAt;
  final ShelfLocation? shelfLocation;
  final Supplier? supplier;
  final Drug? drug;

  static double _toDouble(dynamic value) {
    if (value is int) return value.toDouble();
    if (value is double) return value;
    if (value is String) return double.parse(value);
    return 0.0;
  }

  InventoryBatch({
    required this.id,
    required this.drugId,
    required this.batchNumber,
    required this.quantity,
    required this.purchasePrice,
    required this.sellPrice,
    required this.expiryDate,
    this.supplierId,
    this.location,
    this.shelfLocationId,
    this.queuePosition,
    required this.dateAdded,
    required this.createdAt,
    required this.updatedAt,
    this.shelfLocation,
    this.supplier,
    this.drug,
  });

  factory InventoryBatch.fromJson(Map<String, dynamic> json) =>
      _$InventoryBatchFromJson(json);
  Map<String, dynamic> toJson() => _$InventoryBatchToJson(this);

  bool get isExpired => DateTime.now().isAfter(expiryDate);

  bool get isExpiringSoon {
    final daysUntilExpiry = expiryDate.difference(DateTime.now()).inDays;
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }

  int get daysUntilExpiry => expiryDate.difference(DateTime.now()).inDays;
}

@JsonSerializable()
class Supplier {
  final String id;
  final String supplierName;
  final String? contactNumber;
  final String? email;
  final String? address;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Supplier({
    required this.id,
    required this.supplierName,
    this.contactNumber,
    this.email,
    this.address,
    this.createdAt,
    this.updatedAt,
  });

  factory Supplier.fromJson(Map<String, dynamic> json) =>
      _$SupplierFromJson(json);
  Map<String, dynamic> toJson() => _$SupplierToJson(this);
}

@JsonSerializable()
class ShelfLocation {
  final String id;
  final String shelfCode;
  final String shelfName;
  final String? row;
  final String? column;
  final String? zone;
  final int capacity;
  final String status;
  final String? qrCode;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  ShelfLocation({
    required this.id,
    required this.shelfCode,
    required this.shelfName,
    this.row,
    this.column,
    this.zone,
    required this.capacity,
    required this.status,
    this.qrCode,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ShelfLocation.fromJson(Map<String, dynamic> json) =>
      _$ShelfLocationFromJson(json);
  Map<String, dynamic> toJson() => _$ShelfLocationToJson(this);

  String get displayLocation {
    if (zone != null) {
      return '$shelfCode ($zone)';
    }
    return shelfCode;
  }
}
