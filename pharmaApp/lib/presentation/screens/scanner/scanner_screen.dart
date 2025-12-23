import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:intl/intl.dart';
import 'package:pharma_care/core/constants/app_colors.dart';
import 'package:pharma_care/data/models/invoice.dart';
import 'package:pharma_care/data/models/prescription.dart';
import 'package:pharma_care/data/repositories/invoice_repository.dart';
import 'package:pharma_care/data/repositories/prescription_repository.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source, String scanType) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        imageQuality: 100, // Use maximum quality for OCR
        maxWidth: 2048, // Limit max width to keep file size reasonable
        maxHeight: 2048, // Limit max height to keep file size reasonable
      );

      if (image != null) {
        if (mounted) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ScanResultScreen(
                imagePath: image.path,
                scanType: scanType,
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking image: $e')),
        );
      }
    }
  }

  void _showImageSourceDialog(String scanType) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Camera'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera, scanType);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Gallery'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery, scanType);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scanner'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Invoice Scanner'),
            Tab(text: 'Prescription Scanner'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildScannerTab(
            title: 'Invoice Scanner',
            description: 'Scan supplier invoices to quickly add inventory',
            icon: Icons.receipt_long,
            iconColor: Colors.blue,
            scanType: 'invoice',
          ),
          _buildScannerTab(
            title: 'Prescription Scanner',
            description: 'Scan prescriptions to check medication availability',
            icon: Icons.medication,
            iconColor: Colors.green,
            scanType: 'prescription',
          ),
        ],
      ),
    );
  }

  Widget _buildScannerTab({
    required String title,
    required String description,
    required IconData icon,
    required Color iconColor,
    required String scanType,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 80,
                color: iconColor,
              ),
            ),
            const SizedBox(height: 32),
            Text(
              title,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              description,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textSecondary,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 48),
            ElevatedButton.icon(
              onPressed: () => _showImageSourceDialog(scanType),
              icon: const Icon(Icons.camera_alt),
              label: const Text('Scan Document'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 16,
                ),
                textStyle: const TextStyle(fontSize: 16),
              ),
            ),
            const SizedBox(height: 16),
            TextButton.icon(
              onPressed: () => _pickImage(ImageSource.gallery, scanType),
              icon: const Icon(Icons.photo_library),
              label: const Text('Choose from Gallery'),
            ),
          ],
        ),
      ),
    );
  }
}

class ScanResultScreen extends StatefulWidget {
  final String imagePath;
  final String scanType;

  const ScanResultScreen({
    super.key,
    required this.imagePath,
    required this.scanType,
  });

  @override
  State<ScanResultScreen> createState() => _ScanResultScreenState();
}

