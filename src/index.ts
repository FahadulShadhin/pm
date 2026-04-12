#!/usr/bin/env node

const command = process.argv[2];

switch (command) {
  case 'init':
    handleInit();
    break;

  default:
    console.log(`Unknown command: ${command}`);
    console.log('Available commands:');
    console.log('  pm init');
    break;
}

function handleInit() {
  console.log('🔐 Initializing password manager...');
}
