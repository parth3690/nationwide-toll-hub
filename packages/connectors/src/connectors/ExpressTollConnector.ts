import { BaseConnector } from '../base/BaseConnector';
import { ConnectorConfig } from '../interfaces/IConnector';

/**
 * ExpressToll Connector
 * 
 * Implements the BaseConnector for ExpressToll agency integration.
 * Handles API key authentication and provides data transformation
 * for ExpressToll's specific API format.
 * 
 * Key Features:
 * - API key authentication
 * - Batch transaction processing
 * - Video evidence support
 * - Real-time balance updates
 */

export class ExpressTollConnector extends BaseConnector {
  constructor(config: ConnectorConfig) {
    super('expresstoll', 'ExpressToll', config);
  }

  /**
   * Transform ExpressToll account information to standard format
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
   * Transform ExpressToll transaction data to standard format
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
   * Transform ExpressToll evidence data to standard format
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
