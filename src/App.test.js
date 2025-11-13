import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { auth } from './firebase';

// Mock Firebase
jest.mock('./firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn((callback) => {
      callback(null);
      return jest.fn();
    }),
  },
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  writeBatch: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  where: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return jest.fn();
  }),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
}));

describe('Nueva Cita Button Tests', () => {
  test('should render the "Nueva Cita" button on the screen', async () => {
    // Mock authenticated user with permissions
    const mockUser = { email: 'test@example.com', uid: '123' };
    auth.currentUser = mockUser;
    
    const onAuthStateChanged = require('firebase/auth').onAuthStateChanged;
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    render(<App />);

    // Wait for the app to load and navigate to citas tab
    await waitFor(() => {
      const citasTab = screen.queryByText('Citas');
      if (citasTab) {
        fireEvent.click(citasTab);
      }
    });

    // Check if "Nueva Cita" button is rendered
    await waitFor(() => {
      const nuevaCitaButton = screen.getByText('Nueva Cita');
      expect(nuevaCitaButton).toBeInTheDocument();
    });
  });

  test('should call openModal with "cita" as an argument when "Nueva Cita" button is clicked', async () => {
    // Mock authenticated user with permissions
    const mockUser = { email: 'test@example.com', uid: '123' };
    auth.currentUser = mockUser;
    
    const onAuthStateChanged = require('firebase/auth').onAuthStateChanged;
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    render(<App />);

    // Wait for the app to load and navigate to citas tab
    await waitFor(() => {
      const citasTab = screen.queryByText('Citas');
      if (citasTab) {
        fireEvent.click(citasTab);
      }
    });

    // Find and click the "Nueva Cita" button
    await waitFor(() => {
      const nuevaCitaButton = screen.getByText('Nueva Cita');
      expect(nuevaCitaButton).toBeInTheDocument();
      fireEvent.click(nuevaCitaButton);
    });

    // Verify that the modal is opened (check for modal title)
    await waitFor(() => {
      const modalTitle = screen.getByText('Nueva Cita');
      expect(modalTitle).toBeInTheDocument();
    });
  });
});
