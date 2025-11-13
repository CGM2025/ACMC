// Mock Firebase modules before importing
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn((config) => ({
    name: '[DEFAULT]',
    options: config,
  })),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
}));

describe('Firebase Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to ensure clean state
    jest.resetModules();
    
    // Restore original environment
    process.env = { ...originalEnv };
    
    // Clear console.log mock
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Restore console.log
    console.log.mockRestore();
  });

  describe('Environment variable loading', () => {
    test('firebaseConfig correctly loads REACT_APP_FIREBASE_API_KEY from environment variables', () => {
      // Set environment variable
      process.env.REACT_APP_FIREBASE_API_KEY = 'test-api-key-12345';
      
      // Import firebase module (this will execute the config)
      const { initializeApp } = require('firebase/app');
      require('./firebase');
      
      // Verify initializeApp was called with correct apiKey
      expect(initializeApp).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'test-api-key-12345',
        })
      );
    });

    test('firebaseConfig correctly loads REACT_APP_FIREBASE_AUTH_DOMAIN from environment variables', () => {
      // Set environment variable
      process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = 'test-app.firebaseapp.com';
      
      // Import firebase module
      const { initializeApp } = require('firebase/app');
      require('./firebase');
      
      // Verify initializeApp was called with correct authDomain
      expect(initializeApp).toHaveBeenCalledWith(
        expect.objectContaining({
          authDomain: 'test-app.firebaseapp.com',
        })
      );
    });

    test('firebaseConfig correctly loads REACT_APP_FIREBASE_PROJECT_ID from environment variables', () => {
      // Set environment variable
      process.env.REACT_APP_FIREBASE_PROJECT_ID = 'test-project-id';
      
      // Import firebase module
      const { initializeApp } = require('firebase/app');
      require('./firebase');
      
      // Verify initializeApp was called with correct projectId
      expect(initializeApp).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'test-project-id',
        })
      );
    });

    test('firebaseConfig correctly loads REACT_APP_FIREBASE_STORAGE_BUCKET from environment variables', () => {
      // Set environment variable
      process.env.REACT_APP_FIREBASE_STORAGE_BUCKET = 'test-bucket.appspot.com';
      
      // Import firebase module
      const { initializeApp } = require('firebase/app');
      require('./firebase');
      
      // Verify initializeApp was called with correct storageBucket
      expect(initializeApp).toHaveBeenCalledWith(
        expect.objectContaining({
          storageBucket: 'test-bucket.appspot.com',
        })
      );
    });

    test('firebaseConfig loads all environment variables together', () => {
      // Set all environment variables
      process.env.REACT_APP_FIREBASE_API_KEY = 'test-api-key';
      process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = 'test-domain.firebaseapp.com';
      process.env.REACT_APP_FIREBASE_PROJECT_ID = 'test-project';
      process.env.REACT_APP_FIREBASE_STORAGE_BUCKET = 'test-storage.appspot.com';
      process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID = '123456789';
      process.env.REACT_APP_FIREBASE_APP_ID = '1:123456789:web:abcdef';
      
      // Import firebase module
      const { initializeApp } = require('firebase/app');
      require('./firebase');
      
      // Verify initializeApp was called with all config values
      expect(initializeApp).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        authDomain: 'test-domain.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test-storage.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef',
      });
    });
  });

  describe('Firebase initialization', () => {
    test('Firebase app initializes successfully with the configuration loaded from environment variables', () => {
      // Set environment variables
      process.env.REACT_APP_FIREBASE_API_KEY = 'test-api-key';
      process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = 'test-domain.firebaseapp.com';
      process.env.REACT_APP_FIREBASE_PROJECT_ID = 'test-project';
      process.env.REACT_APP_FIREBASE_STORAGE_BUCKET = 'test-storage.appspot.com';
      process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID = '123456789';
      process.env.REACT_APP_FIREBASE_APP_ID = '1:123456789:web:abcdef';
      
      // Import firebase module
      const { initializeApp } = require('firebase/app');
      const firebaseModule = require('./firebase');
      
      // Verify initializeApp was called
      expect(initializeApp).toHaveBeenCalled();
      
      // Verify the app was initialized and returned
      expect(firebaseModule.default).toBeDefined();
      expect(firebaseModule.default).toEqual(
        expect.objectContaining({
          name: '[DEFAULT]',
          options: expect.any(Object),
        })
      );
    });

    test('Firebase app initializes Firestore and Auth', () => {
      // Set environment variables
      process.env.REACT_APP_FIREBASE_API_KEY = 'test-api-key';
      process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = 'test-domain.firebaseapp.com';
      process.env.REACT_APP_FIREBASE_PROJECT_ID = 'test-project';
      process.env.REACT_APP_FIREBASE_STORAGE_BUCKET = 'test-storage.appspot.com';
      
      // Import firebase module
      const { getFirestore } = require('firebase/firestore');
      const { getAuth } = require('firebase/auth');
      const firebaseModule = require('./firebase');
      
      // Verify Firestore and Auth were initialized
      expect(getFirestore).toHaveBeenCalled();
      expect(getAuth).toHaveBeenCalled();
      
      // Verify exports are defined
      expect(firebaseModule.db).toBeDefined();
      expect(firebaseModule.auth).toBeDefined();
    });

    test('Firebase initialization logs success message', () => {
      // Set environment variables
      process.env.REACT_APP_FIREBASE_API_KEY = 'test-api-key';
      process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = 'test-domain.firebaseapp.com';
      process.env.REACT_APP_FIREBASE_PROJECT_ID = 'test-project';
      process.env.REACT_APP_FIREBASE_STORAGE_BUCKET = 'test-storage.appspot.com';
      
      // Import firebase module
      require('./firebase');
      
      // Verify console.log was called with success message
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Firebase inicializado correctamente')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Firestore DB:'),
        expect.any(Object)
      );
    });
  });

  describe('Edge cases', () => {
    test('handles undefined environment variables', () => {
      // Don't set any environment variables
      
      // Import firebase module
      const { initializeApp } = require('firebase/app');
      require('./firebase');
      
      // Verify initializeApp was called with undefined values
      expect(initializeApp).toHaveBeenCalledWith({
        apiKey: undefined,
        authDomain: undefined,
        projectId: undefined,
        storageBucket: undefined,
        messagingSenderId: undefined,
        appId: undefined,
      });
    });

    test('handles empty string environment variables', () => {
      // Set empty string environment variables
      process.env.REACT_APP_FIREBASE_API_KEY = '';
      process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = '';
      process.env.REACT_APP_FIREBASE_PROJECT_ID = '';
      process.env.REACT_APP_FIREBASE_STORAGE_BUCKET = '';
      
      // Import firebase module
      const { initializeApp } = require('firebase/app');
      require('./firebase');
      
      // Verify initializeApp was called with empty strings
      expect(initializeApp).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: '',
          authDomain: '',
          projectId: '',
          storageBucket: '',
        })
      );
    });
  });
});
