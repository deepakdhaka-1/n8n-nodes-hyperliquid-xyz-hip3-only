import axios from 'axios';
import { ethers } from 'ethers';

export class HyperliquidClient {
  private wallet: ethers.Wallet;
  private baseUrl = 'https://api.hyperliquid.xyz';
  private master?: string;
  private vault?: string;

  constructor(
    privateKey: string,
    master?: string,
    vault?: string
  ) {
    this.wallet = new ethers.Wallet(privateKey);
    this.master = master;
    this.vault = vault;
  }

  private async post(path: string, body: unknown) {
    return axios.post(`${this.baseUrl}${path}`, body).then(r => r.data);
  }

  async getMeta(dex = 'xyz') {
    return this.post('/info', { type: 'meta', dex });
  }

  async exchange(payload: unknown) {
    return this.post('/exchange', payload);
  }

  async info(payload: unknown) {
    return this.post('/info', payload);
  }

  async getAllMids() {
    return this.info({ type: 'allMids' });
  }

  async getOpenOrders() {
    return this.info({ type: 'openOrders' });
  }

  async getUserFills() {
    return this.info({ type: 'userFills' });
  }

  async getClearinghouseState() {
    return this.info({ type: 'clearinghouseState' });
  }
}
