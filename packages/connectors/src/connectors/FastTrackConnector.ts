import { BaseConnector } from '../base/BaseConnector';
import { ConnectorConfig } from '../interfaces/IConnector';

/**
 * FastTrack Connector
 * 
 * Implements the BaseConnector for FastTrack agency integration.
 * Handles credential-based authentication and provides data transformation
 * for FastTrack's specific API format.
 * 
 * Key Features:
 * - Username/password authentication
 * - High-volume transaction processing
 * - Multi-format evidence support
 * - Advanced filtering capabilities
 */

export class FastTrackConnector extends BaseConnector {
  constructor(config: ConnectorConfig) {
    super('fasttrack', 'FastTrack', config);
  }

  /**
   * Transform FastTrack account information to standard format
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
   * Transform FastTrack transaction data to standard format
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
   * Transform FastTrack evidence data to standard format
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
