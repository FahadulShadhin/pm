#!/usr/bin/env node

import { MasterAccount } from './components/master_account';
import { Vault } from './components/vault';

(async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'init':
      const pmInit = new MasterAccount();
      await pmInit.init();
      process.exit(0);

    case 'add':
      const vault = new Vault();
      await vault.addAccount();
      process.exit(0);

    default:
      console.log(`Unknown command: ${command}`);
      console.log('Available commands:');
      console.log('  pm init');
      console.log('  pm unlock');
      break;
  }
})();
