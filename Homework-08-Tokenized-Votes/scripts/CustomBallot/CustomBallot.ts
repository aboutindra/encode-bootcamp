import { Contract, ethers } from "ethers";
import "dotenv/config";
import * as ballotJson from "../../artifacts/contracts/CustomBallot.sol/CustomBallot.json";
import * as myTokenJson from "../../artifacts/contracts/Token.sol/MyToken.json";
// eslint-disable-next-line node/no-missing-import

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
    "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

const BASE_VOTE_POWER = 10;
const USED_VOTE_POWER = 5;

function convertStringArrayToBytes32(array: string[]) {
    const bytes32Array = [];
    for (let index = 0; index < array.length; index++) {
        bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
    }
    return bytes32Array;
}

async function deploy() {
    const wallet =
        process.env.MNEMONIC && process.env.MNEMONIC.length > 0
            ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
            : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);
    console.log(`Using address ${wallet.address}`);

    const provider = new ethers.providers.InfuraProvider("ropsten", {
        projectId: "8570e2fb5c5846798c582f517a68e60b",
        projectSecret: "3bbc5cf6a8534f1dbd797e9a05822a66",
    });
    const signer = wallet.connect(provider);
    const balanceBN = await signer.getBalance();
    const balance = Number(ethers.utils.formatEther(balanceBN));

    console.log(`Wallet balance ${balance}`);

    if (balance < 0.01) {
        throw new Error("Not enough ether");
    }

    const proposals = ["Proposal 1", "Proposal 2", "Proposal 3"];
    if (proposals.length < 2) throw new Error("Not enough proposals provided");
    proposals.forEach((element, index) => {
        console.log(`Proposal N. ${index + 1}: ${element}`);
    });

    const tokenFactory = new ethers.ContractFactory(
        myTokenJson.abi,
        myTokenJson.bytecode,
        signer
    );

    const tokenContract = await tokenFactory.deploy();
    console.log("Awaiting confirmations token contract");

    const ballotFactory = new ethers.ContractFactory(
        ballotJson.abi,
        ballotJson.bytecode,
        signer
    );
    const ballotContract = await ballotFactory.deploy(
        convertStringArrayToBytes32(proposals),
        tokenContract.address
    );

    console.log("Awaiting confirmations ballot contract");

    await tokenContract.deployed();
    await ballotContract.deployed();
    return { ballotContract, tokenContract, provider, signer }
}

function setListeners(
    ballotContract: ethers.Contract,
    tokenContract: ethers.Contract,
    provider: ethers.providers.BaseProvider
) {
    console.log("Setting listeners on");
    const eventFilter2 = ballotContract.filters.Voted();
    provider.on(eventFilter2, (log: any) => {
        console.log("New vote cast");
        console.log({ log });
    });
    console.log(`Total of ${provider.listenerCount()} listeners set`);
}

