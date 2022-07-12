import { ethers } from "ethers";
import "dotenv/config";
import * as ballotJson from "../../artifacts/contracts/CustomBallot.sol/CustomBallot.json";
import * as myTokenJson from "../../artifacts/contracts/Token.sol/MyToken.json";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
    "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

function convertStringArrayToBytes32(array: string[]) {
    const bytes32Array = [];
    for (let index = 0; index < array.length; index++) {
        bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
    }
    return bytes32Array;
}

async function main() {

    const wallet =
        process.env.MNEMONIC && process.env.MNEMONIC.length > 0
            ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
            : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);
    console.log(`Using address ${wallet.address}`);

    const provider = ethers.providers.getDefaultProvider("ropsten");
    const signer = wallet.connect(provider);
    const balanceBN = await signer.getBalance();
    const balance = Number(ethers.utils.formatEther(balanceBN));

    console.log(`Wallet balance ${balance}`);

    if (balance < 0.01) {
        throw new Error("Not enough ether");
    }

    console.log("Deploying Token contract");
    console.log("Ballot Proposals: ");

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

    console.log("Completed");
    console.log(`Ballot Contract deployed at ${ballotContract.address}`);
    console.log(`MyToken Contract deployed at ${tokenContract.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
