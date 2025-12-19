class ApiConstants {
  // AWS Backend URL - Works on both emulator and real device!
  static const String baseUrl = 'http://DrugDesk-alb-809690050.ap-southeast-2.elb.amazonaws.com/api';

  // Auth endpoints
  static const String login = '/auth/login';
  static const String me = '/auth/me';
  static const String validate = '/auth/validate';

  // Drug endpoints
  static const String drugs = '/drugs';
  static String drugById(String id) => '/drugs/$id';

  // Inventory endpoints
  static const String inventory = '/inventory';
  static const String inventoryBatches = '/inventory/batches';

  // Alert endpoints
  static const String alerts = '/alerts';
  static String markAlertRead(String id) => '/alerts/$id/mark-read';

  // Dashboard endpoints
  static const String dashboard = '/dashboard';
  static const String dashboardChart = '/dashboard/chart';
  static const String topSelling = '/dashboard/top-selling';

  // Smart Shelf endpoints
  static const String smartShelf = '/smart-shelf';
  static String shelfByCode(String code) => '/smart-shelf/$code';

  // Reorder endpoints
  static const String reorders = '/reorders';

  // Supplier endpoints
  static const String suppliers = '/suppliers';

  // Invoice endpoints
  static const String invoices = '/invoices';
  static const String invoiceExtract = '/invoices/extract';
  static const String invoiceProcess = '/invoices/process';

  // Prescription endpoints
  static const String prescriptions = '/prescriptions';
  static const String prescriptionScan = '/prescriptions/scan';
  static const String prescriptionCheckAvailability = '/prescriptions/check-availability';
  static const String prescriptionPurchase = '/prescriptions/purchase';

  // Notification endpoints
  static const String notificationRegisterDevice = '/notifications/register-device';
  static const String notificationUnregisterDevice = '/notifications/unregister-device';
  static const String notificationAlerts = '/notifications/alerts';
  static const String notificationMarkAllRead = '/notifications/alerts/mark-all-read';
  static String notificationMarkRead(String id) => '/notifications/alerts/$id/mark-read';
}
