import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import contractNames from "../../data/contractNames.json"

export default buildModule("ExchangerModule", (m) => {
    const exchangerContract = m.contract(contractNames.Exchanger, [ 5 ]);
    return { exchangerContract }
});
