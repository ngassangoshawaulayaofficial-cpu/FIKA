import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

class R2Datasource {
  final SupabaseClient _client;

  R2Datasource(this._client);

  /**
   * Invokes the edge function to obtain a signed URL and puts the binary data to R2
   */
  Future<String> uploadFile(File file, String folderName, String userId) async {
    final fileExtension = file.path.split('.').last;
    final filePath = '$folderName/$userId/${DateTime.now().millisecondsSinceEpoch}.$fileExtension';

    // Invoke Supabase Edge Function to get signed upload URL
    final response = await _client.functions.invoke(
      'r2-presign',
      body: {
        'filePath': filePath,
        'contentType': 'image/jpeg', // Standard type
      },
    );

    if (response.status != 200) {
      throw Exception('Failed to get R2 presigned URL: ${response.data}');
    }

    final data = response.data as Map<String, dynamic>;
    final uploadUrl = data['uploadUrl'] as String;
    final publicUrl = data['publicUrl'] as String;

    // Read file bytes
    final bytes = await file.readAsBytes();

    // Direct HTTP PUT request to upload bytes to Cloudflare R2
    final uploadResponse = await http.put(
      Uri.parse(uploadUrl),
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: bytes,
    );

    if (uploadResponse.statusCode != 200) {
      throw Exception('Failed to upload file bytes to R2: ${uploadResponse.body}');
    }

    return publicUrl;
  }
}
