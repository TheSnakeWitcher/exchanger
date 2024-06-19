import { HardhatUserConfig, vars } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@nomicfoundation/hardhat-ignition"
import "@nomiclabs/hardhat-solhint";
import "solidity-docgen"
import "hardhat-tracer"
import "hardhat-inspect"


const accounts = [ vars.get("PRIVATE_KEY") ] ;
const POLYGON_SCAN_KEY = vars.get("POLYGON_SCAN_KEY") ;


const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.26",
        settings: {
            viaIR: true,
        }
    },
    networks: {
        polygon: {
            chainId: 137,
            url: "https://polygon-rpc.com",
            accounts
        },

        mumbai: {
            chainId: 80001,
            url: "https://polygon-mumbai.api.onfinality.io/public",
            accounts
        }
    },
    etherscan: {
        apiKey: {
            mumbai: POLYGON_SCAN_KEY
        }
    },
    docgen: {
        outputDir: "./doc",
    }
};


export default config;
