import 'package:json_annotation/json_annotation.dart';

part 'prescription.g.dart';

@JsonSerializable()
class PrescriptionExtraction {
  final String? patientName;
  final String? doctorName;
  final DateTime? prescriptionDate;
  final List<PrescriptionMedication> medications;

  PrescriptionExtraction({
    this.patientName,
    this.doctorName,
    this.prescriptionDate,
    required this.medications,
  });

  factory PrescriptionExtraction.fromJson(Map<String, dynamic> json) =>
      _$PrescriptionExtractionFromJson(json);
  Map<String, dynamic> toJson() => _$PrescriptionExtractionToJson(this);
}

@JsonSerializable()
class PrescriptionMedication {
  final String medicationName;
  final String? dosage;
  final String? frequency;
  final int? duration;
  final int? quantity;
  final bool available;
  final String? matchedDrugId;
  final String? matchedDrugName;

  PrescriptionMedication({
    required this.medicationName,
    this.dosage,
    this.frequency,
    this.duration,
    this.quantity,
    required this.available,
    this.matchedDrugId,
    this.matchedDrugName,
  });

  factory PrescriptionMedication.fromJson(Map<String, dynamic> json) =>
      _$PrescriptionMedicationFromJson(json);
  Map<String, dynamic> toJson() => _$PrescriptionMedicationToJson(this);
}
