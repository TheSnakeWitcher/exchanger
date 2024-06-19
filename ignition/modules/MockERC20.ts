import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import contractNames from "../../data/contractNames.json"

export default buildModule("MockERC20Module", (m) => {
    const mockERC20Contract = m.contract(contractNames.MockERC20, ["MOCKER", "MOCK"]);
    return { mockERC20Contract };
});
