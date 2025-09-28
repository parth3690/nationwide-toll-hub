import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Delete existing entries
  await knex('agencies').del();

  // Insert seed entries
  await knex('agencies').insert([
    {
      id: 'md_driveez',
      name: 'Maryland DriveEZ',
      region: 'Mid-Atlantic',
      states: ['MD', 'DE', 'PA', 'NJ', 'NY', 'CT', 'MA', 'NH', 'ME', 'VT', 'RI'],
      protocol: 'ezpass',
      capabilities: {
        read: true,
        write: true,
        topup: true,
        evidence: true,
      },
      connector_config: {
        baseUrl: 'https://api.driveezmd.com',
        authType: 'oauth2',
        endpoints: {
          accounts: '/v1/accounts',
          transactions: '/v1/transactions',
          evidence: '/v1/evidence',
        },
      },
      status: 'active',
    },
    {
      id: 'fl_sunpass',
      name: 'Florida SunPass',
      region: 'Southeast',
      states: ['FL', 'GA', 'NC', 'SC'],
      protocol: 'sunpass',
      capabilities: {
        read: true,
        write: true,
        topup: true,
        evidence: true,
      },
      connector_config: {
        baseUrl: 'https://api.sunpass.com',
        authType: 'oauth2',
        endpoints: {
          accounts: '/api/accounts',
          transactions: '/api/transactions',
          evidence: '/api/evidence',
        },
      },
      status: 'active',
    },
    {
      id: 'ca_fastrak',
      name: 'California FasTrak',
      region: 'West Coast',
      states: ['CA', 'NV', 'AZ'],
      protocol: 'fastrak',
      capabilities: {
        read: true,
        write: true,
        topup: true,
        evidence: true,
      },
      connector_config: {
        baseUrl: 'https://api.fastrak.com',
        authType: 'oauth2',
        endpoints: {
          accounts: '/v2/accounts',
          transactions: '/v2/transactions',
          evidence: '/v2/evidence',
        },
      },
      status: 'active',
    },
    {
      id: 'tx_txtag',
      name: 'Texas TxTag',
      region: 'Southwest',
      states: ['TX', 'OK', 'NM'],
      protocol: 'txtag',
      capabilities: {
        read: true,
        write: true,
        topup: true,
        evidence: false,
      },
      connector_config: {
        baseUrl: 'https://api.txtag.org',
        authType: 'credentials',
        endpoints: {
          accounts: '/api/accounts',
          transactions: '/api/transactions',
        },
      },
      status: 'active',
    },
    {
      id: 'ny_mta',
      name: 'New York MTA',
      region: 'Northeast',
      states: ['NY', 'NJ', 'CT'],
      protocol: 'mta',
      capabilities: {
        read: true,
        write: false,
        topup: false,
        evidence: true,
      },
      connector_config: {
        baseUrl: 'https://api.mta.info',
        authType: 'api_key',
        endpoints: {
          accounts: '/v1/accounts',
          transactions: '/v1/transactions',
          evidence: '/v1/evidence',
        },
      },
      status: 'active',
    },
    {
      id: 'il_ipass',
      name: 'Illinois I-PASS',
      region: 'Midwest',
      states: ['IL', 'IN', 'IA', 'WI'],
      protocol: 'proprietary',
      capabilities: {
        read: true,
        write: true,
        topup: true,
        evidence: true,
      },
      connector_config: {
        baseUrl: 'https://api.getipass.com',
        authType: 'oauth2',
        endpoints: {
          accounts: '/api/accounts',
          transactions: '/api/transactions',
          evidence: '/api/evidence',
        },
      },
      status: 'active',
    },
    {
      id: 'wa_goodtogo',
      name: 'Washington Good To Go!',
      region: 'Pacific Northwest',
      states: ['WA', 'OR'],
      protocol: 'proprietary',
      capabilities: {
        read: true,
        write: true,
        topup: true,
        evidence: true,
      },
      connector_config: {
        baseUrl: 'https://api.mygoodtogo.com',
        authType: 'oauth2',
        endpoints: {
          accounts: '/v1/accounts',
          transactions: '/v1/transactions',
          evidence: '/v1/evidence',
        },
      },
      status: 'active',
    },
    {
      id: 'va_ezpass',
      name: 'Virginia E-ZPass',
      region: 'Mid-Atlantic',
      states: ['VA', 'WV', 'KY', 'TN'],
      protocol: 'ezpass',
      capabilities: {
        read: true,
        write: true,
        topup: true,
        evidence: true,
      },
      connector_config: {
        baseUrl: 'https://api.ezpassva.com',
        authType: 'oauth2',
        endpoints: {
          accounts: '/api/accounts',
          transactions: '/api/transactions',
          evidence: '/api/evidence',
        },
      },
      status: 'active',
    },
  ]);
}
