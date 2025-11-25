import { renderHook, act, waitFor } from '@testing-library/react';
import { usePortalAuth } from './usePortalAuth';
import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

// Mock Firebase config
jest.mock('../firebase', () => ({
  auth: {},
  db: {},
}));

describe('usePortalAuth Hook', () => {
  const mockUser = {
    uid: 'user123',
    email: 'cliente@test.com',
  };

  const mockUserData = {
    rol: 'cliente',
    clienteId: 'cliente123',
    activo: true,
  };

  const mockClienteData = {
    nombre: 'Juan Pérez',
    codigo: 'CLI001',
    email: 'cliente@test.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default onAuthStateChanged to not call callback immediately
    onAuthStateChanged.mockImplementation((auth, callback) => {
      // Return unsubscribe function
      return jest.fn();
    });
  });

  describe('Test Case 1: Successful user login and sets client data', () => {
    test('should successfully login and set client data when valid credentials are provided', async () => {
      // Mock successful authentication
      signInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      // Mock Firestore user document
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockUserData,
      });

      // Mock Firestore cliente document
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'cliente123',
        data: () => mockClienteData,
      });

      const { result } = renderHook(() => usePortalAuth());

      // Perform login
      await act(async () => {
        await result.current.login('cliente@test.com', 'password123');
      });

      // Verify clienteData is set correctly
      expect(result.current.clienteData).toEqual({
        id: 'cliente123',
        ...mockClienteData,
      });
      expect(result.current.userRole).toBe('cliente');
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    test('should set userRole as cliente after successful login', async () => {
      signInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockUserData,
      });

      getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'cliente123',
        data: () => mockClienteData,
      });

      const { result } = renderHook(() => usePortalAuth());

      await act(async () => {
        await result.current.login('cliente@test.com', 'password123');
      });

      expect(result.current.userRole).toBe('cliente');
      expect(result.current.isCliente).toBe(true);
    });

    test('should handle authentication state changes and load client data', async () => {
      let authCallback;
      onAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback;
        return jest.fn();
      });

      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockUserData,
      });

      getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'cliente123',
        data: () => mockClienteData,
      });

      const { result } = renderHook(() => usePortalAuth());

      // Simulate auth state change with logged in user
      await act(async () => {
        await authCallback(mockUser);
      });

      await waitFor(() => {
        expect(result.current.currentUser).toEqual(mockUser);
        expect(result.current.userRole).toBe('cliente');
        expect(result.current.clienteData).toEqual({
          id: 'cliente123',
          ...mockClienteData,
        });
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    test('should reject login if user role is not cliente', async () => {
      const adminUserData = { ...mockUserData, rol: 'admin' };

      signInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => adminUserData,
      });

      signOut.mockResolvedValue();

      const { result } = renderHook(() => usePortalAuth());

      try {
        await act(async () => {
          await result.current.login('admin@test.com', 'password123');
        });
      } catch (error) {
        expect(error.message).toBe('Esta cuenta no tiene acceso al portal de clientes');
      }

      expect(signOut).toHaveBeenCalled();
    });

    test('should reject login if user account is not active', async () => {
      const inactiveUserData = { ...mockUserData, activo: false };

      signInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      // Mock user document
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => inactiveUserData,
      });

      // Mock cliente document (will be called if user passes role check, but won't reach it)
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'cliente123',
        data: () => mockClienteData,
      });

      signOut.mockResolvedValue();

      const { result } = renderHook(() => usePortalAuth());

      try {
        await act(async () => {
          await result.current.login('cliente@test.com', 'password123');
        });
      } catch (error) {
        expect(error.message).toBe('Tu cuenta ha sido desactivada. Contacta con ACMC.');
      }

      expect(signOut).toHaveBeenCalled();
    });

    test('should handle authentication errors gracefully', async () => {
      signInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/wrong-password',
        message: 'Wrong password',
      });

      const { result } = renderHook(() => usePortalAuth());

      let caughtError;
      try {
        await act(async () => {
          await result.current.login('cliente@test.com', 'wrongpassword');
        });
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError.message).toBe('Contraseña incorrecta');
      
      // Wait for state updates
      await waitFor(() => {
        expect(result.current.error).toBe('Contraseña incorrecta');
      });
    });

    test('should handle user-not-found error', async () => {
      signInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/user-not-found',
      });

      const { result } = renderHook(() => usePortalAuth());

      try {
        await act(async () => {
          await result.current.login('noexiste@test.com', 'password123');
        });
      } catch (error) {
        expect(error.message).toBe('No existe una cuenta con ese correo electrónico');
      }
    });
  });
});
