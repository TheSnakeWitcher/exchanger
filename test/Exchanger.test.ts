import env, { ethers } from "hardhat"
import { time, loadFixture, } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { expect } from "chai"
import { Signer } from "ethers";
import ExchangerModule from "../ignition/modules/Exchanger" ;
import MockERC20Module from "../ignition/modules/MockERC20" ;
import { Exchanger, IExchanger, MockERC20 } from "../typechain-types" ;
import { Exchanger as errors } from "../data/errors.json" ;
import { Exchanger as events } from "../data/events.json" ;

describe("Exchanger", function() {

    const feeFactor = 5 ;
    const amount = 10e4 ;
    const payAmount = 2 * amount ;
    const fee = ( amount * feeFactor / 10000 ) / 2 ;
    const orderId = 0 ;
    const orderId2 = 1 ;

    let owner : Signer ;
    let user : Signer ;
    let user2 : Signer ;
    let exchanger : Exchanger ;
    let token : MockERC20 ;
    let deadline : number ;

    async function deployFixture() {
        const { exchangerContract } = await env.ignition.deploy(ExchangerModule)
        const { mockERC20Contract } = await env.ignition.deploy(MockERC20Module)
        exchanger = exchangerContract as unknown as Exchanger ;
        token = mockERC20Contract as unknown as MockERC20 
    }

    before( async () => {
        [owner, user, user2] = await env.ethers.getSigners() ;
        deadline = (await time.latest()) * 5
    })

    beforeEach( async () => {
        await loadFixture(deployFixture);
    })

    describe("deployment()", function() {

        it("has specified owner", async () => {
            expect(await exchanger.owner()).to.equal(await owner.getAddress())
        })

        it("has specified feeFactor", async () => {
            expect(await exchanger.feeFactor()).to.equal(feeFactor)
        })

    })

    describe("buyItem()", function() {

        describe("native coin order", () => {

            beforeEach(async () => {
                await exchanger.connect(user)["listItem(uint256,uint64,uint256)"](orderId, deadline, amount)
            })

            it("change balances", async () => {
                await expect(
                    exchanger.connect(user2).buyItem(orderId, { value: amount + fee })
                ).to.changeEtherBalance(
                    await exchanger.getAddress(),
                    amount + fee
                )
            })

            it("emit OrderPurchased event with specified parameters", async () => {
                await expect(exchanger.connect(user2).buyItem(orderId, { value: payAmount }))
                    .to.emit(exchanger, events.OrderPurchased)
                    .withArgs(
                        orderId,
                        await user.getAddress(),
                        await user2.getAddress(),
                        amount,
                        ethers.ZeroAddress
                    )
            })

            it("fails if payment is insufficient", async () => {
                await expect(exchanger.connect(user2).buyItem(orderId, { value: amount / 2 }))
                    .to.revertedWithCustomError(exchanger, errors.AddressInsufficientBalance)
                    .withArgs(await user2.getAddress() )
            })

            it("fails if order doesn't exists", async () => {
                await expect(exchanger.connect(user2).buyItem(orderId2, { value: payAmount }))
                    .to.revertedWithCustomError(exchanger, errors.InvalidOrderState)
            })

            it("fails if order is paid", async () => {
                await exchanger.connect(user2).buyItem(orderId, { value: payAmount })
                await expect(exchanger.connect(user2).buyItem(orderId, { value: payAmount }))
                    .to.revertedWithCustomError(exchanger, errors.InvalidOrderState)
            })

            it("fails if buyer is seller",async () => {
                await expect (exchanger.connect(user).buyItem(orderId, { value: payAmount }))
                    .to.revertedWithCustomError(exchanger, errors.InvalidOrderBuyer)
            })

        })

        describe("erc20 order", () => {

            beforeEach(async () => {
                await exchanger.connect(user)
                    ["listItem(uint256,uint64,uint256,address)"]
                    (orderId, deadline, amount, await token.getAddress())

                await token.connect(owner).transfer(await user2.getAddress(), payAmount )
                await token.connect(user2).approve(await exchanger.getAddress(), amount + fee)
            })

            it("change balances when using erc20 token", async () => {

                await expect(
                    exchanger.connect(user2).buyItem(orderId, { value: payAmount })
                ).to.changeTokenBalance(
                    token,
                    await exchanger.getAddress(),
                    amount + fee
                )
            })

            it("emit OrderPurchased event with specified parameters", async () => {
                await expect(exchanger.connect(user2).buyItem(orderId))
                    .to.emit(exchanger, events.OrderPurchased)
                    .withArgs(
                        orderId,
                        await user.getAddress(),
                        await user2.getAddress(),
                        amount,
                        await token.getAddress()
                    )
            })

            it("fails if payment is insufficient", async () => {
                const balance = await token.balanceOf(await user2.getAddress()) 
                await token.connect(user2).transfer(await owner.getAddress() , balance)
                await expect(exchanger.connect(user2).buyItem(orderId))
                    .to.be.reverted
            })

            it("fails if order doesn't exists", async () => {

                await expect(exchanger.connect(user2).buyItem(orderId2))
                    .to.revertedWithCustomError(exchanger, errors.InvalidOrderState)
            })

            it("fails if order is paid", async () => {
                await exchanger.connect(user2).buyItem(orderId)
                await expect(exchanger.connect(user2).buyItem(orderId))
                    .to.revertedWithCustomError(exchanger, errors.InvalidOrderState)
            })

            it("fails if buyer is seller",async () => {
                await expect (exchanger.connect(user).buyItem(orderId))
                    .to.revertedWithCustomError(exchanger, errors.InvalidOrderBuyer)
            })

        })

    })

    describe("delistItem())", function() {

        it("emit OrderDeleted event with specified parameters", async () => {
            await exchanger.connect(user)["listItem(uint256,uint64,uint256)"](orderId, deadline, amount)
            await expect(exchanger.connect(user).delistItem(orderId))
                .to.emit(exchanger, events.OrderDeleted)
                .withArgs(orderId)
        })

        it("fails if sender isn't the seller or protocol owner", async () => {
            await exchanger.connect(user)["listItem(uint256,uint64,uint256)"](orderId, deadline, amount)
            await expect(exchanger.connect(user2).delistItem(orderId))
                .to.revertedWithCustomError(exchanger, errors.InvalidOrderSeller)
        })

        it("fails if order doesn't exist", async () => {
            await expect(exchanger.delistItem(orderId))
                .to.revertedWithCustomError(exchanger, errors.InvalidOrderState)
        })

        it("fails if order is paid",async () => {
            await exchanger.connect(user)["listItem(uint256,uint64,uint256)"](orderId, deadline, amount)
            await exchanger.connect(owner).buyItem(orderId, { value: payAmount })
            await expect(exchanger.delistItem(orderId))
                .to.revertedWithCustomError(exchanger, errors.InvalidOrderState)
        })

    })

    describe("complete()", () => {

        beforeEach( async () => {
            await exchanger.connect(user)["listItem(uint256,uint64,uint256)"](orderId, deadline, amount)
            await exchanger.connect(user2).buyItem(orderId, { value: amount + fee })
        })

        it("emit OrderCompleted event with specified args", async () => {
            await expect(exchanger.complete(orderId))
                .to.emit(exchanger, events.OrderCompleted)
                .withArgs(orderId)
        })

        it("change order state", async () => {
            await exchanger.complete(orderId)
            const order = await exchanger.getListing(orderId)
            expect(order.state).to.equal(3) // 3 corresponds to IExchanger.Completed
        })

        it("fails when is called by user", async () => {
            await expect(exchanger.connect(user).complete(orderId))
                .to.revertedWithCustomError(exchanger, errors.OwnableUnauthorizedAccount)
                .withArgs(await user.getAddress())
        })

        it("fails when order isn't paid", async () => {
            await exchanger.connect(user)["listItem(uint256,uint64,uint256)"](orderId2, deadline, amount)
            await expect(exchanger.connect(owner).complete(orderId2))
                .to.revertedWithCustomError(exchanger, errors.InvalidOrderState);
        })

    })

    describe("withdraw()", () => {

        describe("native coin withdraw()", () => {

            beforeEach(async () => {
                await exchanger.connect(user)["listItem(uint256,uint64,uint256)"](orderId, deadline, amount)
                await exchanger.connect(user2).buyItem(orderId, { value: amount + fee })
                await exchanger.connect(owner).complete(orderId)
            })

            it("sends corresponding funds", async () => {
                await expect(exchanger.connect(user).withdraw(orderId))
                    .to.changeEtherBalances(
                        [await owner.getAddress(), await user.getAddress()] ,
                        [fee, amount]
                    )
            })

            it("fails when the user that withdrawn is not the seller of the order", async () => {
                await expect(exchanger.connect(user2).withdraw(orderId))
                    .to.revertedWithCustomError(exchanger, errors.InvalidOrderSeller)
            })

        })

        describe("erc20 withdraw()", () => {

            beforeEach(async () => {
                await exchanger.connect(user)
                    ["listItem(uint256,uint64,uint256,address)"]
                    (orderId, deadline, amount, await token.getAddress())

                await token.connect(owner).transfer(await user2.getAddress(), payAmount )
                await token.connect(user2).approve(await exchanger.getAddress(), amount + fee)
                await exchanger.connect(user2).buyItem(orderId)
                await exchanger.connect(owner).complete(orderId)
            })

            it("sends corresponding funds", async () => {
                await expect(exchanger.connect(user).withdraw(orderId))
                    .to.changeTokenBalances(
                        token,
                        [await user.getAddress(), await owner.getAddress()],
                        [amount, fee]
                )
            })

            it("fails when the user that withdrawn is not the seller of the order", async () => {
                await expect(exchanger.connect(user2).withdraw(orderId))
                    .to.revertedWithCustomError(exchanger, errors.InvalidOrderSeller)
            })

        })

    })

    describe("setFeeFactor()", function() {

        const newFeeFactor = feeFactor + 5 ;

        it("set specified fee", async () => {
            await exchanger.connect(owner).setFeeFactor(newFeeFactor)
            expect(await exchanger.feeFactor()).to.equal(newFeeFactor)
        })

        it("fails when is called by user", async () => {
            await expect(exchanger.connect(user).setFeeFactor(newFeeFactor))
                .to.revertedWithCustomError(exchanger, errors.OwnableUnauthorizedAccount)
                .withArgs(await user.getAddress())
        })

    })

    describe("getListing()", function() {

        let order : IExchanger.OrderStructOutput 

        beforeEach( async () => {
            await exchanger.connect(user)["listItem(uint256,uint64,uint256)"](orderId, deadline, amount)
            order = await exchanger.getListing(orderId) ;
        })

        it("return order with correct seller", async () => {
            expect(order.seller).to.equal(await user.getAddress())
        })

        it("return order with correct deadline", async () => {
            expect(order.deadline).to.equal(deadline)
        })

        it("return order with correct amount", async () => {
            expect(order.amount).to.equal(amount)
        })

    })

    describe("listItem()", function() {

        it("create order with specified parameters", async () => {
            await exchanger.connect(user)["listItem(uint256,uint64,uint256)"](orderId, deadline, amount)
            const order = await exchanger.getListing(orderId) ;
            expect(order.seller).to.equal(await user.getAddress())
        })

        it("create order with specified parameters including token", async () => {
            await exchanger.connect(user)["listItem(uint256,uint64,uint256,address)"](orderId, deadline, amount, await token.getAddress())
            const order = await exchanger.getListing(orderId) ;
            expect(order.seller).to.equal(await user.getAddress())
        })

        it("emit OrderCreated event with specified parameters", async () => {
            await expect(exchanger.connect(user)["listItem(uint256,uint64,uint256)"](orderId, deadline, amount))
                .to.emit(exchanger, events.OrderCreated)
                .withArgs(orderId, await user.getAddress(), deadline, amount, ethers.ZeroAddress)
        })

        it("fails if order already exists", async () => {
            await exchanger.connect(user)["listItem(uint256,uint64,uint256)"](orderId, deadline, amount)
            await expect(
                exchanger.connect(user)["listItem(uint256,uint64,uint256)"](orderId, deadline, amount)
            ).to.revertedWithCustomError(exchanger, errors.InvalidOrderData)
        })

        it("fails if deadline is lower that current block timestamp", async () => {
            await expect(
                exchanger.connect(user)["listItem(uint256,uint64,uint256)"](orderId, 0 , amount)
            ).to.revertedWithCustomError(exchanger, errors.InvalidOrderData)
        })

        it("fails if amount is lower 0", async () => {
            await expect(
                exchanger.connect(user)["listItem(uint256,uint64,uint256)"](orderId, deadline, 0)
            ).to.revertedWithCustomError(exchanger, errors.InvalidOrderData)
        })

    })

});
