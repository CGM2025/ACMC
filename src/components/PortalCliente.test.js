import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortalCliente from './PortalCliente';

// Mock ModalRecibo component
jest.mock('./ModalRecibo', () => {
  return function MockModalRecibo({ recibo, nombreCliente, onCerrar }) {
    return (
      <div data-testid="modal-recibo">
        <h2>Modal Recibo</h2>
        <p>Recibo ID: {recibo.id}</p>
        <p>Cliente: {nombreCliente}</p>
        <button onClick={onCerrar}>Cerrar</button>
      </div>
    );
  };
});

describe('PortalCliente Component', () => {
  const mockClienteData = {
    id: 'cliente123',
    nombre: 'Juan Pérez',
    codigo: 'CLI001',
    email: 'juan@test.com',
  };

  const mockOnLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Test Case 3: Correctly filters and displays receipts relevant to the logged-in client', () => {
    test('should filter and display only receipts for the logged-in client by clienteId', () => {
      const mockRecibos = [
        {
          id: 'recibo1',
          clienteId: 'cliente123',
          clienteNombre: 'Juan Pérez',
          mes: 'Enero',
          año: 2024,
          reciboId: 'REC-001',
          totalGeneral: 5000,
          fechaGeneracion: '2024-01-15',
        },
        {
          id: 'recibo2',
          clienteId: 'cliente456', // Different client
          clienteNombre: 'María López',
          mes: 'Enero',
          año: 2024,
          reciboId: 'REC-002',
          totalGeneral: 3000,
          fechaGeneracion: '2024-01-15',
        },
        {
          id: 'recibo3',
          clienteId: 'cliente123',
          clienteNombre: 'Juan Pérez',
          mes: 'Febrero',
          año: 2024,
          reciboId: 'REC-003',
          totalGeneral: 4500,
          fechaGeneracion: '2024-02-15',
        },
      ];

      render(
        <PortalCliente
          clienteData={mockClienteData}
          recibos={mockRecibos}
          pagos={[]}
          citas={[]}
          onLogout={mockOnLogout}
        />
      );

      // Verify that only 2 receipts are displayed (for cliente123)
      const reciboRows = screen.getAllByText(/REC-00\d/);
      expect(reciboRows).toHaveLength(2);

      // Verify REC-001 and REC-003 are displayed
      expect(screen.getByText('REC-001')).toBeInTheDocument();
      expect(screen.getByText('REC-003')).toBeInTheDocument();

      // Verify REC-002 (different client) is not displayed
      expect(screen.queryByText('REC-002')).not.toBeInTheDocument();
    });

    test('should filter receipts by clienteCodigo when clienteId does not match', () => {
      const mockRecibos = [
        {
          id: 'recibo1',
          clienteCodigo: 'CLI001',
          clienteNombre: 'Juan Pérez',
          mes: 'Enero',
          año: 2024,
          reciboId: 'REC-001',
          totalGeneral: 5000,
          fechaGeneracion: '2024-01-15',
        },
        {
          id: 'recibo2',
          clienteCodigo: 'CLI002',
          clienteNombre: 'María López',
          mes: 'Enero',
          año: 2024,
          reciboId: 'REC-002',
          totalGeneral: 3000,
          fechaGeneracion: '2024-01-15',
        },
      ];

      render(
        <PortalCliente
          clienteData={mockClienteData}
          recibos={mockRecibos}
          pagos={[]}
          citas={[]}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('REC-001')).toBeInTheDocument();
      expect(screen.queryByText('REC-002')).not.toBeInTheDocument();
    });

    test('should filter receipts by clienteNombre when neither clienteId nor clienteCodigo match', () => {
      const mockRecibos = [
        {
          id: 'recibo1',
          clienteNombre: 'Juan Pérez',
          mes: 'Enero',
          año: 2024,
          reciboId: 'REC-001',
          totalGeneral: 5000,
          fechaGeneracion: '2024-01-15',
        },
        {
          id: 'recibo2',
          clienteNombre: 'María López',
          mes: 'Enero',
          año: 2024,
          reciboId: 'REC-002',
          totalGeneral: 3000,
          fechaGeneracion: '2024-01-15',
        },
      ];

      render(
        <PortalCliente
          clienteData={mockClienteData}
          recibos={mockRecibos}
          pagos={[]}
          citas={[]}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('REC-001')).toBeInTheDocument();
      expect(screen.queryByText('REC-002')).not.toBeInTheDocument();
    });

    test('should display receipts sorted by date (most recent first)', () => {
      const mockRecibos = [
        {
          id: 'recibo1',
          clienteId: 'cliente123',
          mes: 'Enero',
          año: 2024,
          reciboId: 'REC-001',
          totalGeneral: 5000,
          fechaGeneracion: '2024-01-15',
        },
        {
          id: 'recibo2',
          clienteId: 'cliente123',
          mes: 'Marzo',
          año: 2024,
          reciboId: 'REC-003',
          totalGeneral: 4500,
          fechaGeneracion: '2024-03-15',
        },
        {
          id: 'recibo3',
          clienteId: 'cliente123',
          mes: 'Febrero',
          año: 2024,
          reciboId: 'REC-002',
          totalGeneral: 3500,
          fechaGeneracion: '2024-02-15',
        },
      ];

      render(
        <PortalCliente
          clienteData={mockClienteData}
          recibos={mockRecibos}
          pagos={[]}
          citas={[]}
          onLogout={mockOnLogout}
        />
      );

      const reciboIds = screen.getAllByText(/REC-00\d/);
      
      // Verify the order is most recent first (REC-003, REC-002, REC-001)
      expect(reciboIds[0]).toHaveTextContent('REC-003');
      expect(reciboIds[1]).toHaveTextContent('REC-002');
      expect(reciboIds[2]).toHaveTextContent('REC-001');
    });

    test('should display message when no receipts are available', () => {
      render(
        <PortalCliente
          clienteData={mockClienteData}
          recibos={[]}
          pagos={[]}
          citas={[]}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('No tienes recibos registrados')).toBeInTheDocument();
    });
  });

  describe('Test Case 4: Accurately calculates and displays financial summary', () => {
    test('should correctly calculate totalFacturado from client receipts', () => {
      const mockRecibos = [
        {
          id: 'recibo1',
          clienteId: 'cliente123',
          mes: 'Enero',
          año: 2024,
          reciboId: 'REC-001',
          totalGeneral: 5000,
          fechaGeneracion: '2024-01-15',
        },
        {
          id: 'recibo2',
          clienteId: 'cliente123',
          mes: 'Febrero',
          año: 2024,
          reciboId: 'REC-002',
          totalGeneral: 3500,
          fechaGeneracion: '2024-02-15',
        },
        {
          id: 'recibo3',
          clienteId: 'cliente123',
          mes: 'Marzo',
          año: 2024,
          reciboId: 'REC-003',
          totalGeneral: 4500,
          fechaGeneracion: '2024-03-15',
        },
      ];

      render(
        <PortalCliente
          clienteData={mockClienteData}
          recibos={mockRecibos}
          pagos={[]}
          citas={[]}
          onLogout={mockOnLogout}
        />
      );

      // Total facturado should be 5000 + 3500 + 4500 = 13,000
      expect(screen.getByText('$13,000')).toBeInTheDocument();
    });

    test('should correctly calculate totalPagado from client payments', () => {
      const mockPagos = [
        {
          id: 'pago1',
          clienteId: 'cliente123',
          monto: 2000,
          fecha: '2024-01-20',
          concepto: 'Pago recibo enero',
        },
        {
          id: 'pago2',
          clienteId: 'cliente123',
          monto: 1500,
          fecha: '2024-02-20',
          concepto: 'Pago recibo febrero',
        },
        {
          id: 'pago3',
          clienteId: 'cliente123',
          monto: 2500,
          fecha: '2024-03-20',
          concepto: 'Pago recibo marzo',
        },
      ];

      render(
        <PortalCliente
          clienteData={mockClienteData}
          recibos={[]}
          pagos={mockPagos}
          citas={[]}
          onLogout={mockOnLogout}
        />
      );

      // Total pagado should be 2000 + 1500 + 2500 = 6,000
      expect(screen.getByText('$6,000')).toBeInTheDocument();
    });

    test('should correctly calculate saldoPendiente (totalFacturado - totalPagado)', () => {
      const mockRecibos = [
        {
          id: 'recibo1',
          clienteId: 'cliente123',
          mes: 'Enero',
          año: 2024,
          reciboId: 'REC-001',
          totalGeneral: 5000,
          fechaGeneracion: '2024-01-15',
        },
        {
          id: 'recibo2',
          clienteId: 'cliente123',
          mes: 'Febrero',
          año: 2024,
          reciboId: 'REC-002',
          totalGeneral: 3000,
          fechaGeneracion: '2024-02-15',
        },
      ];

      const mockPagos = [
        {
          id: 'pago1',
          clienteId: 'cliente123',
          monto: 2000,
          fecha: '2024-01-20',
          concepto: 'Pago parcial',
        },
        {
          id: 'pago2',
          clienteId: 'cliente123',
          monto: 1500,
          fecha: '2024-02-20',
          concepto: 'Pago parcial',
        },
      ];

      render(
        <PortalCliente
          clienteData={mockClienteData}
          recibos={mockRecibos}
          pagos={mockPagos}
          citas={[]}
          onLogout={mockOnLogout}
        />
      );

      // Total facturado: 5000 + 3000 = 8,000
      // Total pagado: 2000 + 1500 = 3,500
      // Saldo pendiente: 8000 - 3500 = 4,500
      const saldoPendienteElements = screen.getAllByText('$4,500');
      expect(saldoPendienteElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Por pagar')).toBeInTheDocument();
    });

    test('should display "Al corriente" when saldoPendiente is zero or negative', () => {
      const mockRecibos = [
        {
          id: 'recibo1',
          clienteId: 'cliente123',
          mes: 'Enero',
          año: 2024,
          reciboId: 'REC-001',
          totalGeneral: 5000,
          fechaGeneracion: '2024-01-15',
        },
      ];

      const mockPagos = [
        {
          id: 'pago1',
          clienteId: 'cliente123',
          monto: 5000,
          fecha: '2024-01-20',
          concepto: 'Pago completo',
        },
      ];

      render(
        <PortalCliente
          clienteData={mockClienteData}
          recibos={mockRecibos}
          pagos={mockPagos}
          citas={[]}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Al corriente')).toBeInTheDocument();
    });

    test('should correctly calculate porcentajePagado', () => {
      const mockRecibos = [
        {
          id: 'recibo1',
          clienteId: 'cliente123',
          mes: 'Enero',
          año: 2024,
          reciboId: 'REC-001',
          totalGeneral: 10000,
          fechaGeneracion: '2024-01-15',
        },
      ];

      const mockPagos = [
        {
          id: 'pago1',
          clienteId: 'cliente123',
          monto: 7500,
          fecha: '2024-01-20',
          concepto: 'Pago parcial',
        },
      ];

      render(
        <PortalCliente
          clienteData={mockClienteData}
          recibos={mockRecibos}
          pagos={mockPagos}
          citas={[]}
          onLogout={mockOnLogout}
        />
      );

      // Porcentaje pagado: (7500 / 10000) * 100 = 75.0%
      expect(screen.getByText('75.0%')).toBeInTheDocument();
    });

    test('should display complete financial summary with all values', () => {
      const mockRecibos = [
        {
          id: 'recibo1',
          clienteId: 'cliente123',
          mes: 'Enero',
          año: 2024,
          reciboId: 'REC-001',
          totalGeneral: 8000,
          fechaGeneracion: '2024-01-15',
        },
      ];

      const mockPagos = [
        {
          id: 'pago1',
          clienteId: 'cliente123',
          monto: 3000,
          fecha: '2024-01-20',
          concepto: 'Pago parcial',
        },
      ];

      render(
        <PortalCliente
          clienteData={mockClienteData}
          recibos={mockRecibos}
          pagos={mockPagos}
          citas={[]}
          onLogout={mockOnLogout}
        />
      );

      // Verify all three financial cards are present
      expect(screen.getByText('Total Facturado')).toBeInTheDocument();
      expect(screen.getByText('Total Pagado')).toBeInTheDocument();
      expect(screen.getByText('Saldo Pendiente')).toBeInTheDocument();

      // Verify the values
      expect(screen.getByText('$8,000')).toBeInTheDocument();
      expect(screen.getByText('$3,000')).toBeInTheDocument();
      expect(screen.getByText('$5,000')).toBeInTheDocument();
      
      // Verify receipt and payment counts
      expect(screen.getByText('1 recibo(s)')).toBeInTheDocument();
      expect(screen.getByText('1 pago(s)')).toBeInTheDocument();
    });

    test('should filter pagos by cliente name when clienteId does not match', () => {
      const mockPagos = [
        {
          id: 'pago1',
          cliente: 'Juan Pérez',
          monto: 2000,
          fecha: '2024-01-20',
          concepto: 'Pago recibo',
        },
        {
          id: 'pago2',
          cliente: 'María López',
          monto: 1500,
          fecha: '2024-02-20',
          concepto: 'Pago recibo',
        },
      ];

      render(
        <PortalCliente
          clienteData={mockClienteData}
          recibos={[]}
          pagos={mockPagos}
          citas={[]}
          onLogout={mockOnLogout}
        />
      );

      // Should only show 1 payment (Juan Pérez), not María López
      expect(screen.getByText('$2,000')).toBeInTheDocument();
      expect(screen.getByText('1 pago(s)')).toBeInTheDocument();
    });
  });

  describe('PortalCliente Component - Additional functionality', () => {
    test('should display receipt status badges correctly', () => {
      const mockRecibos = [
        {
          id: 'recibo1',
          clienteId: 'cliente123',
          mes: 'Enero',
          año: 2024,
          reciboId: 'REC-001',
          totalGeneral: 5000,
          fechaGeneracion: '2024-01-15',
        },
      ];

      const mockPagos = [
        {
          id: 'pago1',
          reciboId: 'recibo1',
          clienteId: 'cliente123',
          monto: 5000,
          fecha: '2024-01-20',
        },
      ];

      render(
        <PortalCliente
          clienteData={mockClienteData}
          recibos={mockRecibos}
          pagos={mockPagos}
          citas={[]}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Pagado')).toBeInTheDocument();
    });

    test('should open modal when "Ver" button is clicked', async () => {
      const user = userEvent.setup();

      const mockRecibos = [
        {
          id: 'recibo1',
          clienteId: 'cliente123',
          mes: 'Enero',
          año: 2024,
          reciboId: 'REC-001',
          totalGeneral: 5000,
          fechaGeneracion: '2024-01-15',
        },
      ];

      render(
        <PortalCliente
          clienteData={mockClienteData}
          recibos={mockRecibos}
          pagos={[]}
          citas={[]}
          onLogout={mockOnLogout}
        />
      );

      const verButton = screen.getByText('Ver');
      await user.click(verButton);

      expect(screen.getByTestId('modal-recibo')).toBeInTheDocument();
      expect(screen.getByText('Recibo ID: recibo1')).toBeInTheDocument();
    });

    test('should display logout button in header', () => {
      render(
        <PortalCliente
          clienteData={mockClienteData}
          recibos={[]}
          pagos={[]}
          citas={[]}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
    });

    test('should display client welcome message', () => {
      render(
        <PortalCliente
          clienteData={mockClienteData}
          recibos={[]}
          pagos={[]}
          citas={[]}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText(/Bienvenido\/a, Juan Pérez/)).toBeInTheDocument();
    });
  });
});
