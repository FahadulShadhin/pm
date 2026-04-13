#!/usr/bin/env node

import { PMInit } from './components/pm_init';
import { PMAdd } from './components/pm_add';

(async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'init':
      const pmInit = new PMInit();
      await pmInit.init();
      process.exit(0);

    case 'add':
      const pmAdd = new PMAdd();
      pmAdd.addAccount();
      process.exit(0);

    default:
      console.log(`Unknown command: ${command}`);
      console.log('Available commands:');
      console.log('  pm init');
      console.log('  pm unlock');
      break;
  }
})();
