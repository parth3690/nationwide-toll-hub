import { BaseConnector } from '../base/BaseConnector';
import { ConnectorConfig } from '../interfaces/IConnector';

/**
 * E-Toll Connector
 * 
 * Implements the BaseConnector for E-Toll agency integration.
 * Handles OAuth2 authentication and provides data transformation
 * for E-Toll's specific API format.
 * 
 * Key Features:
 * - OAuth2 authentication flow
 * - Real-time transaction data
 * - Image evidence support
 * - Comprehensive error handling
 */

export class ETollConnector extends BaseConnector {
  constructor(config: ConnectorConfig) {
    super('etoll', 'E-Toll', config);
  }

  /**
   * Transform E-Toll account information to standard format
   */
  protected transformAccountInfo(data: any): any {
    return {
      id: data.accountId,
      name: data.accountName,
      type: data.accountType,
      status: data.status,
      balance: data.currentBalance,
      currency: data.currency || 'USD',
      lastUpdated: new Date(data.lastUpdated),
      metadata: {
        accountNumber: data.accountNumber,
        customerId: data.customerId,
        tags: data.tags || [],
      },
    };
  }

  /**
   * Transform E-Toll transaction data to standard format
   */
  protected transformTransaction(data: any): any {
    return {
      id: data.transactionId,
      accountId: data.accountId,
      amount: data.tollAmount,
      currency: data.currency || 'USD',
      timestamp: new Date(data.transactionDate),
      location: {
        name: data.locationName,
        coordinates: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
        address: data.address,
      },
      vehicle: {
        licensePlate: data.licensePlate,
        type: data.vehicleType,
        make: data.vehicleMake,
        model: data.vehicleModel,
      },
      tollDetails: {
        facility: data.facilityName,
        lane: data.laneNumber,
        direction: data.direction,
        class: data.vehicleClass,
      },
      evidence: {
        images: data.evidenceImages || [],
        video: data.evidenceVideo || null,
      },
      metadata: {
        transactionType: data.transactionType,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        tags: data.tags || [],
      },
    };
  }

  /**
   * Transform E-Toll evidence data to standard format
   */
  protected transformEvidence(data: any): any {
    return {
      id: data.evidenceId,
      transactionId: data.transactionId,
      type: data.evidenceType,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      timestamp: new Date(data.capturedAt),
      metadata: {
        cameraId: data.cameraId,
        laneId: data.laneId,
        quality: data.quality,
        size: data.size,
      },
    };
  }
}
