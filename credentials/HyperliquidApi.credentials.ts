import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class HyperliquidApi implements ICredentialType {
  name = 'hyperliquidApi';
  displayName = 'Hyperliquid API';
  documentationUrl = 'https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api';

  properties: INodeProperties[] = [
    {
      displayName: 'Wallet Type',
      name: 'walletType',
      type: 'options',
      options: [
        { name: 'Main Wallet', value: 'main' },
        { name: 'API Wallet (Agent)', value: 'agent' },
      ],
      default: 'agent',
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: { password: true },
      required: true,
    },
    {
      displayName: 'Master Wallet Address',
      name: 'masterAddress',
      type: 'string',
      required: true,
      displayOptions: { show: { walletType: ['agent'] } },
    },
    {
      displayName: 'Vault Address (Optional)',
      name: 'vaultAddress',
      type: 'string',
      default: '',
    },
  ];
}
