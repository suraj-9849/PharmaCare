// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'prescription.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PrescriptionExtraction _$PrescriptionExtractionFromJson(
        Map<String, dynamic> json) =>
    PrescriptionExtraction(
      patientName: json['patientName'] as String?,
      doctorName: json['doctorName'] as String?,
      prescriptionDate: json['prescriptionDate'] == null
          ? null
          : DateTime.parse(json['prescriptionDate'] as String),
      medications: (json['medications'] as List<dynamic>)
          .map(
              (e) => PrescriptionMedication.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$PrescriptionExtractionToJson(
        PrescriptionExtraction instance) =>
    <String, dynamic>{
      'patientName': instance.patientName,
      'doctorName': instance.doctorName,
      'prescriptionDate': instance.prescriptionDate?.toIso8601String(),
      'medications': instance.medications,
    };

PrescriptionMedication _$PrescriptionMedicationFromJson(
        Map<String, dynamic> json) =>
    PrescriptionMedication(
      medicationName: json['medicationName'] as String,
      dosage: json['dosage'] as String?,
      frequency: json['frequency'] as String?,
      duration: (json['duration'] as num?)?.toInt(),
      quantity: (json['quantity'] as num?)?.toInt(),
      available: json['available'] as bool,
      matchedDrugId: json['matchedDrugId'] as String?,
      matchedDrugName: json['matchedDrugName'] as String?,
    );

Map<String, dynamic> _$PrescriptionMedicationToJson(
        PrescriptionMedication instance) =>
    <String, dynamic>{
      'medicationName': instance.medicationName,
      'dosage': instance.dosage,
      'frequency': instance.frequency,
      'duration': instance.duration,
      'quantity': instance.quantity,
      'available': instance.available,
      'matchedDrugId': instance.matchedDrugId,
      'matchedDrugName': instance.matchedDrugName,
    };
