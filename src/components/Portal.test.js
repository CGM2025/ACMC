import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Portal from './Portal';
import { usePortalAuth } from '../hooks/usePortalAuth';

// Mock the child components
jest.mock('./PortalLogin', () => {
  return function MockPortalLogin({ onLogin, error }) {
    return (
      <div data-testid="portal-login">
        <h1>Portal Login</h1>
        {error && <div data-testid="login-error">{error}</div>}
        <button onClick={() => onLogin('test@test.com', 'password')}>
          Login
        </button>
      </div>
    );
  };
});

jest.mock('./PortalCliente', () => {
  return function MockPortalCliente({ clienteData, onLogout }) {
    return (
      <div data-testid="portal-cliente">
        <h1>Portal Cliente Dashboard</h1>
        <p data-testid="cliente-nombre">{clienteData.nombre}</p>
        <button onClick={onLogout} data-testid="logout-button">
          Cerrar Sesión
        </button>
      </div>
    );
  };
});

// Mock usePortalAuth hook
jest.mock('../hooks/usePortalAuth');

describe('Portal Component', () => {
  const mockLogin = jest.fn();
  const mockLogout = jest.fn();

  const mockClienteData = {
    id: 'cliente123',
    nombre: 'Juan Pérez',
    codigo: 'CLI001',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Test Case 2: Display login screen when user is not authenticated or not a client', () => {
    test('should display login screen when user is not authenticated', () => {
      usePortalAuth.mockReturnValue({
        currentUser: null,
        clienteData: null,
        loading: false,
        error: null,
        login: mockLogin,
        logout: mockLogout,
        isCliente: false,
      });

      render(<Portal recibos={[]} pagos={[]} citas={[]} />);

      expect(screen.getByTestId('portal-login')).toBeInTheDocument();
      expect(screen.getByText('Portal Login')).toBeInTheDocument();
      expect(screen.queryByTestId('portal-cliente')).not.toBeInTheDocument();
    });

    test('should display login screen when user is authenticated but not a cliente', () => {
      usePortalAuth.mockReturnValue({
        currentUser: { uid: 'user123', email: 'admin@test.com' },
        clienteData: null,
        loading: false,
        error: null,
        login: mockLogin,
        logout: mockLogout,
        isCliente: false, // User role is not 'cliente'
      });

      render(<Portal recibos={[]} pagos={[]} citas={[]} />);

      expect(screen.getByTestId('portal-login')).toBeInTheDocument();
      expect(screen.queryByTestId('portal-cliente')).not.toBeInTheDocument();
    });

    test('should pass error prop to PortalLogin when there is an authentication error', () => {
      const errorMessage = 'Contraseña incorrecta';

      usePortalAuth.mockReturnValue({
        currentUser: null,
        clienteData: null,
        loading: false,
        error: errorMessage,
        login: mockLogin,
        logout: mockLogout,
        isCliente: false,
      });

      render(<Portal recibos={[]} pagos={[]} citas={[]} />);

      expect(screen.getByTestId('login-error')).toHaveTextContent(errorMessage);
    });

    test('should display loading indicator while checking authentication', () => {
      usePortalAuth.mockReturnValue({
        currentUser: null,
        clienteData: null,
        loading: true,
        error: null,
        login: mockLogin,
        logout: mockLogout,
        isCliente: false,
      });

      render(<Portal recibos={[]} pagos={[]} citas={[]} />);

      expect(screen.getByText('Cargando...')).toBeInTheDocument();
      expect(screen.queryByTestId('portal-login')).not.toBeInTheDocument();
      expect(screen.queryByTestId('portal-cliente')).not.toBeInTheDocument();
    });
  });

  describe('Test Case 5: Logout functionality clears session and redirects', () => {
    test('should call logout function when logout button is clicked', async () => {
      const user = userEvent.setup();

      usePortalAuth.mockReturnValue({
        currentUser: { uid: 'user123', email: 'cliente@test.com' },
        clienteData: mockClienteData,
        loading: false,
        error: null,
        login: mockLogin,
        logout: mockLogout,
        isCliente: true,
      });

      render(<Portal recibos={[]} pagos={[]} citas={[]} />);

      // Verify cliente dashboard is displayed
      expect(screen.getByTestId('portal-cliente')).toBeInTheDocument();

      // Click logout button
      const logoutButton = screen.getByTestId('logout-button');
      await user.click(logoutButton);

      // Verify logout was called
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    test('should successfully clear user session after logout', async () => {
      const user = userEvent.setup();

      // Initial state: authenticated
      const { rerender } = render(
        <Portal recibos={[]} pagos={[]} citas={[]} />
      );

      usePortalAuth.mockReturnValue({
        currentUser: { uid: 'user123', email: 'cliente@test.com' },
        clienteData: mockClienteData,
        loading: false,
        error: null,
        login: mockLogin,
        logout: mockLogout,
        isCliente: true,
      });

      rerender(<Portal recibos={[]} pagos={[]} citas={[]} />);

      expect(screen.getByTestId('portal-cliente')).toBeInTheDocument();

      // Simulate logout by changing auth state
      usePortalAuth.mockReturnValue({
        currentUser: null,
        clienteData: null,
        loading: false,
        error: null,
        login: mockLogin,
        logout: mockLogout,
        isCliente: false,
      });

      rerender(<Portal recibos={[]} pagos={[]} citas={[]} />);

      // Verify redirected to login screen
      expect(screen.getByTestId('portal-login')).toBeInTheDocument();
      expect(screen.queryByTestId('portal-cliente')).not.toBeInTheDocument();
    });

    test('should show error message and logout button when clienteData is missing', async () => {
      const user = userEvent.setup();

      usePortalAuth.mockReturnValue({
        currentUser: { uid: 'user123', email: 'cliente@test.com' },
        clienteData: null, // No client data
        loading: false,
        error: null,
        login: mockLogin,
        logout: mockLogout,
        isCliente: true, // Is cliente but no data
      });

      render(<Portal recibos={[]} pagos={[]} citas={[]} />);

      // Verify error message is displayed
      expect(
        screen.getByText('Error: No se pudieron cargar los datos del cliente')
      ).toBeInTheDocument();

      // Verify "Volver al Login" button is present
      const backToLoginButton = screen.getByText('Volver al Login');
      expect(backToLoginButton).toBeInTheDocument();

      // Click the button
      await user.click(backToLoginButton);

      // Verify logout was called
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Portal Component - Display Cliente Dashboard', () => {
    test('should display cliente dashboard when authenticated with valid cliente data', () => {
      usePortalAuth.mockReturnValue({
        currentUser: { uid: 'user123', email: 'cliente@test.com' },
        clienteData: mockClienteData,
        loading: false,
        error: null,
        login: mockLogin,
        logout: mockLogout,
        isCliente: true,
      });

      render(<Portal recibos={[]} pagos={[]} citas={[]} />);

      expect(screen.getByTestId('portal-cliente')).toBeInTheDocument();
      expect(screen.getByText('Portal Cliente Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('cliente-nombre')).toHaveTextContent('Juan Pérez');
      expect(screen.queryByTestId('portal-login')).not.toBeInTheDocument();
    });

    test('should pass correct props to PortalCliente component', () => {
      const mockRecibos = [{ id: '1', clienteId: 'cliente123' }];
      const mockPagos = [{ id: '1', clienteId: 'cliente123' }];
      const mockCitas = [{ id: '1', clienteId: 'cliente123' }];

      usePortalAuth.mockReturnValue({
        currentUser: { uid: 'user123', email: 'cliente@test.com' },
        clienteData: mockClienteData,
        loading: false,
        error: null,
        login: mockLogin,
        logout: mockLogout,
        isCliente: true,
      });

      render(
        <Portal 
          recibos={mockRecibos} 
          pagos={mockPagos} 
          citas={mockCitas} 
        />
      );

      expect(screen.getByTestId('portal-cliente')).toBeInTheDocument();
    });
  });
});
