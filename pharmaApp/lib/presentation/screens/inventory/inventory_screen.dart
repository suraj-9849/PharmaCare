import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pharma_care/core/constants/app_colors.dart';
import 'package:pharma_care/core/constants/app_strings.dart';
import 'package:pharma_care/data/models/drug.dart';
import 'package:pharma_care/data/repositories/inventory_repository.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final TextEditingController _searchController = TextEditingController();
  final InventoryRepository _inventoryRepo = InventoryRepository();

  bool _isLoading = false;
  String _searchQuery = '';
  List<InventoryBatch> _batches = [];
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadInventory();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadInventory() async {
    print('📦 Loading inventory batches...');
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final batches = await _inventoryRepo.getInventoryBatches(search: _searchQuery);

      print('📦 Loaded ${batches.length} batches');

      if (mounted) {
        setState(() {
          _batches = batches;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('❌ Error loading inventory: $e');
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleRefresh() async {
    await _loadInventory();
  }

  void _handleSearch(String query) {
    setState(() {
      _searchQuery = query;
    });
    _loadInventory();
  }

  String _getBatchStatus(InventoryBatch batch) {
    final expiryDate = batch.expiryDate;
    final today = DateTime.now();
    final daysUntilExpiry = expiryDate.difference(today).inDays;

    if (daysUntilExpiry <= 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring';
    if (batch.quantity <= 10) return 'low';
    return 'good';
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'expired':
        return AppColors.error;
      case 'expiring':
        return Colors.orange;
      case 'low':
        return AppColors.stockLow;
      default:
        return AppColors.stockGood;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'expired':
        return 'Expired';
      case 'expiring':
        return 'Expiring';
      case 'low':
        return 'Low Stock';
      default:
        return 'Good';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.inventory),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              // TODO: Show filter bottom sheet
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by batch number or drug name',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _handleSearch('');
                        },
                      )
                    : null,
              ),
              onChanged: _handleSearch,
            ),
          ),

          // Inventory List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _handleRefresh,
                    child: _buildInventoryList(),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildInventoryList() {
    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: AppColors.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Failed to load inventory',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textTertiary,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadInventory,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_batches.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.inventory_2_outlined,
              size: 64,
              color: AppColors.textTertiary,
            ),
            const SizedBox(height: 16),
            Text(
              AppStrings.noData,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              _searchQuery.isEmpty
                  ? 'No inventory batches found'
                  : 'No batches found matching "$_searchQuery"',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textTertiary,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _batches.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final batch = _batches[index];
        return _buildBatchCard(batch);
      },
    );
  }

  Widget _buildBatchCard(InventoryBatch batch) {
    final status = _getBatchStatus(batch);
    final statusColor = _getStatusColor(status);
    final statusLabel = _getStatusLabel(status);
    final dateFormat = DateFormat('dd MMM yyyy');

    return Card(
      child: InkWell(
        onTap: () {
          // TODO: Navigate to batch detail screen
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Drug name and Status badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          batch.drug?.brandName ?? 'Unknown Drug',
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Batch: ${batch.batchNumber}',
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppColors.textSecondary,
                                    fontFamily: 'monospace',
                                  ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      statusLabel,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Details Grid
              Row(
                children: [
                  Expanded(
                    child: _buildDetailItem(
                      'Quantity',
                      '${batch.quantity} units',
                      Icons.inventory_2_outlined,
                    ),
                  ),
                  Expanded(
                    child: _buildDetailItem(
                      'Expiry',
                      dateFormat.format(batch.expiryDate),
                      Icons.event_outlined,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildDetailItem(
                      'Purchase',
                      '₹${batch.purchasePrice.toStringAsFixed(2)}',
                      Icons.shopping_cart_outlined,
                    ),
                  ),
                  Expanded(
                    child: _buildDetailItem(
                      'Selling',
                      '₹${batch.sellPrice.toStringAsFixed(2)}',
                      Icons.sell_outlined,
                    ),
                  ),
                ],
              ),
              if (batch.location != null && batch.location!.isNotEmpty) ...[
                const SizedBox(height: 12),
                _buildDetailItem(
                  'Location',
                  batch.location!,
                  Icons.location_on_outlined,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailItem(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: AppColors.textSecondary,
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textTertiary,
                      fontSize: 11,
                    ),
              ),
              Text(
                value,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w500,
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
