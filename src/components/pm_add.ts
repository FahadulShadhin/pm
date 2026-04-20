import fs from 'fs';
import crypto from 'crypto';
import { DEFAULT_VAULT_DIR, DEFAULT_VAULT_FILE } from '../utils/constants';
import { PMBase } from './pm_base';

export class PMAdd {
  private vaultFile: string;
  private pmBase: PMBase;

  constructor(vaultFile = DEFAULT_VAULT_FILE, pmBase = new PMBase()) {
    this.vaultFile = vaultFile;
    this.pmBase = pmBase;
  }

  public async addAccount(): Promise<void> {
    if (!fs.existsSync(this.vaultFile)) {
      console.log('Vault not found. Please run "pm init" first.');
      process.exit(1);
    }

    const masterPassword = await this.pmBase.promptHidden(
      'Enter master password: '
    );
    const file = JSON.parse(fs.readFileSync(this.vaultFile, 'utf8'));
    const salt = Buffer.from(file.salt, 'base64');
    const key = this.pmBase.deriveKey(masterPassword, salt);
    let vault;

    try {
      const decrypted = this.pmBase.decrypt(file, key);
      vault = JSON.parse(decrypted);
    } catch (err) {
      console.log('Incorrect master password. Please try again.');
      process.exit(1);
    }

    const site = await this.pmBase.prompt('Site: ');
    const username = await this.pmBase.prompt('Username: ');
    const password = await this.pmBase.promptHidden('Password: ');

    const newAccount = {
      id: crypto.randomUUID(),
      site,
      username,
      password,
      createdAt: new Date().toISOString(),
    };

    vault.accounts.push(newAccount);

    const enctypted = this.pmBase.encrypt(JSON.stringify(vault), key);

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