class _ScanResultScreenState extends State<ScanResultScreen> {
  bool _isProcessing = false;
  final InvoiceRepository _invoiceRepo = InvoiceRepository();
  final PrescriptionRepository _prescriptionRepo = PrescriptionRepository();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.scanType == 'invoice'
              ? 'Invoice Scan Result'
              : 'Prescription Scan Result',
        ),
      ),
      body: Column(
        children: [
          // Image Preview
          Expanded(
            flex: 2,
            child: Container(
              width: double.infinity,
              color: Colors.black,
              child: Image.file(
                File(widget.imagePath),
                fit: BoxFit.contain,
              ),
            ),
          ),

          // Action Buttons
          Expanded(
            flex: 1,
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_isProcessing)
                    Column(
                      children: [
                        const CircularProgressIndicator(),
                        const SizedBox(height: 16),
                        Text(
                          widget.scanType == 'invoice'
                              ? 'Extracting invoice data...'
                              : 'Extracting medications...',
                        ),
                      ],
                    )
                  else ...[
                    ElevatedButton.icon(
                      onPressed: _processImage,
                      icon: const Icon(Icons.check_circle),
                      label: Text(
                        widget.scanType == 'invoice'
                            ? 'Extract Invoice Data'
                            : 'Extract Medications',
                      ),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.all(16),
                      ),
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('Retake'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.all(16),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _processImage() async {
    setState(() {
      _isProcessing = true;
    });

    try {
      if (widget.scanType == 'invoice') {
        final invoiceData =
            await _invoiceRepo.extractInvoice(widget.imagePath);
        if (mounted) {
          setState(() {
            _isProcessing = false;
          });
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => InvoiceResultScreen(
                invoiceData: invoiceData,
                imagePath: widget.imagePath,
              ),
            ),
          );
        }
      } else {
        final prescriptionData =
            await _prescriptionRepo.extractPrescription(widget.imagePath);
        if (mounted) {
          setState(() {
            _isProcessing = false;
          });
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => PrescriptionResultScreen(
                prescriptionData: prescriptionData,
                imagePath: widget.imagePath,
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }
}

// Invoice Result Screen
class InvoiceResultScreen extends StatelessWidget {
  final InvoiceExtraction invoiceData;
  final String imagePath;

  const InvoiceResultScreen({
    super.key,
    required this.invoiceData,
    required this.imagePath,
  });

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd MMM yyyy');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Invoice Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.save),
            onPressed: () {
              // TODO: Implement save to inventory
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Save functionality coming soon!'),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Invoice Info Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Invoice Information',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 16),
                    _buildInfoRow(
                      'Invoice Number',
                      invoiceData.invoiceNumber,
                      Icons.receipt,
                    ),
                    const SizedBox(height: 12),
                    _buildInfoRow(
                      'Supplier',
                      invoiceData.supplierName,
                      Icons.business,
                    ),
                    const SizedBox(height: 12),
                    _buildInfoRow(
                      'Date',
                      dateFormat.format(invoiceData.invoiceDate),
                      Icons.calendar_today,
                    ),
                    const SizedBox(height: 12),
                    _buildInfoRow(
                      'Total Amount',
                      '₹${invoiceData.totalAmount.toStringAsFixed(2)}',
                      Icons.attach_money,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Items List
            Text(
              'Items (${invoiceData.items.length})',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),

            ...invoiceData.items.map((item) => Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.drugName,
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _buildItemDetail(
                                'Batch',
                                item.batchNumber ?? 'N/A',
                              ),
                            ),
                            Expanded(
                              child: _buildItemDetail(
                                'Quantity',
                                '${item.quantity} units',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: _buildItemDetail(
                                'Unit Price',
                                '₹${item.unitPrice.toStringAsFixed(2)}',
                              ),
                            ),
                            Expanded(
                              child: _buildItemDetail(
                                'Total',
                                '₹${item.totalPrice.toStringAsFixed(2)}',
                              ),
                            ),
                          ],
                        ),
                        if (item.expiryDate != null) ...[
                          const SizedBox(height: 8),
                          _buildItemDetail(
                            'Expiry Date',
                            dateFormat.format(item.expiryDate!),
                          ),
                        ],
                      ],
                    ),
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.textSecondary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildItemDetail(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: AppColors.textTertiary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

// Prescription Result Screen
class PrescriptionResultScreen extends StatelessWidget {
  final PrescriptionExtraction prescriptionData;
  final String imagePath;

  const PrescriptionResultScreen({
    super.key,
    required this.prescriptionData,
    required this.imagePath,
  });

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd MMM yyyy');
    final availableMeds =
        prescriptionData.medications.where((m) => m.available).length;
    final totalMeds = prescriptionData.medications.length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Prescription Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.save),
            onPressed: () {
              // TODO: Implement save prescription
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Save functionality coming soon!'),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Prescription Info Card
            if (prescriptionData.patientName != null ||
                prescriptionData.doctorName != null ||
                prescriptionData.prescriptionDate != null)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Prescription Information',
                        style:
                            Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                      ),
                      const SizedBox(height: 16),
                      if (prescriptionData.patientName != null) ...[
                        _buildInfoRow(
                          'Patient',
                          prescriptionData.patientName!,
                          Icons.person,
                        ),
                        const SizedBox(height: 12),
                      ],
                      if (prescriptionData.doctorName != null) ...[
                        _buildInfoRow(
                          'Doctor',
                          prescriptionData.doctorName!,
                          Icons.medical_services,
                        ),
                        const SizedBox(height: 12),
                      ],
                      if (prescriptionData.prescriptionDate != null)
                        _buildInfoRow(
                          'Date',
                          dateFormat.format(prescriptionData.prescriptionDate!),
                          Icons.calendar_today,
                        ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 16),

            // Availability Summary
            Card(
              color: availableMeds == totalMeds
                  ? Colors.green.withOpacity(0.1)
                  : Colors.orange.withOpacity(0.1),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(
                      availableMeds == totalMeds
                          ? Icons.check_circle
                          : Icons.warning,
                      color: availableMeds == totalMeds
                          ? Colors.green
                          : Colors.orange,
                      size: 32,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$availableMeds of $totalMeds medications available',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (availableMeds < totalMeds)
                            const Text(
                              'Some medications are not in stock',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Medications List
            Text(
              'Medications (${prescriptionData.medications.length})',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),

            ...prescriptionData.medications.map((medication) => Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                medication.medicationName,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: medication.available
                                    ? Colors.green.withOpacity(0.1)
                                    : Colors.red.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                medication.available
                                    ? 'Available'
                                    : 'Not Available',
                                style: TextStyle(
                                  color: medication.available
                                      ? Colors.green
                                      : Colors.red,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (medication.matchedDrugName != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            'Matched: ${medication.matchedDrugName}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 16,
                          runSpacing: 8,
                          children: [
                            if (medication.dosage != null)
                              _buildMedicationDetail(
                                'Dosage',
                                medication.dosage!,
                                Icons.medication,
                              ),
                            if (medication.frequency != null)
                              _buildMedicationDetail(
                                'Frequency',
                                medication.frequency!,
                                Icons.schedule,
                              ),
                            if (medication.duration != null)
                              _buildMedicationDetail(
                                'Duration',
                                '${medication.duration} days',
                                Icons.event,
                              ),
                            if (medication.quantity != null)
                              _buildMedicationDetail(
                                'Quantity',
                                '${medication.quantity} units',
                                Icons.inventory_2,
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.textSecondary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMedicationDetail(String label, String value, IconData icon) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.textTertiary,
              ),
            ),
            Text(
              value,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
