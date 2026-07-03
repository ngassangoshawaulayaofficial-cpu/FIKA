import 'package:supabase_flutter/supabase_flutter.dart' as supabase;
import '../../domain/repositories/auth_repository.dart';
import '../datasources/supabase_datasource.dart';

class AuthRepositoryImpl implements AuthRepository {
  final SupabaseDatasource _datasource;

  AuthRepositoryImpl(this._datasource);

  @override
  Future<supabase.User?> signUp({
    required String email,
    required String password,
    required String fullName,
    required String role,
  }) async {
    final response = await _datasource.signUpWithEmail(
      email: email,
      password: password,
      userMetadata: {
        'full_name': fullName,
        'role': role,
      },
    );
    return response.user;
  }

  @override
  Future<supabase.User?> signIn({
    required String email,
    required String password,
  }) async {
    final response = await _datasource.signInWithEmail(
      email: email,
      password: password,
    );
    return response.user;
  }

  @override
  Future<void> signOut() async {
    await _datasource.signOut();
  }

  @override
  Future<void> sendPasswordReset(String email) async {
    // Custom URL schemes can be mapped to trigger mobile app deep-linking
    await _datasource.resetPassword(email, 'io.supabase.fika://reset-callback');
  }

  @override
  Future<void> updatePassword(String newPassword) async {
    await _datasource.updatePassword(newPassword);
  }

  @override
  supabase.User? get currentUser {
    final session = _datasource.currentSession;
    return session?.user;
  }
}
