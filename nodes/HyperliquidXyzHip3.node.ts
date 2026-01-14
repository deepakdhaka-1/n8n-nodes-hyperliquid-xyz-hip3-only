import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

import { HyperliquidClient } from '../transport/hyperliquidClient';
import { Meta, HyperliquidOrderWire } from '../types';

export class HyperliquidXyzHip3 implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Hyperliquid XYZ (HIP-3)',
    name: 'hyperliquidXyzHip3',
    group: ['transform'],
    version: 1,
    description: 'Trade HIP-3 xyz assets on Hyperliquid',
    defaults: { name: 'Hyperliquid XYZ (HIP-3)' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'hyperliquidApi', required: true }],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          { name: 'Place Market Order', value: 'market' },
          { name: 'Place Limit Order', value: 'limit' },
          { name: 'Cancel Order', value: 'cancel' },
          { name: 'Get Open Orders', value: 'openOrders' },
          { name: 'Get Balance', value: 'balance' },
          { name: 'Get All Prices', value: 'prices' },
        ],
        default: 'limit',
      },
      {
        displayName: 'Asset',
        name: 'asset',
        type: 'string',
        default: 'xyz:XYZ100',
      },
      {
        displayName: 'Side',
        name: 'side',
        type: 'options',
        options: [
          { name: 'Buy', value: 'buy' },
          { name: 'Sell', value: 'sell' },
        ],
        default: 'buy',
      },
      {
        displayName: 'Size',
        name: 'size',
        type: 'number',
        default: 1,
      },
      {
        displayName: 'Price',
        name: 'price',
        type: 'number',
        default: 0,
      },
      {
        displayName: 'Order ID',
        name: 'orderId',
        type: 'number',
        default: 0,
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const creds = await this.getCredentials('hyperliquidApi');
    const client = new HyperliquidClient(
      creds.privateKey as string,
      creds.walletType === 'agent' ? (creds.masterAddress as string) : undefined,
      creds.vaultAddress as string || undefined
    );

    const meta = (await client.getMeta()) as Meta;

    const resolveAsset = (symbol: string) => {
      if (!symbol.startsWith('xyz:')) {
        throw new NodeOperationError(this.getNode(), 'Only xyz HIP-3 assets allowed');
      }
      const idx = meta.universe.findIndex(u => u.name === symbol);
      if (idx === -1) throw new NodeOperationError(this.getNode(), 'Unknown asset');
      return 11000 + idx;
    };

    const results: INodeExecutionData[] = [];

    for (let i = 0; i < this.getInputData().length; i++) {
      const op = this.getNodeParameter('operation', i) as string;
      const asset = this.getNodeParameter('asset', i) as string;
      const a = resolveAsset(asset);

      let res;

      if (op === 'market' || op === 'limit') {
        const side = this.getNodeParameter('side', i) === 'buy';
        const size = String(this.getNodeParameter('size', i));
        const price = String(this.getNodeParameter('price', i));

        const order: HyperliquidOrderWire = {
          a,
          b: side,
          s: size,
          p: price,
          r: false,
          t: { limit: { tif: op === 'market' ? 'Ioc' : 'Gtc' } },
        };

        res = await client.exchange({ type: 'order', orders: [order] });
      }

      if (op === 'cancel') {
        const oid = this.getNodeParameter('orderId', i);
        res = await client.exchange({ type: 'cancel', cancels: [{ a, o: oid }] });
      }

      if (op === 'openOrders') res = await client.getOpenOrders();
      if (op === 'balance') res = await client.getClearinghouseState();
      if (op === 'prices') res = await client.getAllMids();

      results.push({ json: res });
    }

    return [results];
  }
}
