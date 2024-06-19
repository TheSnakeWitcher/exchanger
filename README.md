# Exchanger

A contract for agreements between two users to sell a off-chain tangible item

## Solution

These contract allow a `seller` to sell a tangible item by creating a order in the `Exchanger` contract
which will handle exchange of funds. To buy the item a `buyer` must deposit the asset amount requested
by the seller plus a fee charged by the protocol owner. For simplicity the fee is charged only to the
buyer.

These assume that the company who own the contract(protocol owner) handles also the delivery of
the exchanged item(logistics), so if during the process is determined that the order isn't
trustworty(maybe the item doesn't match its description) the order may be deleted by protcol
owner, additionally the seller can cancel the order to.

Every order needs an unique `id` which should be generad offchain to avoid more on-chain computations
and optionally a seller may provide a `deadline` for time limited orders.

A reference documentation can be found [here](https://github.com/TheSnakeWitcher/exchanger/blob/main/doc/index.md)
