const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { groth16, plonk } = require("snarkjs");

const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);
// Lines above import the necessary libraries for the tests.

describe("HelloWorld", function () { // Test for the HelloWorld contract
    this.timeout(100000000); // Timeout is set high to allow the contract to operate
    let Verifier;
    let verifier; // verifier contracts are defined but not assigned

    beforeEach(async function () { // Before tests, deploy the contract and assign it to the verifier and Verifier variables
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Circuit should multiply two numbers correctly", async function () { // Tests that the circom circuit multiplies two numbers correctly
        const circuit = await wasm_tester("contracts/circuits/HelloWorld.circom"); // Wasm_tester object for the HelloWorld circuit

        const INPUT = {
            "a": 2,
            "b": 3
        }

        const witness = await circuit.calculateWitness(INPUT, true); // Calculates the witness for the circuit

        //console.log(witness);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1))); // Sanity Check
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(6))); // Output should be 6

    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        const { proof, publicSignals } = await groth16.fullProve({"a":"2","b":"3"}, "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","contracts/circuits/HelloWorld/circuit_final.zkey");
        // proof and signal objects are using the groth16 function 

        console.log('2x3 =',publicSignals[0]); // Logs the output of the circuit for 2x3
        
        const calldata = await groth16.exportSolidityCallData(proof, publicSignals); // Exports the calldata for the circuit
    
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString()); // Removes the quotes and spaces, splits it into an array and creates bigints
        //console.log(calldata)
        // call data is ["0x1b1afa37551e265ad5d56f42eb28fb141d4152c135d43851f8ebcee7e7948f86", "0x180886eaa3b31fee9c527bd28d1a2f925268e8b82c59df7ac68484b7565306aa"],[["0x2cc4481193bd82aae44c7ad79851a86a28f61f773334205477e172cea1381410", "0x18dc242ae145e13c84a6f6e575cf00726d71e851f97a285410bc8274d74f388c"],["0x2c3d250e6702580a0914adf1ea291abd3f78154935a39008c7fe2ed4f61ee5f7", "0x07caaa607e60bf21f368fcd020589831e0d75390242febd1eb79fb461d4b19f4"]],["0x0b516aae78086b749bbd0127e6057e215a8eb3be86fd15a281d44cdc9ffadb85", "0x21c76014396f48444fe19a99a3a306c34aa9e1bd77a7815e08bd4e0eb8bd0f1d"],["0x0000000000000000000000000000000000000000000000000000000000000006"]
        const a = [argv[0], argv[1]]; // defines a using the first values
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]]; // defines b using the values in the second array in the data
        const c = [argv[6], argv[7]]; // defines c using the third value set in the calldata
        const Input = argv.slice(8); // defines Input using the values after the third array in the calldata (It is the output of the circuit)
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true; // using the verifier contracts' verifyProof function, checks that the proof is correct with the given inputs
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
    this.timeout(100000000);
    let Verifier;
    let verifier;

    beforeEach(async function () {
        //[assignment] insert your script here

        Verifier = await ethers.getContractFactory("Multiplier3Verifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Circuit should multiply three numbers correctly", async function () {
        //[assignment] insert your script here
        const circuit = await wasm_tester("contracts/circuits/Multiplier3.circom");
        const INPUT = {
            "a": 2,
            "b": 3,
            "c": 4
        }
        const witness = await circuit.calculateWitness(INPUT, true);

        //console.log(witness);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(24)));
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const {proof, publicSignals} = await groth16.fullProve({"a":"2","b":"3","c":"4"}, "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3/circuit_final.zkey");
        console.log('2x3x4 =',publicSignals[0]);
        const calldata = await groth16.exportSolidityCallData(proof, publicSignals);
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });

    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with PLONK", function () {
    this.timeout(100000000);
    let Verifier;
    let verifier;

    beforeEach(async function () {
        //[assignment] insert your script here
        Verifier = await ethers.getContractFactory("Multiplier3_plonkVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const {proof, publicSignals} = await plonk.fullProve({"a":"2","b":"3","c":"4"}, "contracts/circuits/Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3_plonk/circuit_final.zkey");

        const calldata = await plonk.exportSolidityCallData(proof, publicSignals);
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
        const prooff = argv[0]
        const publicSignalsf = argv.slice(1)
        
        //expect(await verifier.verifyProof(prooff, publicSignalsf)).to.be.true; not done
    });
    
    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        expect(await verifier.verifyProof([], [0])).to.be.false;
    });
});