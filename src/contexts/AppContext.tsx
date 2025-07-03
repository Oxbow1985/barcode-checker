import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ProcessingState, BarcodeData, ComparisonResult, SupplierInfo, ProductReference } from '../types';

interface AppState extends ProcessingState {
  isProcessing: boolean;
  error: string | null;
  productReferences?: ProductReference[];
  pdfCodeCount?: number;
  detectedFormat?: 'FW25' | 'SS26' | 'MIXED';
}

type AppAction = 
  | { type: 'SET_STEP'; payload: ProcessingState['step'] }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_MESSAGE'; payload: string }
  | { type: 'SET_FILES'; payload: { pdfFile?: File; excelFile?: File } }
  | { type: 'SET_BARCODES'; payload: BarcodeData[] }
  | { type: 'SET_RESULTS'; payload: ComparisonResult[] }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DETECTED_SUPPLIER'; payload: SupplierInfo }
  | { type: 'SET_AVAILABLE_SUPPLIERS'; payload: SupplierInfo[] }
  | { type: 'SET_SELECTED_SUPPLIER'; payload: SupplierInfo }
  | { type: 'SET_PRODUCT_REFERENCES'; payload: ProductReference[] }
  | { type: 'SET_PDF_COUNT'; payload: number }
  | { type: 'SET_DETECTED_FORMAT'; payload: 'FW25' | 'SS26' | 'MIXED' }
  | { type: 'RESET' };

const initialState: AppState = {
  step: 'upload',
  progress: 0,
  message: '',
  barcodes: [],
  results: [],
  isProcessing: false,
  error: null,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    case 'SET_MESSAGE':
      return { ...state, message: action.payload };
    case 'SET_FILES':
      return { ...state, ...action.payload };
    case 'SET_BARCODES':
      return { ...state, barcodes: action.payload };
    case 'SET_RESULTS':
      return { ...state, results: action.payload };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_DETECTED_SUPPLIER':
      return { ...state, detectedSupplier: action.payload };
    case 'SET_AVAILABLE_SUPPLIERS':
      return { ...state, availableSuppliers: action.payload };
    case 'SET_SELECTED_SUPPLIER':
      return { ...state, selectedSupplier: action.payload };
    case 'SET_PRODUCT_REFERENCES':
      return { ...state, productReferences: action.payload };
    case 'SET_PDF_COUNT':
      return { ...state, pdfCodeCount: action.payload };
    case 'SET_DETECTED_FORMAT':
      return { ...state, detectedFormat: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}