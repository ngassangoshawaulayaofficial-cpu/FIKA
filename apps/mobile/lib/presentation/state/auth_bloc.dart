import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../domain/repositories/auth_repository.dart';

// --- EVENTS ---
abstract class AuthEvent {}

class SignUpRequested extends AuthEvent {
  final String email;
  final String password;
  final String fullName;
  final String role;

  SignUpRequested({
    required this.email,
    required this.password,
    required this.fullName,
    required this.role,
  });
}

class SignInRequested extends AuthEvent {
  final String email;
  final String password;

  SignInRequested({required this.email, required this.password});
}

class SignOutRequested extends AuthEvent {}

class AuthCheckRequested extends AuthEvent {}

class PasswordResetRequested extends AuthEvent {
  final String email;
  PasswordResetRequested(this.email);
}

class PasswordUpdateRequested extends AuthEvent {
  final String newPassword;
  PasswordUpdateRequested(this.newPassword);
}

// --- STATES ---
abstract class AuthState {}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class Authenticated extends AuthState {
  final User user;
  Authenticated(this.user);
}

class Unauthenticated extends AuthState {}

class AuthFailure extends AuthState {
  final String message;
  AuthFailure(this.message);
}

class PasswordResetSuccess extends AuthState {}

class PasswordUpdateSuccess extends AuthState {}

// --- BLOC ---
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _repository;

  AuthBloc(this._repository) : super(AuthInitial()) {
    on<AuthCheckRequested>((event, emit) {
      final user = _repository.currentUser;
      if (user != null) {
        emit(Authenticated(user));
      } else {
        emit(Unauthenticated());
      }
    });

    on<SignUpRequested>((event, emit) async {
      emit(AuthLoading());
      try {
        final user = await _repository.signUp(
          email: event.email,
          password: event.password,
          fullName: event.fullName,
          role: event.role,
        );
        if (user != null) {
          emit(Authenticated(user));
        } else {
          emit(AuthFailure('Failed to sign up'));
        }
      } catch (e) {
        emit(AuthFailure(e.toString()));
      }
    });

    on<SignInRequested>((event, emit) async {
      emit(AuthLoading());
      try {
        final user = await _repository.signIn(
          email: event.email,
          password: event.password,
        );
        if (user != null) {
          emit(Authenticated(user));
        } else {
          emit(AuthFailure('Failed to sign in'));
        }
      } catch (e) {
        emit(AuthFailure(e.toString()));
      }
    });

    on<SignOutRequested>((event, emit) async {
      emit(AuthLoading());
      try {
        await _repository.signOut();
        emit(Unauthenticated());
      } catch (e) {
        emit(AuthFailure(e.toString()));
      }
    });

    on<PasswordResetRequested>((event, emit) async {
      emit(AuthLoading());
      try {
        await _repository.sendPasswordReset(event.email);
        emit(PasswordResetSuccess());
      } catch (e) {
        emit(AuthFailure(e.toString()));
      }
    });

    on<PasswordUpdateRequested>((event, emit) async {
      emit(AuthLoading());
      try {
        await _repository.updatePassword(event.newPassword);
        emit(PasswordUpdateSuccess());
      } catch (e) {
        emit(AuthFailure(e.toString()));
      }
    });
  }
}
