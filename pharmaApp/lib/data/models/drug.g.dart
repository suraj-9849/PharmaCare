// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'drug.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Drug _$DrugFromJson(Map<String, dynamic> json) => Drug(
      id: json['id'] as String,
      brandName: json['brandName'] as String,
      genericName: json['genericName'] as String,
      chemicalName: json['chemicalName'] as String?,
      dosage: json['dosage'] as String?,
      category: json['category'] as String?,
      manufacturer: json['manufacturer'] as String?,
      requiresPrescription: json['requiresPrescription'] as bool?,
      reorderLevel: (json['reorderLevel'] as num?)?.toInt(),
      sku: json['sku'] as String?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
      totalQuantity: (json['totalQuantity'] as num?)?.toInt(),
      batches: (json['batches'] as List<dynamic>?)
          ?.map((e) => InventoryBatch.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$DrugToJson(Drug instance) => <String, dynamic>{
      'id': instance.id,
      'brandName': instance.brandName,
      'genericName': instance.genericName,
      'chemicalName': instance.chemicalName,
      'dosage': instance.dosage,
      'category': instance.category,
      'manufacturer': instance.manufacturer,
      'requiresPrescription': instance.requiresPrescription,
      'reorderLevel': instance.reorderLevel,
      'sku': instance.sku,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'totalQuantity': instance.totalQuantity,
      'batches': instance.batches,
    };

InventoryBatch _$InventoryBatchFromJson(Map<String, dynamic> json) =>
    InventoryBatch(
      id: json['id'] as String,
      drugId: json['drugId'] as String,
      batchNumber: json['batchNumber'] as String,
      quantity: (json['quantity'] as num).toInt(),
      purchasePrice: InventoryBatch._toDouble(json['purchasePrice']),
      sellPrice: InventoryBatch._toDouble(json['sellPrice']),
      expiryDate: DateTime.parse(json['expiryDate'] as String),
      supplierId: json['supplierId'] as String?,
      location: json['location'] as String?,
      shelfLocationId: json['shelfLocationId'] as String?,
      queuePosition: (json['queuePosition'] as num?)?.toInt(),
      dateAdded: DateTime.parse(json['dateAdded'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      shelfLocation: json['shelfLocation'] == null
          ? null
          : ShelfLocation.fromJson(
              json['shelfLocation'] as Map<String, dynamic>),
      supplier: json['supplier'] == null
          ? null
          : Supplier.fromJson(json['supplier'] as Map<String, dynamic>),
      drug: json['drug'] == null
          ? null
          : Drug.fromJson(json['drug'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$InventoryBatchToJson(InventoryBatch instance) =>
    <String, dynamic>{
      'id': instance.id,
      'drugId': instance.drugId,
      'batchNumber': instance.batchNumber,
      'quantity': instance.quantity,
      'purchasePrice': instance.purchasePrice,
      'sellPrice': instance.sellPrice,
      'expiryDate': instance.expiryDate.toIso8601String(),
      'supplierId': instance.supplierId,
      'location': instance.location,
      'shelfLocationId': instance.shelfLocationId,
      'queuePosition': instance.queuePosition,
      'dateAdded': instance.dateAdded.toIso8601String(),
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'shelfLocation': instance.shelfLocation,
      'supplier': instance.supplier,
      'drug': instance.drug,
    };

Supplier _$SupplierFromJson(Map<String, dynamic> json) => Supplier(
      id: json['id'] as String,
      supplierName: json['supplierName'] as String,
      contactNumber: json['contactNumber'] as String?,
      email: json['email'] as String?,
      address: json['address'] as String?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$SupplierToJson(Supplier instance) => <String, dynamic>{
      'id': instance.id,
      'supplierName': instance.supplierName,
      'contactNumber': instance.contactNumber,
      'email': instance.email,
      'address': instance.address,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
    };

ShelfLocation _$ShelfLocationFromJson(Map<String, dynamic> json) =>
    ShelfLocation(
      id: json['id'] as String,
      shelfCode: json['shelfCode'] as String,
      shelfName: json['shelfName'] as String,
      row: json['row'] as String?,
      column: json['column'] as String?,
      zone: json['zone'] as String?,
      capacity: (json['capacity'] as num).toInt(),
      status: json['status'] as String,
      qrCode: json['qrCode'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$ShelfLocationToJson(ShelfLocation instance) =>
    <String, dynamic>{
      'id': instance.id,
      'shelfCode': instance.shelfCode,
      'shelfName': instance.shelfName,
      'row': instance.row,
      'column': instance.column,
      'zone': instance.zone,
      'capacity': instance.capacity,
      'status': instance.status,
      'qrCode': instance.qrCode,
      'notes': instance.notes,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
