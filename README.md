# SolanaWeb3-OutSystems
This repo is used to provide the needed source code to generate a webpack based off JavaScript and TypeScript code as an iife (Immediately Invoked Function Expression) that can be referenced in the OutSystems platform Code is based off the @solana/web3.js and @solana/spl-token packages.

## What is a webpack?
Webpack is a module bundler. Its main purpose is to bundle JavaScript files for usage in a browser. This means we can take code from npm packages and enable its usage in OutSystems reactive or mobile apps (traditional web not tested). 

## What it does
Once the webpack is generated, allows you to
 - Create a Solana Wallet keypair.
 - Transfer Solana between 2 wallets or online wallets.
 - Airdrop SOL to a wallet on the devnet or testnet Solana nodes.
 - Transfer Tokens between 2 wallet accounts.
 - Create a Token on the Solana blockchain.
 - Create an NFT on the Solana blockchain
 All from within the OutSystems platform.
 
## Online Wallet suggestions
Solflare is my personal preference but Phantom wallet also exists.

## Pre-requisites needed to generate the webpack
1. NodeJS & npm - https://nodejs.org/en/download/
2. ts-node npm package - https://www.npmjs.com/package/ts-node. ts-node is used for testing the code.

## How to generate the webpack
If all the pre-requisites are installed then the following command will generate the webpack:
```
npx webpack --config webpack.config.js
```
Once generated, import it under the 'Scripts' section of your reactive or mobile app and reference it on the page you need the functionality on. The 'RequireScript' client action can also be used but my slow down the app and use exessive network resources due  to the size of the script. A non-iife approach would have to be taken if you wish to do that effectively. 

Feel free to fork this repo or create a pull request to make changes that you think would benefit the project!
