import '../network/api_envelope.dart';

class ApiException implements Exception {
  final ApiErrorDetail? errorDetail;
  final String message;
  final int? statusCode;

  ApiException({
    this.errorDetail,
    required this.message,
    this.statusCode,
  });

  @override
  String toString() {
    if (errorDetail != null) {
      return 'ApiException: ${errorDetail!.message} (${errorDetail!.code})';
    }
    return 'ApiException: $message${statusCode != null ? ' (Status: $statusCode)' : ''}';
  }
}