async function Populate(
    ballotContract: ethers.Contract,
    tokenContract: ethers.Contract,
    provider: ethers.providers.BaseProvider,
    signer: ethers.Signer
) {
    console.log("Populating transactions");
    const wallet1 = ethers.Wallet.createRandom().connect(provider);
    const wallet2 = ethers.Wallet.createRandom().connect(provider);
    const wallet3 = ethers.Wallet.createRandom().connect(provider);
    const wallet4 = ethers.Wallet.createRandom().connect(provider);

    console.log("Minting token to 4 Wallet")

    const mint1 = await tokenContract.mint(wallet2.address, ethers.utils.parseEther(BASE_VOTE_POWER.toFixed(18)));
    const mint2 = await tokenContract.mint(wallet2.address, ethers.utils.parseEther(BASE_VOTE_POWER.toFixed(18)));
    const mint3 = await tokenContract.mint(wallet3.address, ethers.utils.parseEther(BASE_VOTE_POWER.toFixed(18)));
    const mint4 = await tokenContract.mint(wallet4.address, ethers.utils.parseEther(BASE_VOTE_POWER.toFixed(18)));

    await mint1.wait();
    console.log(`Success minted vote token to ${wallet1.address} wallet address`)

    await mint2.wait();
    console.log(`Success minted vote token to ${wallet2.address} wallet address`)

    await mint3.wait();
    console.log(`Success minted vote token to ${wallet3.address} wallet address`)

    await mint4.wait();
    console.log(`Success minted vote token to ${wallet4.address} wallet address`)

    console.log("Minted token to 4 wallets");

    let tx;

    tx = await ballotContract.proposals(0);
    console.log("Proposals 1 : ",tx)
    tx = await ballotContract.proposals(1);
    console.log("Proposals 2 : ",tx)
    tx = await ballotContract.proposals(2);
    console.log("Proposals 3 : ",tx)

    // console.log(`\nFunding account ${wallet1.address}`);
    // tx = await signer.sendTransaction({
    //     to: wallet1.address,
    //     value: ethers.utils.parseEther("0.01"),
    //     gasLimit: 100000
    // });
    // await tx.wait();

    tx = await tokenContract.getVotes(
        wallet1.address
    );
    console.log("\nSpent Vote Power : ", tx)

    console.log("Delegate address :", wallet1.address);
    tx = await tokenContract.connect(wallet1).delegate(wallet1.address);
    await tx.wait();

    // console.log(`\nFunding account ${wallet2.address}`);
    // tx = await signer.sendTransaction({
    //     to: wallet2.address,
    //     value: ethers.utils.parseEther("0.01"),
    //     gasLimit: 100000
    // });
    // await tx.wait();

    tx = await tokenContract.getVotes(
        wallet2.address
    );
    console.log("\nSpent Vote Power : ", tx)

    console.log("Delegate address :", wallet2.address);
    tx = await tokenContract.connect(wallet2).delegate(wallet2.address);
    await tx.wait();

    // console.log(`\nFunding account ${wallet3.address}`);
    // tx = await signer.sendTransaction({
    //     to: wallet3.address,
    //     value: ethers.utils.parseEther("0.01"),
    //     gasLimit: 100000
    // });
    // await tx.wait();

    tx = await tokenContract.getVotes(
        wallet3.address
    );
    console.log("\nSpent Vote Power : ", tx)

    console.log("Delegate address :", wallet3.address);
    tx = await tokenContract.connect(wallet3).delegate(wallet3.address);
    await tx.wait();

    // console.log(`\nFunding account ${wallet4.address}`);
    // tx = await signer.sendTransaction({
    //     to: wallet4.address,
    //     value: ethers.utils.parseEther("0.01"),
    //     gasLimit: 100000
    // });
    // await tx.wait();

    tx = await tokenContract.getVotes(
        wallet4.address
    );
    console.log("\nSpent Vote Power : ", tx)

    console.log("Delegate address :", wallet4.address);
    tx = await tokenContract.connect(wallet4).delegate(wallet4.address);
    await tx.wait();

    console.log("\n===== VOTING =====");

    console.log("\n Wallet - 1 (vote proposal 0)")

    tx = await tokenContract.getVotes(
        wallet1.address
    );
    console.log("\nSpent Vote Power : ", tx)

    tx = await ballotContract.connect(wallet1).vote(0, USED_VOTE_POWER, {gasLimit: 300000});
    await tx.wait();


    console.log("\n Wallet - 2 (vote proposal 1)")

    tx = await tokenContract.getVotes(
        wallet2.address
    );
    console.log("\nSpent Vote Power : ", tx)

    tx = await ballotContract.connect(wallet2).vote(1, USED_VOTE_POWER, {gasLimit: 300000});
    await tx.wait();


    console.log("\n Wallet - 3 (vote proposal 2)")

    tx = await tokenContract.getVotes(
        wallet3.address
    );

    console.log("\nSpent Vote Power : ", tx)
    tx = await ballotContract.connect(wallet3).vote(2, USED_VOTE_POWER, {gasLimit: 300000});
    await tx.wait();


    console.log("\n Wallet - 4 (vote proposal 0)")

    tx = await tokenContract.getVotes(
        wallet4.address
    );
    console.log("\nSpent Vote Power : ", tx)

    tx = await ballotContract.connect(wallet4).vote(0, USED_VOTE_POWER, {gasLimit: 300000});
    await tx.wait();

    console.log("\n ===== Done Voting ==== ");
    console.log("\n ===== Proposal Result ====");

    tx = await ballotContract.winningProposal();
    console.log("\n Wining Proposal : ", tx)

    tx = await ballotContract.winningName();
    console.log("\n Wining Name : ", tx)

    console.log("Done");
}

async function main() {
    const { ballotContract, tokenContract, provider, signer } = await deploy();
    setListeners(ballotContract, tokenContract, provider);
    await Populate(ballotContract, tokenContract, provider, signer);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
