import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract environment
const mockTxSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const mockAdmin = mockTxSender;

// Mock contract state
let methodologies = new Map();
let admin = mockAdmin;
let nextMethodologyId = 1;

// Mock contract functions
const contractFunctions = {
  'add-methodology': (name, description) => {
    if (mockTxSender !== admin) {
      return { type: 'err', value: 403 };
    }
    
    const methodologyId = nextMethodologyId;
    methodologies.set(methodologyId, {
      name,
      description,
      version: 1,
      isActive: true
    });
    
    nextMethodologyId++;
    return { type: 'ok', value: methodologyId };
  },
  
  'update-methodology': (methodologyId, name, description) => {
    if (mockTxSender !== admin) {
      return { type: 'err', value: 403 };
    }
    
    if (!methodologies.has(methodologyId)) {
      return { type: 'err', value: 404 };
    }
    
    const methodology = methodologies.get(methodologyId);
    methodologies.set(methodologyId, {
      name,
      description,
      version: methodology.version + 1,
      isActive: methodology.isActive
    });
    
    return { type: 'ok', value: true };
  },
  
  'set-methodology-status': (methodologyId, isActive) => {
    if (mockTxSender !== admin) {
      return { type: 'err', value: 403 };
    }
    
    if (!methodologies.has(methodologyId)) {
      return { type: 'err', value: 404 };
    }
    
    const methodology = methodologies.get(methodologyId);
    methodologies.set(methodologyId, {
      ...methodology,
      isActive
    });
    
    return { type: 'ok', value: true };
  },
  
  'get-methodology': (methodologyId) => {
    if (!methodologies.has(methodologyId)) {
      return null;
    }
    return methodologies.get(methodologyId);
  },
  
  'is-active-methodology': (methodologyId) => {
    if (!methodologies.has(methodologyId)) {
      return false;
    }
    return methodologies.get(methodologyId).isActive;
  },
  
  'transfer-admin': (newAdmin) => {
    if (mockTxSender !== admin) {
      return { type: 'err', value: 403 };
    }
    
    admin = newAdmin;
    return { type: 'ok', value: true };
  }
};

describe('Valuation Methodology Contract', () => {
  beforeEach(() => {
    // Reset state before each test
    methodologies = new Map();
    admin = mockAdmin;
    nextMethodologyId = 1;
  });
  
  it('should add a new methodology', () => {
    const result = contractFunctions['add-methodology']('Comparative Market Analysis', 'A method that estimates value by comparing a subject property to similar properties sold in the area.');
    expect(result.type).toBe('ok');
    expect(result.value).toBe(1);
    expect(methodologies.has(1)).toBe(true);
    expect(methodologies.get(1).name).toBe('Comparative Market Analysis');
  });
  
  it('should not allow non-admin to add methodology', () => {
    admin = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP'; // Different from mockTxSender
    const result = contractFunctions['add-methodology']('Comparative Market Analysis', 'A method that estimates value by comparing a subject property to similar properties sold in the area.');
    expect(result.type).toBe('err');
    expect(result.value).toBe(403);
  });
  
  it('should update an existing methodology', () => {
    contractFunctions['add-methodology']('Comparative Market Analysis', 'Original description');
    const result = contractFunctions['update-methodology'](1, 'Comparative Market Analysis', 'Updated description');
    expect(result.type).toBe('ok');
    expect(methodologies.get(1).description).toBe('Updated description');
    expect(methodologies.get(1).version).toBe(2);
  });
  
  it('should not update a non-existent methodology', () => {
    const result = contractFunctions['update-methodology'](999, 'Comparative Market Analysis', 'Updated description');
    expect(result.type).toBe('err');
    expect(result.value).toBe(404);
  });
  
  it('should set methodology status', () => {
    contractFunctions['add-methodology']('Comparative Market Analysis', 'Original description');
    const result = contractFunctions['set-methodology-status'](1, false);
    expect(result.type).toBe('ok');
    expect(methodologies.get(1).isActive).toBe(false);
  });
  
  it('should correctly check if a methodology is active', () => {
    contractFunctions['add-methodology']('Comparative Market Analysis', 'Original description');
    expect(contractFunctions['is-active-methodology'](1)).toBe(true);
    
    contractFunctions['set-methodology-status'](1, false);
    expect(contractFunctions['is-active-methodology'](1)).toBe(false);
  });
  
  it('should return methodology details', () => {
    contractFunctions['add-methodology']('Comparative Market Analysis', 'Original description');
    const methodology = contractFunctions['get-methodology'](1);
    expect(methodology).not.toBeNull();
    expect(methodology.name).toBe('Comparative Market Analysis');
    expect(methodology.version).toBe(1);
  });
  
  it('should allow admin transfer', () => {
    const newAdmin = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP';
    const result = contractFunctions['transfer-admin'](newAdmin);
    expect(result.type).toBe('ok');
    expect(admin).toBe(newAdmin);
  });
});
