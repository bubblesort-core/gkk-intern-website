import 'dart:typed_data';
import '../core/supabase_client.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Service that mirrors the web form's Supabase submission logic.
/// Maps form fields → applications table columns (same as gkk-bento-form/lib/supabase.ts).
class ApplicationService {
  /// Submit application data and return the new record ID.
  static Future<String> submitApplication({
    required String fullName,
    required String email,
    required String phone,
    required String whatsappNumber,
    required String age,
    required String sex,
    required String college,
    String? linkedinUrl,
    String? githubUrl,
    String? portfolioUrl,
    String? interviewDate,
    String? interviewTime,
    List<String>? interests,
    String batchNumber = 'Phase 1',
  }) async {
    // Build the record mirroring the web form's field mapping
    final record = <String, dynamic>{
      'full_name': fullName,
      'email': email,
      'phone': phone,
      'whatsapp_number': whatsappNumber,
      'age': age,
      'sex': sex,
      'college': college,
      'status': 'pending',
      'batch_number': batchNumber,
    };

    // Only include optional fields if they have values
    if (linkedinUrl != null && linkedinUrl.isNotEmpty) {
      record['linkedin_url'] = linkedinUrl;
    }
    if (githubUrl != null && githubUrl.isNotEmpty) {
      record['github_url'] = githubUrl;
    }
    if (portfolioUrl != null && portfolioUrl.isNotEmpty) {
      record['portfolio_url'] = portfolioUrl;
    }
    if (interviewDate != null && interviewDate.isNotEmpty) {
      record['preferred_interview_date'] = interviewDate;
    }
    if (interviewTime != null && interviewTime.isNotEmpty) {
      record['preferred_interview_time'] = interviewTime;
    }
    if (interests != null && interests.isNotEmpty) {
      record['skills'] = interests;
    }

    final response = await SupabaseClientConfig.client
        .from('applications')
        .insert(record)
        .select('id')
        .single();

    final id = response['id'] as String;

    // Trigger confirmation email (silent fail like web)
    try {
      await SupabaseClientConfig.client.functions.invoke(
        'gkk-application-email',
        body: {
          'applicationData': {
            ...record,
            'interview_date': interviewDate,
            'interview_time': interviewTime,
          },
        },
      );
    } catch (_) {
      // Silent — same as web
    }

    return id;
  }

  /// Upload a CV file to Supabase Storage and update the application record.
  static Future<void> uploadCv({
    required Uint8List fileBytes,
    required String fileName,
    required String applicationId,
  }) async {
    final ext = fileName.split('.').last;
    final storagePath = 'cv/$applicationId.$ext';

    await SupabaseClientConfig.client.storage
        .from('intern-documents')
        .uploadBinary(storagePath, fileBytes,
            fileOptions: const FileOptions(upsert: true));

    // Get public URL and update the application record
    final publicUrl = SupabaseClientConfig.client.storage
        .from('intern-documents')
        .getPublicUrl(storagePath);

    await SupabaseClientConfig.client
        .from('applications')
        .update({'resume_url': publicUrl}).eq('id', applicationId);
  }
}
