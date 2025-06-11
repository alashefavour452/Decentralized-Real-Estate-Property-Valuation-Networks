import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract environment
const mockTxSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const mockAdmin = mockTxSender;
const mockAppraiser = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';

// Mock contract state
let appraisers = new Map();
let admin = mockAdmin;

// Mock contract functions
const contractFunctions = {
  'register-appraiser': (name, licenseNumber, licenseExpiry) => {
    const caller = mockTxSender;
    if (appraisers.has(caller) && appraisers.get(caller).isActive) {
      return { type: 'err', value: 1 };
    }
    
    appraisers.set(caller, {
      name,
      licenseNumber,
      licenseExpiry,
      reputationScore: 0,
      isActive: true
    });
    
    return { type: 'ok', value: true };
  },
  
  'update-appraiser-status': (appraiser, isActive) => {
    if (mockTxSender !== admin) {
      return { type: 'err', value: 403 };
    }
    
    if (!appraisers.has(appraiser)) {
      return { type: 'err', value: 404 };
    }
    
    const appraiserData = appraisers.get(appraiser);
    appraisers.set(appraiser, { ...appraiserData, isActive });
    
    return { type: 'ok', value: true };
  },
  
  'update-reputation': (appraiser, score) => {
    if (mockTxSender !== admin) {
      return { type: 'err', value: 403 };
    }
    
    if (score > 100) {
      return { type: 'err', value: 400 };
    }
    
    if (!appraisers.has(appraiser)) {
      return { type: 'err', value: 404 };
    }
    
    const appraiserData = appraisers.get(appraiser);
    appraisers.set(appraiser, { ...appraiserData, reputationScore: score });
    
    return { type: 'ok', value: true };
  },
  
  'is-verified-appraiser': (appraiser) => {
    if (!appraisers.has(appraiser)) {
      return false;
    }
    return appraisers.get(appraiser).isActive;
  },
  
  'get-appraiser-details': (appraiser) => {
    if (!appraisers.has(appraiser)) {
      return null;
    }
    return appraisers.get(appraiser);
  },
  
  'transfer-admin': (newAdmin) => {
    if (mockTxSender !== admin) {
      return { type: 'err', value: 403 };
    }
    
    admin = newAdmin;
    return { type: 'ok', value: true };
  }
};

describe('Appraiser Verification Contract', () => {
  beforeEach(() => {
    // Reset state before each test
    appraisers = new Map();
    admin = mockAdmin;
  });
  
  it('should register a new appraiser', () => {
    const result = contractFunctions['register-appraiser']('John Doe', 'LIC123456', 1672531200);
    expect(result.type).toBe('ok');
    expect(appraisers.has(mockTxSender)).toBe(true);
    expect(appraisers.get(mockTxSender).name).toBe('John Doe');
  });
  
  it('should not allow registering the same appraiser twice', () => {
    contractFunctions['register-appraiser']('John Doe', 'LIC123456', 1672531200);
    const result = contractFunctions['register-appraiser']('John Doe', 'LIC123456', 1672531200);
    expect(result.type).toBe('err');
    expect(result.value).toBe(1);
  });
  
  it('should allow admin to update appraiser status', () => {
    contractFunctions['register-appraiser']('John Doe', 'LIC123456', 1672531200);
    const result = contractFunctions['update-appraiser-status'](mockTxSender, false);
    expect(result.type).toBe('ok');
    expect(appraisers.get(mockTxSender).isActive).toBe(false);
  });
  
  it('should not allow non-admin to update appraiser status', () => {
    admin = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP'; // Different from mockTxSender
    contractFunctions['register-appraiser']('John Doe', 'LIC123456', 1672531200);
    const result = contractFunctions['update-appraiser-status'](mockTxSender, false);
    expect(result.type).toBe('err');
    expect(result.value).toBe(403);
  });
  
  it('should correctly verify an appraiser', () => {
    contractFunctions['register-appraiser']('John Doe', 'LIC123456', 1672531200);
    expect(contractFunctions['is-verified-appraiser'](mockTxSender)).toBe(true);
    
    contractFunctions['update-appraiser-status'](mockTxSender, false);
    expect(contractFunctions['is-verified-appraiser'](mockTxSender)).toBe(false);
  });
  
  it('should return appraiser details', () => {
    contractFunctions['register-appraiser']('John Doe', 'LIC123456', 1672531200);
    const details = contractFunctions['get-appraiser-details'](mockTxSender);
    expect(details).not.toBeNull();
    expect(details.name).toBe('John Doe');
    expect(details.licenseNumber).toBe('LIC123456');
  });
  
  it('should allow admin transfer', () => {
    const newAdmin = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP';
    const result = contractFunctions['transfer-admin'](newAdmin);
    expect(result.type).toBe('ok');
    expect(admin).toBe(newAdmin);
  });
});
