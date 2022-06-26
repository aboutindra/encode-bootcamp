import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { Ballot } from "../../typechain";

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

async function giveRightToVote(ballotContract: Ballot, voterAddress: any) {
  const tx = await ballotContract.giveRightToVote(voterAddress);
  await tx.wait();
}

describe("Ballot", function () {
  let ballotContract: Ballot;
  let accounts: any[];

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    const ballotFactory = await ethers.getContractFactory("Ballot");
    ballotContract = await ballotFactory.deploy(
      convertStringArrayToBytes32(PROPOSALS)
    );
    await ballotContract.deployed();
  });

  describe("when the contract is deployed", function () {
    it("has the provided proposals", async function () {
      for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.proposals(index);
        expect(ethers.utils.parseBytes32String(proposal.name)).to.eq(
          PROPOSALS[index]
        );
      }
    });

    it("has zero votes for all proposals", async function () {
      for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.proposals(index);
        expect(proposal.voteCount.toNumber()).to.eq(0);
      }
    });

    it("sets the deployer address as chairperson", async function () {
      const chairperson = await ballotContract.chairperson();
      expect(chairperson).to.eq(accounts[0].address);
    });

    it("sets the voting weight for the chairperson as 1", async function () {
      const chairpersonVoter = await ballotContract.voters(accounts[0].address);
      expect(chairpersonVoter.weight.toNumber()).to.eq(1);
    });
  });

  describe("when the chairperson interacts with the giveRightToVote function in the contract", function () {
    it("gives right to vote for another address", async function () {
      const voterAddress = accounts[1].address;
      const tx = await ballotContract.giveRightToVote(voterAddress);
      await tx.wait();
      const voter = await ballotContract.voters(voterAddress);
      expect(voter.weight.toNumber()).to.eq(1);
    });

    it("can not give right to vote for someone that has voted", async function () {
      const voterAddress = accounts[1].address;
      await giveRightToVote(ballotContract, voterAddress);
      await ballotContract.connect(accounts[1]).vote(0);
      await expect(
        giveRightToVote(ballotContract, voterAddress)
      ).to.be.revertedWith("The voter already voted.");
    });

    it("can not give right to vote for someone that already has voting rights", async function () {
      const voterAddress = accounts[1].address;
      await giveRightToVote(ballotContract, voterAddress);
      await expect(
        giveRightToVote(ballotContract, voterAddress)
      ).to.be.revertedWith("");
    });
  });

  describe("when the voter interact with the vote function in the contract", function () {
    // TODO
    it("can not to vote for someone that has no right to vote", async function () {
      const voting = ballotContract.connect(accounts[0]).vote(0);
      await (await voting).wait();
      expect(voting).to.be.revertedWith("Has no right to vote");
    });

    it("can not to vote for someone that already voted", async function () {
      const voterAddress = accounts[1].address;
      await giveRightToVote(ballotContract, voterAddress);
      const voting = await ballotContract.connect(accounts[1]).vote(0);
      await voting.wait();

      await expect(
        ballotContract.connect(accounts[1]).vote(0)
      ).to.be.revertedWith("Already voted.");
    });

    it("voter can vote to a proposal", async function () {
      const voterAddress = accounts[1].address;
      await giveRightToVote(ballotContract, voterAddress);
      await ballotContract.connect(accounts[1]).vote(0);

      const chairpersonVoter = await ballotContract.voters(accounts[1].address);
      expect(chairpersonVoter.weight.toNumber()).to.eq(1);
    });
  });

  describe("when the voter interact with the delegate function in the contract", function () {
    // TODO
    it("can not delegate that address already voted", async function () {
      const voterAddress = accounts[1].address;
      await giveRightToVote(ballotContract, voterAddress);
      await ballotContract.connect(accounts[1]).vote(0);

      const delegateAddress = ballotContract.delegate(voterAddress);
      await (await delegateAddress).wait();
      expect(delegateAddress).to.be.revertedWith("You already voted.");
    });

    it("can not delegate self address", async function () {
      const voterAddress = accounts[0].address;

      await expect(
        ballotContract.connect(accounts[0]).delegate(voterAddress)
      ).to.be.revertedWith("Self-delegation is disallowed.");
    });

    it("can not delegate address that that equal with self address", async function () {
      const voterAddress = accounts[1].address;
      await ballotContract.connect(accounts[1]).delegate(accounts[0].address);
      await expect(
        ballotContract.connect(accounts[0]).delegate(voterAddress)
      ).to.be.revertedWith("Found loop in delegation.");
    });
  });

  describe("when the an attacker interact with the giveRightToVote function in the contract", function () {
    // TODO
    it("can not give right to vote for someone that has voted", async function () {
      const voterAddress = accounts[1].address;
      await giveRightToVote(ballotContract, voterAddress);
      await ballotContract.connect(accounts[1]).vote(0);
      await expect(
        giveRightToVote(ballotContract, voterAddress)
      ).to.be.revertedWith("The voter already voted.");
    });

    it("can not give right to vote for someone that already has voting rights", async function () {
      const voterAddress = accounts[1].address;
      await giveRightToVote(ballotContract, voterAddress);
      await expect(
        giveRightToVote(ballotContract, voterAddress)
      ).to.be.revertedWith("");
    });
  });

  describe("when the an attacker interact with the vote function in the contract", function () {
    // TODO
    it("can not to vote for someone that already voted", async function () {
      const voterAddress = accounts[1].address;
      await giveRightToVote(ballotContract, voterAddress);
      const voting = await ballotContract.connect(accounts[1]).vote(0);
      await voting.wait();

      await expect(
        ballotContract.connect(accounts[1]).vote(0)
      ).to.be.revertedWith("Already voted.");
    });

    it("voter can vote to a proposal", async function () {
      const voterAddress = accounts[1].address;
      await giveRightToVote(ballotContract, voterAddress);
      await ballotContract.connect(accounts[1]).vote(0);

      const chairpersonVoter = await ballotContract.voters(accounts[1].address);
      expect(chairpersonVoter.weight.toNumber()).to.eq(1);
    });
  });

  describe("when the an attacker interact with the delegate function in the contract", function () {
    // TODO
    it("can not delegate self address", async function () {
      const voterAddress = accounts[0].address;

      await expect(
        ballotContract.connect(accounts[0]).delegate(voterAddress)
      ).to.be.revertedWith("Self-delegation is disallowed.");
    });

    it("can not delegate address that that equal with self address", async function () {
      const voterAddress = accounts[1].address;
      await ballotContract.connect(accounts[1]).delegate(accounts[0].address);
      await expect(
        ballotContract.connect(accounts[0]).delegate(voterAddress)
      ).to.be.revertedWith("Found loop in delegation.");
    });
  });

  describe("when someone interact with the winningProposal function before any votes are cast", function () {
    it("get winning proposal before any votes are cast", async function () {
      const winnerProposal = await ballotContract.winningProposal();
      await expect(winnerProposal).to.be.eq(0);
    });
  });

  describe("when someone interact with the winningProposal function after one vote is cast for the first proposal", function () {
    it("get winning proposal after one vote is cast", async function () {
      await giveRightToVote(ballotContract, accounts[1].address);
      await ballotContract.connect(accounts[1]).vote(0);
      const winnerProposal = await ballotContract.winningProposal();
      await expect(winnerProposal).to.be.eq(0);
    });
  });

  describe("when someone interact with the winnerName function before any votes are cast", function () {
    it("get winner proposal before any votes are cast", async function () {
      const winnerProposal = await ballotContract.winnerName();
      const convert = ethers.utils.formatBytes32String("Proposal 1");
      await expect(winnerProposal).to.be.eq(convert);
    });
  });

  describe("when someone interact with the winnerName function after one vote is cast for the first proposal", function () {
    it("get winner proposal after one vote is cast", async function () {
      await giveRightToVote(ballotContract, accounts[1].address);
      await ballotContract.connect(accounts[1]).vote(0);
      const winnerProposal = await ballotContract.winnerName();
      const convert = ethers.utils.formatBytes32String("Proposal 1");
      await expect(winnerProposal).to.be.eq(convert);
    });
  });

  describe("when someone interact with the winningProposal function and winnerName after 5 random votes are cast for the proposals", function () {
    it("get winning proposal after five vote is cast", async function () {
      const [addrOwner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
      accounts[0] = addrOwner;
      accounts[1] = addr1;
      accounts[2] = addr2;
      accounts[3] = addr3;
      accounts[4] = addr4;

      await Promise.all([
        giveRightToVote(ballotContract, accounts[0].address),
        giveRightToVote(ballotContract, accounts[1].address),
        giveRightToVote(ballotContract, accounts[2].address),
        giveRightToVote(ballotContract, accounts[3].address),
        giveRightToVote(ballotContract, accounts[4].address),
      ]);

      await Promise.all([
        ballotContract.connect(accounts[0]).vote(0),
        ballotContract.connect(accounts[1]).vote(1),
        ballotContract.connect(accounts[2]).vote(0),
        ballotContract.connect(accounts[3]).vote(2),
        ballotContract.connect(accounts[4]).vote(0),
      ]);

      const winnerProposal = await ballotContract.winningProposal();
      await expect(winnerProposal).to.be.eq(0);
    });

    it("get winner proposal after five vote is cast", async function () {
      const [addrOwner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
      accounts[0] = addrOwner;
      accounts[1] = addr1;
      accounts[2] = addr2;
      accounts[3] = addr3;
      accounts[4] = addr4;

      await Promise.all([
        giveRightToVote(ballotContract, accounts[0].address),
        giveRightToVote(ballotContract, accounts[1].address),
        giveRightToVote(ballotContract, accounts[2].address),
        giveRightToVote(ballotContract, accounts[3].address),
        giveRightToVote(ballotContract, accounts[4].address),
      ]);

      await Promise.all([
        ballotContract.connect(accounts[0]).vote(0),
        ballotContract.connect(accounts[1]).vote(1),
        ballotContract.connect(accounts[2]).vote(0),
        ballotContract.connect(accounts[3]).vote(2),
        ballotContract.connect(accounts[4]).vote(0),
      ]);

      const convert = ethers.utils.formatBytes32String("Proposal 1");
      const winnerProposal = await ballotContract.winnerName();
      await expect(winnerProposal).to.be.eq(convert);
    });
  });
});
