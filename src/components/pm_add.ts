import fs from 'fs';
import crypto from 'crypto';
import { DEFAULT_VAULT_DIR, DEFAULT_VAULT_FILE } from '../utils/constants';
import { PMInit } from './pm_init';

export class PMAdd {
  private vaultDir: string;
  private vaultFile: string;
  private pmInit: PMInit;

  constructor(
    vaultDir = DEFAULT_VAULT_DIR,
    vaultFile = DEFAULT_VAULT_FILE,
    pmInit = new PMInit()
  ) {
    this.vaultDir = vaultDir;
    this.vaultFile = vaultFile;
    this.pmInit = pmInit;
  }

  public async addAccount() {
    if (!fs.existsSync(this.vaultFile)) {
      console.log('Vault not found. Please run "pm init" first.');
      process.exit(1);
    }

    const masterPassword = await this.pmInit.promptHidden(
      'Enter master password: '
    );
    const file = JSON.parse(fs.readFileSync(this.vaultFile, 'utf8'));
    const salt = Buffer.from(file.salt, 'base64');
    const key = this.pmInit.deriveKey(masterPassword, salt);
    let vault;

    try {
      const decrypted = this.pmInit.decrypt(file, key);
      vault = JSON.parse(decrypted);
    } catch (err) {
      console.log('Incorrect master password. Please try again.');
      process.exit(1);
    }

    const site = await this.pmInit.prompt('Site: ');
    const username = await this.pmInit.prompt('Username: ');
    const password = await this.pmInit.promptHidden('Password: ');

    const newAccount = {
      id: crypto.randomUUID(),
      site,
      username,
      password,
      createdAt: new Date().toISOString(),
    };

    vault.accounts.push(newAccount);

    const enctypted = this.pmInit.encrypt(JSON.stringify(vault), key);

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
