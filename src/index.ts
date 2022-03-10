const { Keypair, Transaction, SystemProgram, PublicKey, Connection, clusterApiUrl, Cluster, sendAndConfirmTransaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, createAssociatedTokenAccount, getAccount, transfer, createMint, mintTo, setAuthority, AuthorityType, TokenAccountNotFoundError, TokenInvalidAccountOwnerError, TokenInvalidAccountSizeError  } = require('@solana/spl-token'); 
 
class solanaLib {
    static getConnection(cluster: typeof Cluster) {
        return new Connection(clusterApiUrl(cluster),'confirmed');
    }

    //Generate a new wallet. A wallet consists of a publicKey and a secretKey
    static createWallet() {
        return Keypair.generate();
    }

    //Only works on devnet and testnet. Sends the set amount of solana to the specified account. 
    //Recommened to send no more than 1 solana (1000000000 lamports) else the request will be rejected.
    static async airdropSolana(connection: typeof Connection, toPubkey: string, lamports: number) {
        const signature = await connection.requestAirdrop(new PublicKey(toPubkey), lamports);
	    await connection.confirmTransaction(signature);

        return signature;
    }

    static async getAccountInfo(connection: typeof Connection, walletPublicKey: string) {
        return await connection.getAccountInfo(new PublicKey(walletPublicKey));
    }

    static async getTokenAccountInfo(connection: typeof Connection, accountPublicKey: string) { 
        let res;
        try {
            res = await getAccount(connection,new PublicKey(accountPublicKey));
        } catch (e) {
            if (e instanceof TokenAccountNotFoundError) {
                res = "Account is not found at the expected address. Please ensure the public key is a token account and not a wallet.";
            } else if (e instanceof TokenInvalidAccountOwnerError) {
                res = "Account is not owned by the expected token program. Please ensure the public key is a token account for the given token address."
            } else if (e instanceof TokenInvalidAccountSizeError) {
                res = "The byte length of an program state account doesn't match the expected size."
            } else {
                res = "An Unknown error occurred"
            }
        }
        return res;
    }

    static async transferSolana(connection: typeof Connection, fromSecretKey: Uint8Array, toPublicKey: string, lamports: number) {
        const fromWallet = Keypair.fromSecretKey(fromSecretKey);
        let transaction = new Transaction();

        // Add transfer instruction to transaction
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: fromWallet.publicKey,
                toPubkey: new PublicKey(toPublicKey),
                lamports: lamports
            })
        );
        
        // Sign transaction, broadcast, and confirm. Returns the transaction signature.
        return await sendAndConfirmTransaction(
            connection,
            transaction,
            [fromWallet]
        );
    }

    //Can be used to send tokens and NFT's
    static async transferToken(connection: typeof Connection, fromSecretKey: Uint8Array, toPublicKey: string, tokenAddress: string, lamports: number) {
        const fromWallet = Keypair.fromSecretKey(fromSecretKey);
        
        // Get the token account of the fromWallet address, and if it does not exist, use the solana balance to pay for and create the account
        const fromtokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            fromWallet, //fee payer
            new PublicKey(tokenAddress),
            fromWallet.publicKey
        );
        
        // Get the token account of the toPublicKey address, and if it does not exist, create it. The the fromWallet will pay for the creation of the account. 
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection, 
            fromWallet, //fee payer
            new PublicKey(tokenAddress), 
            new PublicKey(toPublicKey)
        );

        //Transfer the tokens. Returns the transaction signature.
        return await transfer(
            connection,
            fromWallet,
            fromtokenAccount.address,
            toTokenAccount.address,
            fromWallet.publicKey,
            lamports,
            []
        );
    }

    static async transferNFT(connection: typeof Connection, fromSecretKey: Uint8Array, toPublicKey: string, tokenAddress: string) {
        return await this.transferToken(connection, fromSecretKey, toPublicKey, tokenAddress, 1);
    }

    //Create a new token and send it to the provided toPublicKey. The fee payer and the to pubkey can be from the same wallet
    static async createToken(connection: typeof Connection, payerSecretKey: Uint8Array, toPublicKey: string,  numTokensToCreate: number) {
        //The payerWallet will be the wallet paying for the minting fees
        const payerWallet = Keypair.fromSecretKey(payerSecretKey);        

        //Mint the token. Returns the mint pubkey
        const mint = await createMint(connection, payerWallet, payerWallet.publicKey, null, 9);
        
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payerWallet, //fee payer
            mint,
            new PublicKey(toPublicKey)
        );
        
        //Mint the new tokens to the "toTokenAccount" account
        await mintTo(
            connection,
            payerWallet,
            mint,
            toTokenAccount.address,
            new PublicKey(toPublicKey),
            numTokensToCreate * LAMPORTS_PER_SOL,
            []
        );

        //Return the mint pubkey so it can be used to send tokens with transferTokens()
        return mint;
    }

    //Create a new NFT and send it to the provided toPublicKey. The fee payer and the to pubkey can be from the same wallet
    //In solana, an NFT is just a token that has a capped supply of 1 token that can't be divided (has no decimal points)
    static async createNFT(connection: typeof Connection, payerSecretKey: Uint8Array, toPublicKey: string) {
        //The payerWallet will be the wallet paying for the minting fees
        const payerWallet = Keypair.fromSecretKey(payerSecretKey);        

        //Create the NFT. The number of decimals is set to 0.
        const nftPubkey = await createMint(connection, payerWallet, payerWallet.publicKey, null, 0);
        
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payerWallet, //fee payer
            nftPubkey,
            new PublicKey(toPublicKey)
        );
        
        //Mint the NFT to the "toTokenAccount" account
        await mintTo(
            connection,
            payerWallet,
            nftPubkey,
            toTokenAccount.address,
            new PublicKey(toPublicKey),
            1,
            []
        );         

        //Remove the creators authourtity to mint new tokens. Since no mint authourity remains on the account, no new tokens can ever be created.
        setAuthority(connection,payerWallet,nftPubkey,payerWallet,AuthorityType.MintTokens,null);

        //Return the nft pubkey so it can be used to send tokens with transferNFT()
        return nftPubkey;
    }    
}
module.exports = solanaLib; 