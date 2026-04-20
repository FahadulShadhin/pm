import fs from 'fs';
import crypto from 'crypto';
import { DEFAULT_VAULT_FILE } from '../utils/constants';
import { Base } from './base';

export class Vault {
  private vaultFile: string;
  private base: Base;

  constructor(vaultFile = DEFAULT_VAULT_FILE, base = new Base()) {
    this.vaultFile = vaultFile;
    this.base = base;
  }

  public async addAccount(): Promise<void> {
    if (!fs.existsSync(this.vaultFile)) {
      console.log('Vault not found. Please run "pm init" first.');
      process.exit(1);
    }

    const masterPassword = await this.base.promptHidden(
      'Enter master password: '
    );
    const file = JSON.parse(fs.readFileSync(this.vaultFile, 'utf8'));
    const salt = Buffer.from(file.salt, 'base64');
    const key = this.base.deriveKey(masterPassword, salt);
    let vault;

    try {
      const decrypted = this.base.decrypt(file, key);
      vault = JSON.parse(decrypted);
    } catch (err) {
      console.log('Incorrect master password. Please try again.');
      process.exit(1);
    }

    const site = await this.base.prompt('Site: ');
    const username = await this.base.prompt('Username: ');
    const password = await this.base.promptHidden('Password: ');

    const newAccount = {
      id: crypto.randomUUID(),
      site,
      username,
      password,
      createdAt: new Date().toISOString(),
    };

    vault.accounts.push(newAccount);

    const enctypted = this.base.encrypt(JSON.stringify(vault), key);

    const payload = {
      salt: file.salt,
      ...enctypted,
    };

    fs.writeFileSync(this.vaultFile, JSON.stringify(payload, null, 2));
    console.log('Account added successfully!');

    vault = null; // Clear vault data from memory
    process.exit(0);
  }
}
