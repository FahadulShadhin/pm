#!/usr/bin/env node

import { handleInit } from './components/pm_init';

function handleUnlock() {
  console.log('🔓 Unlocking password manager...');
}

(function main() {
  const command = process.argv[2];

  switch (command) {
    case 'init':
      handleInit();
      break;

    case 'unlock':
      handleUnlock();
      break;

    default:
      console.log(`Unknown command: ${command}`);
      console.log('Available commands:');
      console.log('  pm init');
      console.log('  pm unlock');
      break;
  }
})();
