const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const { groth16, plonk } = require("snarkjs");

function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        if (o===null) return null;
        const res = {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

describe("HelloWorld", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        // to prove a(1) * b(2) = 2 using groth16 with the verification key(zkey)
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2"}, "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","contracts/circuits/HelloWorld/circuit_final.zkey");

        // logging. publicSignals are the output from groth16.fullProve
        console.log('1x2 =',publicSignals[0]);

        // convert string(publicSignals) into big int.
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        // convert string(proof) into big int
        const editedProof = unstringifyBigInts(proof);
        // export call data to be transferred to a smart contract
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
    
        // flatten the array (calldata)
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    
        // parse into parameters used to verify the proof (a,b,c)
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);

        // verify the proof
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with Groth16", function () {

    beforeEach(async function () {
        //[assignment] insert your script here
        Verifier = await ethers.getContractFactory("Multiplier3Verifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2","c":"3"}, "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3/circuit_final.zkey");

        console.log('1x2x3 =',publicSignals[0]);

        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
    
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);

        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;

    });
    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        let a = [0, 0]
        let b = [[0, 0],[0, 0],]
        let c = [0, 0]
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false
    });
});


describe("Multiplier3 with PLONK", function () {

    beforeEach(async function () {
        //[assignment] insert your script here
        Verifier = await ethers.getContractFactory("PlonkVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const { proof, publicSignals } = await plonk.fullProve({"a":"1","b":"2","c":"3"}, "contracts/circuits/_plonkMultiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/_plonkMultiplier3/circuit_final.zkey");

        console.log('1x2x3 =',publicSignals[0]);

        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);
        const calldata = await plonk.exportSolidityCallData(editedProof, editedPublicSignals);
    
        const input = calldata.split(",");
        expect(await verifier.verifyProof(input[0], JSON.parse(input[1]))).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        const a = 0;
        const b = [0];

        expect(await verifier.verifyProof(a, b)).to.be.false
    });
});